"""Exam-credit ledger; AI calls are deliberately outside transactions."""
import hashlib
import json
import math
import re
import time
import uuid
from fastapi import HTTPException
from backend.payment_config import PACKAGES, MANUAL_PRICE, PLANS



def fail(code, message, status=409):
    raise HTTPException(status, detail={'code': code, 'message': message, 'retryable': False})


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     separators=(',', ':')).encode()).hexdigest()


def request_id(value):
    if not re.fullmatch(r'[A-Za-z0-9_-]{8,80}', value):
        fail('invalid_request_id', 'Mã yêu cầu không hợp lệ.', 422)
    return value


class CreditService:
    def __init__(self, store, namespace='biogen_preview', admins=(), clock=time.time, automatic_trials=True):
        if not re.fullmatch(r'[a-z][a-z0-9_]{2,40}', namespace):
            raise ValueError('Invalid credit namespace')
        self.store, self.namespace, self.admins, self.clock = store, namespace, set(admins), clock
        self.automatic_trials = automatic_trials

    def account_path(self, uid):
        return f'{self.namespace}_accounts/{fingerprint(uid)}'

    def exam_path(self, uid, exam_id):
        return f'{self.account_path(uid)}/exams/{request_id(exam_id)}'

    def account(self, tx, user):
        uid = user.get('uid') or user.get('sub')
        if not uid:
            fail('unauthorized', 'Thiếu tài khoản Firebase.', 401)
        path = self.account_path(uid)
        account = tx.get(path)
        if not account:
            account = {'uid': uid, 'email': user.get('email', ''), 'name': user.get('name', ''),
                       'status': 'approved' if self.automatic_trials or uid in self.admins else 'pending',
                       'balance': 0, 'held': 0, 'activeExamId': None,
                       'createdAt': self.clock(), 'updatedAt': self.clock()}
            tx.set(path, account)
        if self.automatic_trials and account['status'] != 'blocked':
            # Old accounts received one trial credit. Top up the grant, never reset
            # their remaining balance or grant again after credits are spent.
            granted = account.get('trialCreditsGranted', 1 if account.get('trialGranted') else 0)
            delta = max(0, 2 - granted)
            changed = bool(delta) or 'manualBalance' not in account or account['status'] == 'pending'
            if changed:
                account.update(balance=account['balance'] + delta, trialGranted=True,
                    trialCreditsGranted=max(2, granted), status='approved', updatedAt=self.clock())
                account.setdefault('manualBalance', 3)
                account.setdefault('manualHeld', 0)
                account.setdefault('activeManualRunId', None)
                tx.set(path, account)
                if delta:
                    self.ledger(tx, uid, 'automatic-trial-v2', 'grant', balanceDelta=delta,
                                heldDelta=0, note='Dùng thử: tổng cộng 2 credit tạo đề mỗi tài khoản.')
        return account

    def approved(self, account):
        if account['status'] != 'approved':
            fail('account_not_approved', 'Tài khoản chưa được duyệt hoặc đã bị khóa.', 403)

    def me(self, user):
        account = self.store.run(lambda tx: self.account(tx, user))
        return {**account, 'isAdmin': account['uid'] in self.admins, 'enabled': True,
                'packages': [{'credits': n, 'priceVnd': p} for n, p in PACKAGES.items()]}

    def ledger(self, tx, uid, operation, kind, **fields):
        path = f'{self.account_path(uid)}/ledger/{fingerprint(operation)}'
        tx.set(path, {'id': fingerprint(operation), 'kind': kind, 'uid': uid,
                      'updatedAt': self.clock(), **fields})

    def history(self, uid):
        return self.store.list(f'{self.account_path(uid)}/ledger', 100)

    def list_exams(self, uid):
        return [{k: v for k, v in e.items() if k in
                 ('id', 'status', 'units', 'updatedAt', 'createdAt', 'replacedUnits', 'replacementLimit', 'usage')}
                | {'title': e['blueprint'].get('title', 'Đề kiểm tra'), 'completed': len(e['items'])}
                for e in self.store.list(f'{self.account_path(uid)}/exams', 50)]

    def get_exam(self, user, exam_id):
        def read(tx):
            self.account(tx, user)
            exam = tx.get(self.exam_path(user.get('uid') or user['sub'], exam_id))
            if not exam:
                fail('exam_not_found', 'Không tìm thấy đề của tài khoản này.', 404)
            return exam
        return self.store.run(read)

    def create(self, user, operation, blueprint, slots):
        request_id(operation)
        ids = [s['id'] for s in slots]
        units = sum(4 if s['part'] == 'tf' else 1 for s in slots)
        if not slots or units > 40 or len(ids) != len(set(ids)):
            fail('exam_capacity', 'Một credit tạo tối đa 40 câu/ý, không được trùng vị trí câu.', 422)
        if len(json.dumps({'blueprint': blueprint, 'slots': slots}).encode()) > 180000:
            fail('exam_capacity', 'Ma trận vượt giới hạn dung lượng.', 422)
        signature = fingerprint({'blueprint': blueprint, 'slots': slots})
        def reserve(tx):
            account = self.account(tx, user)
            self.approved(account)
            uid = account['uid']
            path = self.exam_path(uid, operation)
            existing = tx.get(path)
            if existing:
                if existing['signature'] != signature:
                    fail('request_conflict', 'Mã yêu cầu đã dùng cho một ma trận khác.')
                return existing
            if account['activeExamId']:
                fail('active_exam', 'Hãy tiếp tục đề đang tạo trước khi bắt đầu đề mới.')
            if account['balance'] < 1:
                fail('insufficient_credits', 'Bạn chưa có credit khả dụng.', 402)
            now = self.clock()
            exam = {'id': operation, 'uid': uid, 'signature': signature, 'blueprint': blueprint,
                    'slots': slots, 'units': units, 'items': {}, 'operations': {}, 'lease': None,
                    'status': 'reserved', 'replacementLimit': math.floor(units * .2),
                    'replacedUnits': 0, 'review': {}, 'usage': {'calls': 0, 'inputTokens': 0,
                    'outputTokens': 0, 'thinkingTokens': 0}, 'createdAt': now, 'updatedAt': now}
            account.update(balance=account['balance'] - 1, held=account['held'] + 1,
                           activeExamId=operation, updatedAt=now)
            tx.set(self.account_path(uid), account)
            tx.set(path, exam)
            self.ledger(tx, uid, 'reserve:' + operation, 'reserve', examId=operation,
                        balanceDelta=-1, heldDelta=1)
            return exam
        return self.store.run(reserve)

    def claim(self, user, exam_id, slot_id, operation, replace=False):
        request_id(operation)
        nonce = uuid.uuid4().hex
        def claim(tx):
            account = self.account(tx, user)
            self.approved(account)
            path = self.exam_path(account['uid'], exam_id)
            exam = tx.get(path)
            if not exam or exam['status'] == 'cancelled':
                fail('exam_not_found', 'Đề không còn khả dụng.', 404)
            slot = next((s for s in exam['slots'] if s['id'] == slot_id), None)
            if not slot:
                fail('invalid_slot', 'Câu hỏi không thuộc ma trận đã khóa.', 422)
            intent = {'slotId': slot_id, 'replace': replace}
            old = exam['operations'].get(operation)
            if old:
                if old['intent'] != intent:
                    fail('request_conflict', 'Mã yêu cầu đã dùng cho câu khác.')
                return {'cached': exam['items'][slot_id]}
            if not replace and slot_id in exam['items']:
                return {'cached': exam['items'][slot_id]}
            now = self.clock()
            if exam['lease'] and exam['lease']['expiresAt'] > now:
                fail('exam_busy', 'Một câu trong đề đang được tạo; hãy đợi rồi tiếp tục.')
            cost = 4 if slot['part'] == 'tf' else 1
            if replace:
                if slot_id not in exam['items']:
                    fail('invalid_replacement', 'Câu chưa có kết quả để thay.', 422)
                if exam['replacedUnits'] + cost > exam['replacementLimit']:
                    fail('replacement_limit', 'Đã hết hạn mức thay 20% dung lượng đề.', 403)
                if len(exam['operations']) >= 100:
                    fail('replacement_limit', 'Đã hết hạn mức yêu cầu của đề.', 403)
            exam['lease'] = {'nonce': nonce, 'operation': operation, 'slotId': slot_id,
                             'replace': replace, 'expiresAt': now + 240}
            exam['updatedAt'] = now
            tx.set(path, exam)
            return {'slot': slot, 'nonce': nonce}
        return self.store.run(claim)

    def finish(self, user, exam_id, nonce, item):
        def finish(tx):
            account = self.account(tx, user)
            path = self.exam_path(account['uid'], exam_id)
            exam = tx.get(path)
            lease = exam.get('lease') if exam else None
            if not lease or lease['nonce'] != nonce:
                fail('stale_generation', 'Yêu cầu đã được thay thế; hãy tải lại đề.')
            if len(json.dumps(item, ensure_ascii=False).encode()) > 6000:
                fail('ai_invalid_question', 'Câu AI quá dài; cần tạo lại.', 422)
            if item['slotId'] != lease['slotId']:
                fail('invalid_slot', 'Kết quả không đúng vị trí câu.', 422)
            exam['items'][item['slotId']] = item
            if lease['replace']:
                exam['replacedUnits'] += 4 if item['part'] == 'tf' else 1
                # Manual review must not carry approval for a replaced question.
                review = exam['review']
                if review:
                    review['generatedItems'] = [item if i['slotId'] == item['slotId'] else i
                                                for i in review.get('generatedItems', [])]
                    for key in ('approvedSlotIds', 'lockedQuestionIds'):
                        review[key] = [s for s in review.get(key, []) if s != item['slotId']]
            intent = {'slotId': lease['slotId'], 'replace': lease['replace']}
            exam['operations'][lease['operation']] = {'intent': intent}
            exam['lease'] = None
            exam['updatedAt'] = self.clock()
            if len(exam['items']) == len(exam['slots']) and exam['status'] == 'reserved':
                exam['status'] = 'completed'
                account.update(held=account['held'] - 1, activeExamId=None, updatedAt=self.clock())
                tx.set(self.account_path(account['uid']), account)
                self.ledger(tx, account['uid'], 'consume:' + exam_id, 'consume',
                            examId=exam_id, balanceDelta=0, heldDelta=-1)
            tx.set(path, exam)
            return item
        return self.store.run(finish)

    def release(self, user, exam_id, nonce):
        def release(tx):
            account = self.account(tx, user)
            path = self.exam_path(account['uid'], exam_id)
            exam = tx.get(path)
            if exam and exam.get('lease') and exam['lease']['nonce'] == nonce:
                exam['lease'] = None
                exam['updatedAt'] = self.clock()
                tx.set(path, exam)
        self.store.run(release)

    def record_usage(self, user, exam_id, nonce, usage):
        def record(tx):
            account = self.account(tx, user)
            path = self.exam_path(account['uid'], exam_id)
            exam = tx.get(path)
            if not exam or not exam.get('lease') or exam['lease']['nonce'] != nonce:
                fail('stale_generation', 'Yêu cầu tạo câu đã được thay thế.')
            for key in ('calls', 'inputTokens', 'outputTokens', 'thinkingTokens'):
                exam['usage'][key] += max(0, int(usage.get(key, 0)))
            tx.set(path, exam)
        self.store.run(record)

    def save_review(self, user, exam_id, review):
        def save(tx):
            account = self.account(tx, user)
            self.approved(account)
            path = self.exam_path(account['uid'], exam_id)
            exam = tx.get(path)
            if not exam or exam['status'] == 'cancelled':
                fail('exam_not_found', 'Không tìm thấy đề.', 404)
            if exam['lease'] and exam['lease']['expiresAt'] > self.clock():
                fail('exam_busy', 'Hãy đợi tạo câu xong trước khi lưu duyệt.')
            # Review text is never used to mark a provider slot complete or charge a credit.
            ids = set(exam['items'])
            if any(i['slotId'] not in ids for i in review.get('generatedItems', [])):
                fail('invalid_review', 'Bản duyệt chứa câu chưa được tạo.', 422)
            if len(json.dumps(review).encode()) > 180000:
                fail('invalid_review', 'Bản duyệt quá lớn.', 422)
            exam.update(review=review, updatedAt=self.clock())
            tx.set(path, exam)
            return {'saved': True}
        return self.store.run(save)

    def cancel(self, user, exam_id, admin=False, actor_uid=None, note=''):
        def cancel(tx):
            account = self.account(tx, user)
            path = self.exam_path(account['uid'], exam_id)
            exam = tx.get(path)
            if not exam:
                fail('exam_not_found', 'Không tìm thấy đề.', 404)
            if exam['status'] == 'cancelled':
                return exam
            if exam['status'] != 'reserved':
                fail('completed_exam', 'Đề đã hoàn tất không thể hủy để hoàn credit.')
            if exam['lease'] and exam['lease']['expiresAt'] > self.clock():
                fail('exam_busy', 'Hãy đợi yêu cầu tạo câu kết thúc.')
            if exam['items'] and not admin:
                fail('refund_review_required', 'Đề đã có câu AI; hãy tiếp tục hoặc liên hệ quản trị để hoàn credit.', 403)
            account.update(balance=account['balance'] + 1, held=account['held'] - 1,
                           activeExamId=None, updatedAt=self.clock())
            exam.update(status='cancelled', updatedAt=self.clock())
            tx.set(self.account_path(account['uid']), account)
            tx.set(path, exam)
            self.ledger(tx, account['uid'], 'refund:' + exam_id, 'refund', examId=exam_id,
                        balanceDelta=1, heldDelta=-1, adminReviewed=admin,
                        actorUid=actor_uid or account['uid'], note=note)
            return exam
        return self.store.run(cancel)

    def admin_change(self, admin_uid, uid, operation, status=None, package=None, trial=False, note='', payment_reference=None, manual_package=None, purchase_id=None):
        if admin_uid not in self.admins:
            fail('admin_required', 'Chỉ quản trị được thay đổi credit.', 403)
        request_id(operation)
        if package is not None and package not in PACKAGES:
            fail('invalid_package', 'Gói phải là 10, 20 hoặc 30 credit.', 422)
        if manual_package not in (None, 3):
            fail('invalid_package', 'Gói câu hỏi lẻ là 3 lượt, giá 20.000đ.', 422)
        if sum(bool(v) for v in (package, trial, manual_package)) > 1:
            fail('invalid_package', 'Không gộp gói trả phí và credit dùng thử trong một thao tác.', 422)
        if status is not None and status not in ('pending', 'approved', 'blocked'):
            fail('invalid_status', 'Trạng thái tài khoản không hợp lệ.', 422)
        reference = (payment_reference or operation).strip().upper() if package or manual_package else None
        intent = {'uid': uid, 'status': status, 'package': package, 'trial': trial, 'note': note,
                  'paymentReference': reference, 'manualPackage': manual_package, 'purchaseId': purchase_id}
        def change(tx):
            path = self.account_path(uid)
            account = tx.get(path)
            if not account:
                fail('account_not_found', 'Người dùng cần đăng nhập trước để đăng ký tài khoản.', 404)
            op_path = f'{path}/ledger/{fingerprint("admin:" + admin_uid + ":" + operation)}'
            old = tx.get(op_path)
            if old:
                if old['intent'] != intent:
                    fail('request_conflict', 'Mã giao dịch đã được dùng cho thao tác khác.')
                return account
            receipt_path = f'{self.namespace}_receipts/{fingerprint(reference)}' if package else None
            if manual_package:
                receipt_path = f'{self.namespace}_receipts/{fingerprint(reference)}'
            receipt = tx.get(receipt_path) if receipt_path else None
            purchase_path = f'{path}/purchases/{request_id(purchase_id)}' if purchase_id else None
            purchase = tx.get(purchase_path) if purchase_path else None
            if purchase_id and (not purchase or purchase['status'] != 'pending'
                    or purchase['product'] != ('manual' if manual_package else 'exam')
                    or purchase['package'] != (manual_package or package)):
                fail('purchase_conflict', 'Yêu cầu mua không còn chờ xử lý hoặc không khớp gói.')
            if receipt:
                if (receipt['uid'] != uid or receipt['package'] != (manual_package or package)
                        or receipt.get('product', 'exam') != ('manual' if manual_package else 'exam')
                        or purchase_id and receipt.get('purchaseId') != purchase_id):
                    fail('payment_reference_conflict', 'Mã thanh toán đã dùng cho tài khoản hoặc gói khác.')
                return account
            granted = account.get('trialCreditsGranted', 1 if account.get('trialGranted') else 0)
            if trial and granted >= 2:
                fail('trial_already_granted', 'Tài khoản đã nhận credit dùng thử.')
            delta = package or (max(0, 2 - granted) if trial else 0)
            account['balance'] += delta
            if manual_package:
                account['manualBalance'] = account.get('manualBalance', 3) + manual_package
            if status:
                account['status'] = status
            if trial:
                account['trialGranted'] = True
                account['trialCreditsGranted'] = 2
            if purchase:
                account['activePurchaseId'] = None
            account['updatedAt'] = self.clock()
            tx.set(path, account)
            if receipt_path:
                tx.set(receipt_path, {'uid': uid, 'package': manual_package or package,
                    'product': 'manual' if manual_package else 'exam', 'purchaseId': purchase_id, 'reference': reference,
                    'actorUid': admin_uid, 'updatedAt': self.clock()})
            if purchase:
                purchase.update(status='fulfilled', paymentReference=reference, actorUid=admin_uid, updatedAt=self.clock())
                tx.set(purchase_path, purchase)
                tx.set(f'{self.namespace}_purchase_inbox/{fingerprint(uid)}', purchase)
            tx.set(op_path, {'id': fingerprint(operation), 'kind': 'grant' if delta or manual_package else 'status',
                            'uid': uid, 'actorUid': admin_uid, 'intent': intent, 'note': note,
                            'balanceDelta': delta, 'heldDelta': 0,
                            'manualDelta': manual_package or 0,
                            'priceVnd': 20000 if manual_package else PACKAGES.get(package, 0), 'updatedAt': self.clock()})
            return account
        return self.store.run(change)

    def request_purchase(self, user, operation, product, package, note=''):
        request_id(operation)
        if (product == 'exam' and package not in PACKAGES) or (product == 'manual' and package != 3) or product not in ('exam', 'manual'):
            fail('invalid_package', 'Gói mua không hợp lệ.', 422)
        def create(tx):
            account = self.account(tx, user)
            self.approved(account)
            path = f'{self.account_path(account["uid"])}/purchases/{operation}'
            old = tx.get(path)
            if old:
                if old['product'] != product or old['package'] != package:
                    fail('request_conflict', 'Mã yêu cầu đã dùng cho gói khác.')
                return old
            active = account.get('activePurchaseId')
            pending = tx.get(f'{self.account_path(account["uid"])}/purchases/{active}') if active else None
            if pending and pending['status'] == 'pending':
                if pending['product'] == product and pending['package'] == package:
                    return pending
                fail('purchase_pending', 'Đã có yêu cầu mua đang chờ xử lý. Liên hệ quản trị để đổi gói.')
            purchase = {'id': operation, 'uid': account['uid'], 'email': account['email'],
                'name': account['name'], 'product': product, 'package': package, 'note': note,
                'status': 'pending', 'createdAt': self.clock(), 'updatedAt': self.clock()}
            self.prepare_payment(tx, purchase)
            account.update(activePurchaseId=operation, updatedAt=self.clock())
            tx.set(self.account_path(account['uid']), account)
            tx.set(path, purchase)
            tx.set(f'{self.namespace}_purchase_inbox/{fingerprint(account["uid"])}', purchase)
            return purchase
        return self.store.run(create)

    def prepare_payment(self, tx, purchase):
        if purchase.get('paymentCode'):
            return purchase
        # The full server-generated random code avoids collisions between users
        # or QR scans; UID, product and price only come from this stored order.
        prefix = 'BGP' if self.namespace == 'biogen_preview' else 'BGL'
        code = prefix + uuid.uuid4().hex[:20].upper()
        code_path = f'{self.namespace}_payment_codes/{code}'
        if tx.get(code_path):
            fail('payment_code_busy', 'Vui lòng tạo lại mã thanh toán.')
        purchase.update(paymentCode=code, expectedAmount=MANUAL_PRICE if purchase['product'] == 'manual' else PACKAGES[purchase['package']],
                        bank=PLANS['bank'].copy())
        tx.set(code_path, {'uid': purchase['uid'], 'purchaseId': purchase['id'], 'updatedAt': self.clock()})
        return purchase

    def prepare_purchase_payment(self, user, purchase_id):
        def prepare(tx):
            account = self.account(tx, user)
            self.approved(account)
            path = f'{self.account_path(account["uid"])}/purchases/{request_id(purchase_id)}'
            purchase = tx.get(path)
            if not purchase or purchase['status'] != 'pending':
                fail('purchase_conflict', 'Không tìm thấy yêu cầu mua đang chờ.', 404)
            self.prepare_payment(tx, purchase)
            tx.set(path, purchase)
            tx.set(f'{self.namespace}_purchase_inbox/{fingerprint(account["uid"])}', purchase)
            return purchase
        return self.store.run(prepare)

    def purchases(self, uid):
        return self.store.list(f'{self.account_path(uid)}/purchases', 50)

    def report_payment(self, user, purchase_id):
        def report(tx):
            account = self.account(tx, user)
            path = f'{self.account_path(account["uid"])}/purchases/{request_id(purchase_id)}'
            purchase = tx.get(path)
            if not purchase or purchase['status'] != 'pending':
                fail('purchase_conflict', 'Không tìm thấy yêu cầu mua đang chờ.', 404)
            purchase.update(reportedPaid=True, updatedAt=self.clock())
            tx.set(path, purchase)
            tx.set(f'{self.namespace}_purchase_inbox/{fingerprint(account["uid"])}', purchase)
            return purchase
        return self.store.run(report)

    def reject_purchase(self, admin_uid, uid, purchase_id, note):
        if admin_uid not in self.admins:
            fail('admin_required', 'Chỉ quản trị được xử lý yêu cầu.', 403)
        def reject(tx):
            path = f'{self.account_path(uid)}/purchases/{request_id(purchase_id)}'
            account, purchase = tx.get(self.account_path(uid)), tx.get(path)
            if not purchase or purchase['status'] == 'fulfilled':
                fail('purchase_conflict', 'Yêu cầu không còn chờ xử lý.')
            purchase.update(status='rejected', adminNote=note, actorUid=admin_uid, updatedAt=self.clock())
            if account.get('activePurchaseId') == purchase_id:
                account['activePurchaseId'] = None
                tx.set(self.account_path(uid), account)
            tx.set(path, purchase)
            tx.set(f'{self.namespace}_purchase_inbox/{fingerprint(uid)}', purchase)
            return purchase
        return self.store.run(reject)

    def manual_path(self, uid, run_id):
        return f'{self.account_path(uid)}/manual_runs/{request_id(run_id)}'

    def create_manual_run(self, user, operation, batches):
        request_id(operation)
        if not batches or sum(b['expectedCount'] for b in batches) > 40 or len(json.dumps(batches).encode()) > 160000:
            fail('manual_capacity', 'Mỗi lượt tạo câu hỏi lẻ tối đa 40 câu.', 422)
        signature = fingerprint(batches)
        def create(tx):
            account = self.account(tx, user)
            self.approved(account)
            path = self.manual_path(account['uid'], operation)
            old = tx.get(path)
            if old:
                if old['signature'] != signature:
                    fail('request_conflict', 'Mã lượt tạo đã dùng cho yêu cầu khác.')
                return old
            if account.get('activeManualRunId'):
                fail('manual_run_active', 'Hãy tiếp tục lượt câu hỏi lẻ đang dở trước khi tạo lượt mới.')
            if account.get('manualBalance', 3) < 1:
                fail('manual_credits_required', 'Đã hết lượt câu hỏi lẻ. Mua 3 lượt tiếp theo với giá 20.000đ.', 402)
            account.update(manualBalance=account.get('manualBalance', 3)-1,
                manualHeld=account.get('manualHeld', 0)+1, activeManualRunId=operation, updatedAt=self.clock())
            run = {'id': operation, 'signature': signature, 'batches': batches, 'results': {},
                'status': 'reserved', 'lease': None, 'updatedAt': self.clock()}
            tx.set(self.account_path(account['uid']), account)
            tx.set(path, run)
            self.ledger(tx, account['uid'], 'manual-reserve:'+operation, 'manual_reserve',
                balanceDelta=0, heldDelta=0, manualDelta=-1, manualHeldDelta=1)
            return run
        return self.store.run(create)

    def get_manual_run(self, user, run_id):
        def read(tx):
            account = self.account(tx, user)
            run = tx.get(self.manual_path(account['uid'], run_id))
            if not run:
                fail('manual_run_missing', 'Không tìm thấy lượt câu hỏi lẻ.', 404)
            return run
        return self.store.run(read)

    def claim_manual(self, user, run_id, index, batch):
        nonce = uuid.uuid4().hex
        def claim(tx):
            account = self.account(tx, user)
            self.approved(account)
            path = self.manual_path(account['uid'], run_id)
            run = tx.get(path)
            if not run or run['status'] == 'cancelled' or index < 0 or index >= len(run['batches']):
                fail('manual_run_missing', 'Lượt câu hỏi lẻ không hợp lệ.', 404)
            registered = {k: run['batches'][index][k] for k in ('prompt', 'expectedCount', 'lang')}
            if fingerprint(batch) != fingerprint(registered):
                fail('request_conflict', 'Nội dung không khớp lượt đã đăng ký.')
            if str(index) in run['results']:
                return {'cached': run['results'][str(index)]}
            if run['lease'] and run['lease']['expiresAt'] > self.clock():
                fail('manual_busy', 'Lượt câu hỏi lẻ đang được tạo.')
            run['lease'] = {'nonce': nonce, 'index': index, 'expiresAt': self.clock()+240}
            tx.set(path, run)
            return {'nonce': nonce}
        return self.store.run(claim)

    def finish_manual(self, user, run_id, nonce, results=None):
        def finish(tx):
            account = self.account(tx, user)
            path = self.manual_path(account['uid'], run_id)
            run = tx.get(path)
            if not run or not run['lease'] or run['lease']['nonce'] != nonce:
                fail('manual_stale', 'Lượt câu hỏi lẻ đã được thay thế.')
            index = run['lease']['index']
            if results is not None:
                if len(results) != run['batches'][index]['expectedCount'] or any(len(json.dumps(q).encode()) > 6000 for q in results):
                    fail('ai_invalid_question', 'Câu trả về quá dài hoặc không đủ số lượng.', 422)
                run['results'][str(index)] = results
                if len(run['results']) == len(run['batches']) and run['status'] == 'reserved':
                    run['status'] = 'completed'
                    account.update(manualHeld=account['manualHeld']-1, activeManualRunId=None, updatedAt=self.clock())
                    tx.set(self.account_path(account['uid']), account)
                    self.ledger(tx, account['uid'], 'manual-consume:'+run_id, 'manual_consume',
                        balanceDelta=0, heldDelta=0, manualDelta=0, manualHeldDelta=-1)
            run.update(lease=None, updatedAt=self.clock())
            tx.set(path, run)
            return results
        return self.store.run(finish)

    def cancel_manual(self, user, run_id):
        def cancel(tx):
            account = self.account(tx, user)
            path = self.manual_path(account['uid'], run_id)
            run = tx.get(path)
            if not run:
                fail('manual_run_missing', 'Không tìm thấy lượt tạo.', 404)
            if run['status'] == 'cancelled':
                return run
            if run['status'] != 'reserved' or run['results'] or run['lease'] and run['lease']['expiresAt'] > self.clock():
                fail('manual_cancel_denied', 'Lượt đang chạy hoặc đã có câu; hãy tiếp tục lượt đang dở.')
            account.update(manualBalance=account['manualBalance']+1, manualHeld=account['manualHeld']-1, activeManualRunId=None)
            run.update(status='cancelled', updatedAt=self.clock())
            tx.set(path, run)
            tx.set(self.account_path(account['uid']), account)
            self.ledger(tx, account['uid'], 'manual-refund:'+run_id, 'manual_refund',
                balanceDelta=0, heldDelta=0, manualDelta=1, manualHeldDelta=-1)
            return run
        return self.store.run(cancel)
