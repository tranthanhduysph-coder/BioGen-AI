# Exam credits on the shared BioGen backend

This preview adds account approval, packages of 10/20/30 credits, a server-owned
ledger, cloud exam recovery and manual administrator grants. Gemini remains the
shared provider for manual questions and exam slots. No payment gateway is added.

## Business rules

- One credit buys an exam containing at most 40 assessment units. MCQ and numeric
  short response count as one; a four-statement True/False question counts as four.
- Starting reserves one available credit atomically. Completion consumes that
  reservation once, only after all registered slots have validated AI results.
  This is structural validation, not a guarantee of scientific correctness.
- Each user has at most one incomplete reservation. AI errors keep that exam and
  reservation; resume creates only missing slots. Reload and repeated requests
  do not create another purchase.
- Successful user-requested replacements consume a cumulative allowance of
  floor(20% of assessment units). Replacing a TF question consumes four units.
  Failed provider/format attempts consume no replacement allowance. Very small
  exams can have zero replacements; this is stated here rather than rounded up.
- Manual edits and DOCX downloads never modify credits. Review is saved explicitly
  to the account; local drafts still autosave. Cloud recovery works across devices.
- Teachers can cancel and refund a reservation that has no generated questions.
  An incomplete exam with questions requires administrator review for a refund.
  Completed exams cannot be refunded through this cancellation endpoint.
- Credit has no expiry. Unspent balance must remain backed by a future service
  budget. Prices stored for grants are provisional planning values (199k/349k/479k),
  not proof of an actual payment; administrator notes are required.
- Approved users retain manual-question generation, capped at 20 questions per
  UTC day, without spending exam credits. This is an initial bounded allowance,
  not a separate paid-question product. The provider RPM and hourly limits remain.

## Persistence and authority

Collections are `{CREDIT_NAMESPACE}_accounts/{sha256(uid)}` with `exams` and
`ledger` subcollections, plus `{CREDIT_NAMESPACE}_receipts` for unique payment
references. Re-entering the same bank/payment reference cannot grant a second
package, even after a browser reload or through another administrator.
Preview and production MUST use different namespaces
and preferably different databases/projects. Existing question-history data is
not migrated or overwritten.

Firestore transactions buffer writes until all reads finish. Reservation,
completion, grants and refunds atomically update account/exam/ledger. AI network
calls are never performed inside retryable Firestore transaction callbacks.

All routes require verified Firebase ID tokens. Only UIDs explicitly configured
in `CREDIT_ADMIN_UIDS` can grant credits, approve accounts or review refunds.
Client-provided email, administrator flags and balance are never authoritative.
The legacy `/api/exam/generate-item` route is denied when credits are enabled.

Slot operations have durable request IDs and a fenced 240-second lease. This
prevents simultaneous generation of one exam and duplicate credit consumption.
An expired worker cannot save results over a newer worker. If a provider response
is lost before it is persisted, the provider may still bill that attempt; this
does not consume a second user credit. There is no claim of exactly-once AI billing.

`MemoryStore` exists only for unit tests. Runtime uses Firestore exclusively and
fails closed when enabled without valid persistence/administrator configuration.

## Required environment

```text
CREDITS_ENABLED=false
CREDIT_NAMESPACE=biogen_preview
CREDIT_ADMIN_UIDS=<verified Firebase UID of the owner>
CREDIT_FIRESTORE_DATABASE=(default)
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/biogen-firestore.json
```

Upload a service-account JSON as a Render Secret File, never into Git or the
frontend. Alternatively provide `FIREBASE_SERVICE_ACCOUNT_JSON` as a backend-only
secret. Use a dedicated service identity with Firestore data access; do not grant
Firebase/Cloud owner rights. A token used for local Firebase CLI administration
is not a backend service credential.

Before enabling, inspect the live Firestore rules and deny all client access to
the credit namespace, including descendants. For example, the following match
can be incorporated into existing rules, but is NOT a full replacement ruleset:

```text
match /biogen_preview_accounts/{document=**} {
  allow read, write: if false;
}
match /biogen_preview_receipts/{document=**} {
  allow read, write: if false;
}
```

Firestore allows access if ANY matching rule allows it. A broad existing wildcard
allow must be narrowed; adding this deny alone would not override it. Preserve
the rules for existing history data and verify with the emulator before rollout.
The server SDK uses IAM and bypasses client rules. Credentials must be configured
and live rules verified before `CREDITS_ENABLED=true`.

## Deployment and validation

1. Build/typecheck frontend and run unit/route tests below.
2. Provision the server credential, owner UID and safe client rules. Verify
   reserve/complete/grant/refund against an isolated preview database or emulator.
3. Deploy backend and frontend on `feature/exam-blueprint-builder` with credit
   enforcement initially disabled. Existing preview AI generation continues.
4. Enable only in preview, grant the owner a trial credit and verify a complete
   exam plus a partial failure/recovery. No real payment is necessary for this test.
5. Enable sales only after a successful persistent-storage acceptance test. Do
   not merge main or change production services as part of this preview work.

```sh
python -m unittest discover -s tests -p 'test_*.py' -v
npm test
npm run typecheck:exam-builder
npm run build
```

The first release pauses generation when the browser closes and resumes from
stored slots later. It has no unattended background worker. Ledger history shows
the latest 100 events; cloud exam lists show 50 exams and the administrator picker
shows 100 accounts (known UIDs can also be entered explicitly).

Official transaction/auth guidance:
https://firebase.google.com/docs/firestore/manage-data/transactions
https://firebase.google.com/docs/firestore/quickstart-server
