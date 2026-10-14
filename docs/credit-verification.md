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

## Payment support and launch preparation — 13 October 2026

- Shared payment help explains exact transfer amount/memo, preserved account
  balances, delayed confirmation, mismatches, duplicate transfers and support
  reconciliation. It appears in checkout and the Vietnamese/English user guide.
- Closed purchase history now shows the account's own order ID and reconciled
  bank reference. The user guide describes the current Exam Builder and demo
  limits, replacing obsolete guest/quick-exam instructions.
- The launch checklist records dashboard settings, current published SePay
  prices and real-transfer acceptance steps. Proposed refund terms remain a
  local review draft, not a published guarantee or automatic bank refund.
- 33 frontend/data tests, Exam Builder and Footer scoped TypeScript checks,
  production frontend build and diff whitespace checks pass. Backend generation,
  balances, payment settlement, Firebase and DOCX were not changed in this update.
- Frontend preview deploy `dep-db7009rncjis73f2b4q0` is live at `928ba27`.
  Authenticated checkout and the user-guide dialog display the new help;
  the QR button remains disabled with the connection-pending notice. Screenshot:
  local `tmp/payment-support-live.png`. No live purchase was submitted.
  SePay account/bank setup and real payment acceptance remain pending. No paid
  subscription, bank permission change or real transfer was performed.

## BIDV VA migration — 14 October 2026

- The owner chose SePay Free and changed the recipient to BIDV, correcting the
  main account to 1410373736. The owner completed identity/OTP linking directly.
  SePay's bank detail confirms that account and official VA 96247BIOGENAI.
- Main account and VA are separate: VietQR uses the VA, and settlement requires
  gateway BIDV, the exact main account and configured VA in subAccount. Missing
  or wrong VA and transfers to the previous bank cannot grant allowance.
- New purchases snapshot their recipient. The frontend suppresses old/mismatched
  QR codes, and the backend refuses settlement against a changed recipient.
  The QR helper also refuses to fall back to the main BIDV account.
- 54 backend and 36 frontend/data tests pass; scoped TypeScript and production
  frontend build pass. The real Firestore concurrency/restart acceptance passed
  in synthetic namespace biogen_payment_test_1791938110, granting each of the
  two synthetic packages once. No real bank payment or AI request was performed.
- SePay retained its existing DH pattern and now has BGP + exactly 20 alphanumeric
  characters enabled, verified after reload. The owner saved the dedicated HMAC
  secret directly into SePay/Render and saved the webhook. The SePay list shows
  one active HMAC webhook limited to BIDV and the chosen VA; authenticated delivery
  and real-transfer acceptance still need verification. Render has the confirmed
  VA and hmac mode with automatic payments kept disabled during rollout.

### Authenticated connection and QR activation

- Backend BIDV deploy `dep-db7d00bbc2fs73eo2hdg` and frontend
  `dep-db7d112j9qps73bvrva0` went live at `f8e3c19`. Activation of the confirmed
  VA and HMAC settings reports `automaticPaymentReady: true`; secrets were never
  read into chat, screenshots or source. Only preview was enabled.
- SePay Send test initially reached validation and returned 422 for its mock
  payload. Official documentation identifies mock integer ID 0. The receiver
  now ACKs that authenticated connection probe without accessing any account,
  order or ledger. Real settlement still rejects nonpositive/invalid IDs; forged
  probes fail HMAC. All 55 backend tests pass; the 36 frontend tests and build
  remain valid (the probe change does not modify the frontend).
- Backend probe deploy `dep-db7da55g1s2s73a3h5t0` is live at `0b781be`. SePay's
  Send test reports HTTP 200, 512ms. This proves authenticated connectivity, not
  a bank receipt. The saved webhook was reviewed: JSON/incoming, retry enabled,
  bank 1410373736, only VA 96247BIOGENAI, skip transactions without a code.
