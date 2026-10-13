"""Authenticated bank notifications settle the original stored order once."""
import hashlib
import hmac
import json
import os
import re
import time
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, StrictInt, ValidationError
from backend.credits import fail, fingerprint
from backend.payment_config import PLANS, payment_ready, public_payment_config

CODE_PATTERN = r'(?:BGP|BGL)[A-F0-9]{20}'


class BankTransaction(BaseModel):
    id: StrictInt = Field(gt=0)
    gateway: str = Field(min_length=1, max_length=40)
    transactionDate: str = Field(min_length=19, max_length=30)
    accountNumber: str = Field(min_length=1, max_length=50)
    code: str | None = Field(default=None, max_length=80)
    content: str = Field(default='', max_length=8000)
    transferType: str = Field(min_length=2, max_length=3)
    transferAmount: StrictInt = Field(gt=0, le=10**12)
    referenceCode: str = Field(default='', max_length=120)


def verify_notification(raw, headers, now=None):
    if not payment_ready():
        fail('payment_not_configured', 'Thanh toán tự động chưa được kết nối.', 503)
    secret = os.environ['SEPAY_WEBHOOK_SECRET']
    mode = os.getenv('SEPAY_WEBHOOK_AUTH', 'hmac')
    if mode == 'apikey':
        expected = 'Apikey ' + secret
        valid = hmac.compare_digest(headers.get('authorization', '').encode(), expected.encode())
    else:
        timestamp = headers.get('x-sepay-timestamp', '')
        if not re.fullmatch(r'[0-9]{10}', timestamp) or abs((time.time() if now is None else now) - int(timestamp)) > 300:
            fail('payment_unauthorized', 'Thông báo thanh toán không hợp lệ.', 401)
        expected = 'sha256=' + hmac.new(secret.encode(), timestamp.encode()+b'.'+raw, hashlib.sha256).hexdigest()
        valid = hmac.compare_digest(headers.get('x-sepay-signature', '').encode(), expected.encode())
    if not valid:
        fail('payment_unauthorized', 'Thông báo thanh toán không hợp lệ.', 401)


