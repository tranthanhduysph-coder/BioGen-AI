"""Server-only Firestore persistence. Memory storage is exclusively for tests."""
import copy
import json
import os
import threading
import random
import time


class MemoryStore:
    def __init__(self):
        self.documents = {}
        self.lock = threading.RLock()

    def run(self, callback):
        with self.lock:
            pending = copy.deepcopy(self.documents)

            class Tx:
                def get(self, path):
                    return copy.deepcopy(pending.get(path))

                def set(self, path, value):
                    pending[path] = copy.deepcopy(value)

            result = callback(Tx())
            self.documents = pending
            return result

    def list(self, collection, limit=100):
        with self.lock:
            prefix = collection + '/'
            values = [copy.deepcopy(v) for k, v in self.documents.items()
                      if k.startswith(prefix) and '/' not in k[len(prefix):]]
            return sorted(values, key=lambda v: v.get('updatedAt', v.get('createdAt', 0)), reverse=True)[:limit]


class FirestoreStore:
    def __init__(self, project):
        from google.cloud import firestore
        from google.oauth2 import service_account
        self.firestore = firestore
        info = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON', '').strip()
        credentials = service_account.Credentials.from_service_account_info(json.loads(info)) if info else None
        self.client = firestore.Client(project=project, credentials=credentials,
                                       database=os.getenv('CREDIT_FIRESTORE_DATABASE', '(default)'))

    def run(self, callback):
        client = self.client

        @self.firestore.transactional
        def execute(transaction):
            # Buffer writes so every SDK read precedes every SDK write, including
            # idempotency checks. Firestore may rerun this callback on contention.
            writes = {}
            cache = {}

            class Tx:
                def get(self, path):
                    if path in writes:
                        return copy.deepcopy(writes[path])
                    if path not in cache:
                        snapshot = client.document(path).get(transaction=transaction)
                        cache[path] = snapshot.to_dict() if snapshot.exists else None
                    return copy.deepcopy(cache[path])

                def set(self, path, value):
                    writes[path] = copy.deepcopy(value)

            result = callback(Tx())
            for path, value in writes.items():
                transaction.set(client.document(path), value)
            return result

        # Some SDK versions only retry ABORTED from commit, not a pessimistic
        # read that was aborted while another transaction held the same account.
        # A fresh transaction can safely replay this callback: it contains no AI
        # calls and all ledger/operation IDs are stable.
        from google.api_core.exceptions import Aborted, GoogleAPICallError
        from fastapi import HTTPException
        for attempt in range(5):
            try:
                return execute(self.client.transaction(max_attempts=5))
            except (Aborted, ValueError) as error:
                if not isinstance(error, Aborted) and not isinstance(error.__cause__, Aborted):
                    raise
                if attempt < 4:
                    time.sleep(min(1.5, .15 * 2 ** attempt) + random.uniform(0, .15))
            except GoogleAPICallError:
                # A response lost after commit is handled by the durable request
                # ID on the next client attempt, never by blindly replaying AI.
                break
        raise HTTPException(503, detail={'code': 'credit_storage_busy', 'retryable': False,
            'message': 'Kho credit đang bận hoặc chưa kết nối được. Giữ nguyên đề và thử lại sau.'})

    def list(self, collection, limit=100):
        # Single-field index, no composite index necessary.
        return [s.to_dict() for s in self.client.collection(collection)
                .order_by('updatedAt', direction=self.firestore.Query.DESCENDING).limit(limit).stream()]