- The owner transferred 20,000 VND directly for manual order
  `cff10e13-c49e-4188-8ea4-3d724b983cde`, memo `BGP097E436D5C634F1E8DEB`.
  SePay recorded incoming funds into the configured BIDV VA; bank reference
  `463D419B-4B94-48C4-9476-3F0346C907A4`, transaction `89710446`.
  Delivery log `56784973` reports HTTP 200. Checkout automatically became
  fulfilled and the manual balance increased from 3 to 6, without an admin grant.
  The reopened app retains the fulfilled order; exam balance remains 2.
- Local evidence: `tmp/bidv-live-payment-qr.png` and
  `tmp/sepay-hmac-probe-success.png` and `tmp/bidv-manual-payment-success.png`.
  Real exam-package payment acceptance is recorded below. Main and production
  are unchanged.

### Continued live acceptance

- A fresh preview tab loaded the saved manual balance of 6, with 0 held, and
  the exam balance of 2, with 0 held. This verifies persistence across opening
  the app again; a full sign-out/sign-in cycle has not yet been performed.
- The owner transferred 199,000 VND for exam order
  `78d2621c-818c-47cf-b8f2-b659ef7a2948`, memo `BGP92DBF9B7E305444C9687`.
  SePay transaction `89824997` confirms the exact amount and VA, reference
  `E75B2D65-E0AB-4099-8328-9FC8E0B8EF5B`. Delivery log `56868123` reports
  HTTP 200 at 14:48:47 local time. Checkout automatically became fulfilled;
  the exam balance rose from 2 to 12, with 0 held. The account ledger shows
  exactly one +10 exam grant and the earlier +3 manual grant in separate wallets.
  No admin grant was used for either payment.
- Evidence: `tmp/bidv-exam-payment-success.png`, `tmp/bidv-exam-payment-qr.png`
  and `tmp/bidv-manual-balance-persisted.png`. QR screenshots are historical
  evidence after fulfillment and must not be reused for another transfer.
- Requested replay through SePay's delivery history and transaction detail.
  The interface did not provide a completed replay result or a new delivery log
  during this session; live provider replay acceptance remains unverified.
  The previously passing parallel/restart Firestore tests verify deduplication
  using isolated synthetic events, not a completed live SePay replay.

## Arbitrary administrator allowance — 14 October 2026

- The administrator UI now has independent exam/manual amount inputs with Add
  and Remove buttons, rather than package-based gifts. Removed the redundant
  trial button. Bank reconciliation remains available only for a selected order.
- The server checks administrator identity and strict whole-number amounts,
  records the administrator/reason as zero-value gift/revoke ledger entries,
  and preserves account status, trial eligibility, payment receipts, pending
  purchases and active reservations. Excess removal fails without any write.
  Durable operation IDs prevent repeated grants/removals on retries.
- 63 backend tests and 36 frontend/data tests pass. Exam Builder scoped
  TypeScript, frontend build and whitespace checks pass. The existing Vite
  large-chunk advisory remains; no new build failure.
- Local UI acceptance used MemoryStore and fake accounts only: a teacher's
  initial exam/manual balances 2/3 became 9/8 after gifts of 7/5, then 6/4
  after removals of 3/4. Reload retained the values. The UI blocks excessive
  removal and fractional amounts, clears stale confirmation when inputs change,
  and hides administrator controls from the teacher. No bank or AI calls.
- Backend deploy `dep-db7jjhjncjis73eirs3g` is live at `b9c852b`; compact
  frontend deploy `dep-db7jkda5b2lc7386v2j0` is live at `ba4751d`.
  Public health reports `ok: true`, and OpenAPI exposes the protected adjustment
  route with integer amounts. No live account was granted or revoked during
  this feature test. Main and production remain unchanged.
- Authenticated live preview displays both arbitrary-amount controls and the
  compact Add/Remove buttons, with no package or trial-grant buttons. Account
  picker retains the owner's real 12 exam / 6 manual balances and the second
  administrator's 2 / 3 balances. Screenshot: `tmp/admin-allowance-live.png`.