def settle_notification(credits, payload):
    bank = PLANS['bank']
    if (payload.transferType != 'in' or payload.accountNumber != bank['accountNumber']
            or payload.gateway.lower() not in ('techcombank', 'tcb')):
        return 'ignored'
    candidates = set(re.findall(CODE_PATTERN, payload.content.upper()))
    if payload.code and re.fullmatch(CODE_PATTERN, payload.code.upper()):
        candidates.add(payload.code.upper())
    if len(candidates) != 1:
        return 'unmatched'
    code = candidates.pop()
    try:
        occurred = datetime.strptime(payload.transactionDate, '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone(timedelta(hours=7))).timestamp()
    except ValueError:
        fail('invalid_payment_date', 'Thời điểm giao dịch không hợp lệ.', 422)
    reference = payload.referenceCode.strip().upper() or f'SEPAY:{payload.id}'
    intent = {'transactionId': payload.id, 'paymentCode': code, 'amount': payload.transferAmount,
              'reference': reference, 'occurredAt': occurred, 'accountNumber': payload.accountNumber}
    event_path = f'{credits.namespace}_payment_events/{fingerprint("sepay:"+str(payload.id))}'
    receipt_path = f'{credits.namespace}_receipts/{fingerprint(reference)}'
    def settle(tx):
        old = tx.get(event_path)
        if old:
            if old['intent'] != intent:
                fail('payment_replay_conflict', 'Thông báo lặp có dữ liệu khác giao dịch đã lưu.')
            return old['status']
        mapping = tx.get(f'{credits.namespace}_payment_codes/{code}')
        if not mapping:
            # No database record is made for unrelated bank transfers.
            return 'unmatched'
        account_path = credits.account_path(mapping['uid'])
        purchase_path = f'{account_path}/purchases/{mapping["purchaseId"]}'
        account, purchase, receipt = tx.get(account_path), tx.get(purchase_path), tx.get(receipt_path)
        if not account or not purchase or purchase.get('paymentCode') != code:
            fail('payment_mapping_error', 'Không tìm thấy đơn thanh toán đã đăng ký.', 503)
        status = 'fulfilled'
        if purchase['status'] != 'pending':
            status = 'order_closed'
        elif receipt:
            status = 'receipt_already_used'
        elif payload.transferAmount != purchase.get('expectedAmount'):
            status = 'amount_mismatch'
        elif occurred < purchase['createdAt'] - 60:
            status = 'transaction_before_order'
        elif purchase.get('bank', {}).get('accountNumber') != payload.accountNumber:
            status = 'recipient_mismatch'
        elif purchase['product'] not in ('exam', 'manual'):
            fail('payment_mapping_error', 'Gói thanh toán không hợp lệ.', 503)
        event = {'id': fingerprint('sepay:'+str(payload.id)), 'intent': intent, 'status': status,
            'uid': mapping['uid'], 'purchaseId': purchase['id'], 'updatedAt': credits.clock()}
        tx.set(event_path, event)
        if status != 'fulfilled':
            # These received-money exceptions are visible to the owner; never
            # silently grant a wrong package or discard a genuine transfer.
            if purchase['status'] == 'pending':
                purchase['paymentIssue'] = status
                tx.set(purchase_path, purchase)
                tx.set(f'{credits.namespace}_purchase_inbox/{fingerprint(mapping["uid"])}', purchase)
            return status
        delta, manual_delta = (purchase['package'], 0) if purchase['product'] == 'exam' else (0, purchase['package'])
        account.update(balance=account['balance']+delta,
            manualBalance=account.get('manualBalance', 3)+manual_delta, activePurchaseId=None, updatedAt=credits.clock())
        purchase.update(status='fulfilled', paymentReference=reference, transactionId=payload.id,
                        receivedAmount=payload.transferAmount, fulfilledBy='sepay', updatedAt=credits.clock())
        purchase.pop('paymentIssue', None)
        tx.set(account_path, account)
        tx.set(purchase_path, purchase)
        tx.set(f'{credits.namespace}_purchase_inbox/{fingerprint(mapping["uid"])}', purchase)
        tx.set(receipt_path, {'uid': mapping['uid'], 'purchaseId': purchase['id'],
            'product': purchase['product'], 'package': purchase['package'], 'reference': reference,
            'transactionId': payload.id, 'source': 'sepay', 'updatedAt': credits.clock()})
        credits.ledger(tx, mapping['uid'], 'sepay:'+str(payload.id), 'grant', balanceDelta=delta,
            heldDelta=0, manualDelta=manual_delta, priceVnd=payload.transferAmount,
            purchaseId=purchase['id'], paymentReference=reference, source='sepay',
            note='Thanh toán chuyển khoản đã được xác nhận tự động.')
        return status
    return credits.store.run(settle)


def build_payment_router(get_credits):
    router = APIRouter()
    @router.get('/api/payment-plans')
    def payment_plans():
        return public_payment_config()

    @router.post('/api/payments/sepay/webhook')
    async def notification(request: Request):
        if request.headers.get('content-type', '').split(';')[0] != 'application/json':
            raise HTTPException(415, detail='JSON required')
        raw = bytearray()
        async for chunk in request.stream():
            raw.extend(chunk)
            if len(raw) > 16384:
                raise HTTPException(413, detail='Notification too large')
        verify_notification(bytes(raw), request.headers)
        try:
            payload = BankTransaction.model_validate(json.loads(raw))
        except (ValueError, ValidationError, UnicodeDecodeError):
            # Do not echo bank details, request payloads or validation inputs.
            raise HTTPException(422, detail='Invalid bank notification')
        await run_in_threadpool(lambda: settle_notification(get_credits(), payload))
        return {'success': True}

    return router
