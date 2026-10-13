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

## Sales and trial update — 12 October 2026

- Owner authorized immediate two-credit exam trials for every account, with the
  existing blocked state preserved, and three initial free manual actions followed
  by 20,000 VND per three actions. The previous one-credit and manual daily limits
  above describe the earlier preview and are superseded by these rules.
- 40 backend and 33 frontend/data tests pass, including concurrent trial login,
  old trial top-up, separate wallets, purchase/report ownership, no self-grant,
  cross-product receipt replay, registered manual batch recovery and queue filtering.
- Production frontend build and the required Exam Builder TypeScript check pass.
  An additional whole-App TypeScript check still finds the pre-existing invalid
  Paragraph options at `services/docxService.ts:89`; this file was not changed.
- Real Firestore acceptance passed in `biogen_sales_test_1791816297`: eight
  concurrent logins granted only two exam credits and three manual actions;
  three completed runs exhausted manual allowance without changing exam credits;
  reported payment did not grant; admin fulfillment and receipt replay granted
  three actions once. The pending inbox query worked without a composite index.
  All identities and payment references were synthetic, with no AI/provider calls.
- Browser fixture verified the sales banner, manual balance 3 → 2 → 1 with a last
  action warning, automatic purchase dialog at zero, QR/payment-report flow,
  admin inbox and exactly three added actions after synthetic confirmation.
- Preview backend deploy `dep-db6f6p3rjlhs7389o92g` is live at `91ec1b0`;
  frontend deploy `dep-db6f8i8473hc73ea5qng` is live at `c840553`. The latter adds
  a confirmation dialog before the last manual action and includes root App.tsx
  in Tailwind scanning so the warning always overlays the results.
- Live authenticated UI verified the new banner, two available exam credits,
  three separate manual actions and the administrator pending-purchase counter.
  Both previously authorized owner accounts were topped up to a total grant of
  two exam trial credits, held zero. No real AI action or payment was performed;
  no live test purchase was submitted. Production/main remain unchanged.

## Automatic QR payment update — 13 October 2026

- Prices confirmed by the owner: exam packages 199k/349k/479k, manual 20k/3.
  Banner/checkout thank teachers, list the plans, and retain the existing recipient.
- 51 backend and 33 frontend/data tests pass. Scoped TypeScript and production
  frontend build pass. Tests cover HMAC/API-key validation, stale/forged payloads,
  wrong amount/recipient/direction, receipt collisions, blocked users and each wallet.
- Browser fixture accepted signed synthetic incoming events: exam balance 2 → 12
  for the 10-credit package; manual allowance 3 → 6 for the three-action package.
  Checkout detected fulfillment by polling, displayed thanks and refreshed balances
  without an admin grant. No real transfer or provider request occurred.
- Real Firestore acceptance passed in `biogen_payment_test_1791883625`. Eight
  parallel deliveries of each synthetic event granted exactly one exam package
  and one manual package; a restarted service recovered balances 12 and 6.
  This was isolated test data, not money received into a real bank account.
- Live activation remains pending bank/SePay connection, dedicated signing secret
  and owner-performed real transfer acceptance. The ready flag stays false and
  checkout does not ask teachers to pay while this connection is unavailable.
- Preview backend deploy `dep-db6vlq4s728c73cv1s50` and frontend deploy
  `dep-db6vo70m7kps73bi1i4g` are live at `dbff268`. Public health reports
  `ok: true` and credit enforcement enabled; `/api/payment-plans` reports the
  approved prices and `automaticPaymentReady: false`. No backend error logs
  were returned for the deployment window. Authenticated live checkout displays
  all prices, the connection-pending notice and a disabled QR button. No live
  purchase, bank transfer or AI generation was submitted. Main/production remain
  unchanged.
