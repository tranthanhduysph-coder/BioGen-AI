# Exam credits on the shared BioGen backend

This preview adds account approval, packages of 10/20/30 credits, a server-owned
ledger, cloud exam recovery, purchase requests and optional authenticated SePay
bank notifications. Gemini remains the shared provider for both modules.
Automatic payment is disabled until the bank connection and server secret are configured.

## Business rules

- Every authenticated account receives two exam trial credits once and can use
  them immediately. Existing one-credit trials receive only the missing one;
  spent balance is never reset. Pending accounts become approved; blocked
  accounts remain blocked. The server transaction owns this migration.
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
  budget. The owner confirmed exam prices of 199k/349k/479k for 10/20/30 credits,
  and 20k for three manual actions. `data/paymentPlans.json` is the public price
  and existing QR-recipient source. Each QR order snapshots its amount and recipient.
- Manual-question generation has a separate balance: three free generation
  actions once per account, followed by 20,000 VND for each three-action package.
  One button click with several criteria batches is one action, at most 40
  questions total. The final available action is warned before it is used.
  Exhaustion opens the purchase dialog. Exam credits cannot pay for this module.
- Manual actions are registered with durable IDs, immutable prompts and saved
  results, then reserved/completed once. Provider errors release the worker lease
  while retaining the action and successful batches. Resume is available across
  devices. A run with no saved result can be cancelled/refunded; a partial run is
  continued. Paid retries do not call the provider for saved batches again.
- The old local `biogen_usage_count` and Donate self-confirmation are no longer
  payment authority. Existing accounts receive the new server-owned three-action
  trial once, irrespective of that historical local counter. Provider RPM and
  hourly quotas still apply to both products.
- The sales banner links to packages and an authenticated purchase request.
  Both products show the existing bank destination and VietQR with the exact
  package price and a server-generated random payment code. A verified bank
  notification atomically fulfills the order, grants the correct wallet and
  records the receipt once; routine purchases do not require admin approval.
  Teacher payment reports never grant turns and are retained only for legacy
  compatibility. The checkout polls every five seconds while pending/foreground
  and refreshes wallet views when fulfillment is detected.
- Administrators see pending purchases (including email, product, note and
  reported-transfer state), refreshed every 30 seconds while the exam module is
  open. No emails or push notifications are sent. The queue shows up to 100
  pending accounts; resolved purchases cannot hide pending ones. Automatic payment
  event history records matched-transfer exceptions for administrator reconciliation.
  A user has at
  most one pending purchase across products; administrators can close a request
  to permit a different package. Fulfillment updates purchase, balance and receipt
  atomically. Receipt uniqueness is shared by both products.

## Persistence and authority

Collections are `{CREDIT_NAMESPACE}_accounts/{sha256(uid)}` with `exams` and
`ledger` subcollections, plus `{CREDIT_NAMESPACE}_receipts` for unique payment
references. Re-entering the same bank/payment reference cannot grant a second
package, even after a browser reload or through another administrator.
`manual_runs` and `purchases` are account subcollections. The
`{CREDIT_NAMESPACE}_purchase_inbox` mirrors the latest purchase per account,
filtering pending requests before applying the queue limit. It is server-only.
`{CREDIT_NAMESPACE}_payment_codes` maps random QR codes to server-owned orders;
`{CREDIT_NAMESPACE}_payment_events` deduplicates bank transaction IDs and records
matched transfer outcomes. The unique bank-reference receipt is shared with
manual admin grants, preventing replay across products or grant paths.
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
AUTOMATIC_PAYMENTS_ENABLED=false
SEPAY_WEBHOOK_AUTH=hmac
# Backend secret only; never put its value into frontend/Git/chat:
SEPAY_WEBHOOK_SECRET=<a dedicated 32+ character signing secret>
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
match /biogen_preview_purchase_inbox/{document=**} {
  allow read, write: if false;
}
match /biogen_preview_payment_codes/{document=**} {
  allow read, write: if false;
}
match /biogen_preview_payment_events/{document=**} {
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

Automatic payment rollout and SePay/BIDV VA prerequisites:
see `automatic-payments.md`. Without readiness, checkout does not display a QR
or accept new payment requests through its button; existing credits still work.
