import os
from functools import lru_cache
from typing import Annotated, Any, Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from backend.credits import CreditService, fail
from backend.credit_store import FirestoreStore


def enabled():
    return os.getenv('CREDITS_ENABLED', 'false').lower() == 'true'


@lru_cache(maxsize=1)
def service():
    if not enabled():
        fail('credits_disabled', 'Quản lý credit chưa được bật trên backend.', 503)
    try:
        admins = [s.strip() for s in os.getenv('CREDIT_ADMIN_UIDS', '').split(',') if s.strip()]
        if not admins:
            raise ValueError('Administrator configuration required')
        return CreditService(FirestoreStore(os.getenv('FIREBASE_PROJECT_ID', 'biogen-ai')),
                             os.getenv('CREDIT_NAMESPACE', 'biogen_preview'), admins)
    except Exception:
        fail('credit_storage_unavailable', 'Chưa cấu hình kho credit và tài khoản quản trị trên backend.', 503)


class CreateExam(BaseModel):
    requestId: str = Field(min_length=8, max_length=80)
    blueprint: dict[str, Any]
    slots: list[dict[str, Any]] = Field(min_length=1, max_length=40)


class GenerateCreditItem(BaseModel):
    slotId: str = Field(min_length=1, max_length=150)
    requestId: str = Field(min_length=8, max_length=80)
    replace: bool = False
    lang: Literal['vi', 'en'] = 'vi'


class GenerateCreditBatch(BaseModel):
    slotIds: list[Annotated[str, Field(min_length=1, max_length=150)]] = Field(min_length=1, max_length=40)
    requestId: str = Field(min_length=8, max_length=80)
    lang: Literal['vi', 'en'] = 'vi'


class AdminChange(BaseModel):
    uid: str = Field(min_length=1, max_length=128)
    requestId: str = Field(min_length=8, max_length=80)
    status: Literal['pending', 'approved', 'blocked'] | None = None
    package: Literal[10, 20, 30] | None = None
    trial: bool = False
    note: str = Field(min_length=1, max_length=500)
    paymentReference: str | None = Field(default=None, min_length=3, max_length=120)
    manualPackage: Literal[3] | None = None
    purchaseId: str | None = Field(default=None, min_length=8, max_length=80)


class AdminAdjustment(BaseModel):
    model_config = {'extra': 'forbid'}
    uid: str = Field(min_length=1, max_length=128)
    requestId: str = Field(min_length=8, max_length=80)
    product: Literal['exam', 'manual']
    action: Literal['add', 'remove']
    amount: int = Field(strict=True, ge=1, le=10000)
    note: str = Field(min_length=1, max_length=500)


class Purchase(BaseModel):
    requestId: str = Field(min_length=8, max_length=80)
    product: Literal['exam', 'manual']
    package: Literal[3, 10, 20, 30]
    note: str = Field(default='', max_length=500)


class ManualBatch(BaseModel):
    prompt: str = Field(min_length=20, max_length=16000)
    expectedCount: int = Field(ge=1, le=40)
    lang: Literal['vi', 'en'] = 'vi'
    criteria: dict[str, Any] | None = None


class ManualRun(BaseModel):
    requestId: str = Field(min_length=8, max_length=80)
    batches: list[ManualBatch] = Field(min_length=1, max_length=40)


class ReviewItem(BaseModel):
    slotId: str
    part: Literal['mcq', 'tf', 'short']
    order: int
    question: dict[str, Any]


class Review(BaseModel):
    generatedItems: list[ReviewItem] = Field(max_length=40)
    approvedSlotIds: list[str] = Field(max_length=40)
    lockedQuestionIds: list[str] = Field(max_length=40)


class Refund(BaseModel):
    note: str = Field(min_length=1, max_length=500)


