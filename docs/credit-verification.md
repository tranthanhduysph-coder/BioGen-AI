# Preview credit verification — 12 October 2026

Implementation: `feature/exam-blueprint-builder`, shared Gemini backend.

- Frontend production build and scoped TypeScript check pass.
- 31 frontend/data tests pass, including lost reservation/replacement response
  recovery, immutable request IDs, and cancelled-exam handling.
- Backend tests exercise concurrent reservation, approval/blocked accounts,
  insufficient credits, owner isolation, expired-lease fencing, one-time trial
  grants, package/payment-reference replay, completion, refunds, manual-question
  limits, preservation of other manual edits, and provider usage accounting.
- A Firestore SDK retry regression test covers ABORTED during reads. The first
  live concurrency test identified that SDK commit retries did not cover this
  read case; the store now retries a fresh transaction with bounded backoff.
- Real Firestore acceptance passed in the separate synthetic namespace
  `biogen_credit_acceptance_20261012`: 8 parallel requests reserved one exam and
  one credit; completing every slot consumed once; constructing a new service
  recovered both result and balance; repeating a payment reference did not grant
  a second package. No AI provider was called in this database acceptance test.
- Browser fixture: 12 MCQ + 2 TF + 4 short-response questions completed with
  balance 10 → 9; cloud recovery returned all 18 questions and retained approval;
  entering the same synthetic payment twice left the teacher at 20 credits.
- Live Firestore rules were read before provisioning. Their existing client
  access cutoff expired in December 2025, so current browser access is denied.
  An unauthenticated REST probe returned 403. These rules were not modified.
- A dedicated `biogen-credit-preview` service identity has `roles/datastore.user`.
  Its credential is stored as `biogen-firestore.json` in Render Secret Files,
  never in Git, a client bundle, test output or screenshot.

Preview backend and frontend were deployed with enforcement initially disabled.
The owner subsequently authorized both administrator accounts and one trial
credit for each. Both accounts were initialized idempotently with balance 1,
held 0; the runtime UID allowlist and credit enforcement were then enabled on
the preview backend. Production/main and its services have not been modified.

Runtime limitations remain documented in `exam-credits.md`: manual review is
explicitly saved to the account, browser closure pauses the batch, provider quota
still applies, and packages are granted manually after payment verification.
