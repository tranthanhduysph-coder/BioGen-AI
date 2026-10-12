"""Exam-credit ledger; AI calls are deliberately outside transactions."""
import hashlib
import json
import math
import re
import time
import uuid
from fastapi import HTTPException

PACKAGES = {10: 199000, 20: 349000, 30: 479000}


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
    def __init__(self, store, namespace='biogen_preview', admins=(), clock=time.time):
        if not re.fullmatch(r'[a-z][a-z0-9_]{2,40}', namespace):
            raise ValueError('Invalid credit namespace')
        self.store, self.namespace, self.admins, self.clock = store, namespace, set(admins), clock

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
                       'status': 'approved' if uid in self.admins else 'pending',
                       'balance': 0, 'held': 0, 'activeExamId': None,
                       'createdAt': self.clock(), 'updatedAt': self.clock()}
            tx.set(path, account)
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

    def admin_change(self, admin_uid, uid, operation, status=None, package=None, trial=False, note='', payment_reference=None):
        if admin_uid not in self.admins:
            fail('admin_required', 'Chỉ quản trị được thay đổi credit.', 403)
        request_id(operation)
        if package is not None and package not in PACKAGES:
            fail('invalid_package', 'Gói phải là 10, 20 hoặc 30 credit.', 422)
        if package and trial:
            fail('invalid_package', 'Không gộp gói trả phí và credit dùng thử trong một thao tác.', 422)
        if status is not None and status not in ('pending', 'approved', 'blocked'):
            fail('invalid_status', 'Trạng thái tài khoản không hợp lệ.', 422)
        reference = (payment_reference or operation).strip().upper() if package else None
        intent = {'uid': uid, 'status': status, 'package': package, 'trial': trial, 'note': note,
                  'paymentReference': reference}
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
            receipt = tx.get(receipt_path) if receipt_path else None
            if receipt:
                if receipt['uid'] != uid or receipt['package'] != package:
                    fail('payment_reference_conflict', 'Mã thanh toán đã dùng cho tài khoản hoặc gói khác.')
                return account
            if trial and account.get('trialGranted'):
                fail('trial_already_granted', 'Tài khoản đã nhận credit dùng thử.')
            delta = package or (1 if trial else 0)
            account['balance'] += delta
            if status:
                account['status'] = status
            if trial:
                account['trialGranted'] = True
            account['updatedAt'] = self.clock()
            tx.set(path, account)
            if receipt_path:
                tx.set(receipt_path, {'uid': uid, 'package': package, 'reference': reference,
                    'actorUid': admin_uid, 'updatedAt': self.clock()})
            tx.set(op_path, {'id': fingerprint(operation), 'kind': 'grant' if delta else 'status',
                            'uid': uid, 'actorUid': admin_uid, 'intent': intent, 'note': note,
                            'balanceDelta': delta, 'heldDelta': 0,
                            'priceVnd': PACKAGES.get(package, 0), 'updatedAt': self.clock()})
            return account
        return self.store.run(change)

    def manual_admission(self, user, units):
        def admit(tx):
            account = self.account(tx, user)
            self.approved(account)
            day = time.strftime('%Y-%m-%d', time.gmtime(self.clock()))
            used = account.get('manualUsed', 0) if account.get('manualDay') == day else 0
            if used + units > 20:
                fail('manual_daily_limit', 'Module câu lẻ giới hạn 20 câu/ngày; không trừ credit đề.', 429)
            account.update(manualDay=day, manualUsed=used + units, updatedAt=self.clock())
            tx.set(self.account_path(account['uid']), account)
        self.store.run(admit)