def build_router(require_user, parse_slot, generate, generate_batch):
    router = APIRouter(prefix='/api/credits')

    def uid(user):
        return str(user.get('uid') or user['sub'])

    def admin(user=Depends(require_user)):
        if uid(user) not in service().admins:
            fail('admin_required', 'Chỉ quản trị được thực hiện thao tác này.', 403)
        return user

    @router.get('/me')
    def me(user=Depends(require_user)):
        if not enabled():
            return {'enabled': False}
        return service().me(user)

    @router.get('/history')
    def history(user=Depends(require_user)):
        return service().history(uid(user))

    @router.get('/purchases')
    def purchases(user=Depends(require_user)):
        return service().purchases(uid(user))

    @router.post('/purchases')
    def purchase(payload: Purchase, user=Depends(require_user)):
        return service().request_purchase(user, payload.requestId, payload.product, payload.package, payload.note)

    @router.post('/purchases/{purchase_id}/report-payment')
    def report_payment(purchase_id: str, user=Depends(require_user)):
        return service().report_payment(user, purchase_id)

    @router.post('/purchases/{purchase_id}/prepare-payment')
    def prepare_payment(purchase_id: str, user=Depends(require_user)):
        return service().prepare_purchase_payment(user, purchase_id)

    @router.post('/manual-runs')
    def manual_run(payload: ManualRun, user=Depends(require_user)):
        return service().create_manual_run(user, payload.requestId, [b.model_dump() for b in payload.batches])

    @router.get('/manual-runs/{run_id}')
    def get_manual_run(run_id: str, user=Depends(require_user)):
        return service().get_manual_run(user, run_id)

    @router.post('/manual-runs/{run_id}/cancel')
    def cancel_manual(run_id: str, user=Depends(require_user)):
        return service().cancel_manual(user, run_id)

    @router.get('/admin/purchases')
    def admin_purchases(user=Depends(admin)):
        credits = service()
        return credits.store.list_matching(f'{credits.namespace}_purchase_inbox', 'status', 'pending', 100)

    @router.get('/admin/payment-events')
    def payment_events(user=Depends(admin)):
        credits = service()
        return credits.store.list(f'{credits.namespace}_payment_events', 100)

    @router.post('/admin/accounts/{account_uid}/purchases/{purchase_id}/reject')
    def reject_purchase(account_uid: str, purchase_id: str, payload: Refund, user=Depends(admin)):
        return service().reject_purchase(uid(user), account_uid, purchase_id, payload.note)

    @router.get('/exams')
    def exams(user=Depends(require_user)):
        return service().list_exams(uid(user))

    @router.post('/exams')
    def create(payload: CreateExam, user=Depends(require_user)):
        slots = [parse_slot(slot).model_dump() for slot in payload.slots]
        return service().create(user, payload.requestId, payload.blueprint, slots)

    @router.get('/exams/{exam_id}')
    def get_exam(exam_id: str, user=Depends(require_user)):
        return service().get_exam(user, exam_id)

    @router.post('/exams/{exam_id}/items')
    def item(exam_id: str, payload: GenerateCreditItem, user=Depends(require_user)):
        credits = service()
        claim = credits.claim(user, exam_id, payload.slotId, payload.requestId, payload.replace)
        if 'cached' in claim:
            return claim['cached']
        try:
            result = generate(parse_slot(claim['slot']), payload.lang, user,
                lambda usage: credits.record_usage(user, exam_id, claim['nonce'], usage))
            return credits.finish(user, exam_id, claim['nonce'], result.model_dump())
        except Exception:
            credits.release(user, exam_id, claim['nonce'])
            raise

    @router.post('/exams/{exam_id}/generate')
    def batch(exam_id: str, payload: GenerateCreditBatch, user=Depends(require_user)):
        credits = service()
        claim = credits.claim_batch(user, exam_id, payload.slotIds, payload.requestId)
        if 'cached' in claim:
            return claim['cached']
        try:
            result = generate_batch([parse_slot(s) for s in claim['slots']], payload.lang, user,
                lambda usage: credits.record_usage(user, exam_id, claim['nonce'], usage))
            return credits.finish_batch(user, exam_id, claim['nonce'], result)
        except Exception:
            credits.release(user, exam_id, claim['nonce'])
            raise

    @router.post('/exams/{exam_id}/review')
    def review(exam_id: str, payload: Review, user=Depends(require_user)):
        return service().save_review(user, exam_id, payload.model_dump())

    @router.post('/exams/{exam_id}/cancel')
    def cancel(exam_id: str, user=Depends(require_user)):
        return service().cancel(user, exam_id)

    @router.get('/admin/accounts')
    def accounts(user=Depends(admin)):
        credits = service()
        return credits.store.list(f'{credits.namespace}_accounts', 100)

    @router.post('/admin/change')
    def change(payload: AdminChange, user=Depends(admin)):
        if (payload.package or payload.manualPackage) and not (payload.paymentReference or '').strip():
            fail('payment_reference_required', 'Cần mã thanh toán riêng cho gói credit.', 422)
        return service().admin_change(uid(user), payload.uid, payload.requestId,
                                      payload.status, payload.package, payload.trial, payload.note,
                                      payload.paymentReference, payload.manualPackage, payload.purchaseId)

    @router.post('/admin/adjust')
    def adjust(payload: AdminAdjustment, user=Depends(admin)):
        return service().admin_adjust(uid(user), payload.uid, payload.requestId,
                                      payload.product, payload.action, payload.amount, payload.note)

    @router.get('/admin/accounts/{account_uid}/history')
    def account_history(account_uid: str, user=Depends(admin)):
        return service().history(account_uid)

    @router.get('/admin/accounts/{account_uid}/exams')
    def account_exams(account_uid: str, user=Depends(admin)):
        return service().list_exams(account_uid)

    @router.post('/admin/accounts/{account_uid}/exams/{exam_id}/refund')
    def refund(account_uid: str, exam_id: str, payload: Refund, user=Depends(admin)):
        # Only an existing incomplete reservation can be refunded, at most once.
        return service().cancel({'sub': account_uid}, exam_id, admin=True,
                                actor_uid=uid(user), note=payload.note)

    return router
