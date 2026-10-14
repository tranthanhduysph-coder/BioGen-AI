# Automatic QR payments — preview setup

The code is prepared for both products. The owner registered SePay's Free plan
and linked the BIDV account using identity/OTP directly. The verified bank and
VA are below; authenticated webhook setup and real-transfer acceptance remain
separate steps. No bank login, SMS routing, paid subscription or real transfer
has been performed by the agent.

## Confirmed products and recipient

| Product | Allowance | Price |
| --- | --- | --- |
| Exam | 10 credits / 10 exams | 199,000 VND |
| Exam | 20 credits / 20 exams | 349,000 VND |
| Exam | 30 credits / 30 exams | 479,000 VND |
| Manual questions | 3 generation actions | 20,000 VND |

The owner changed the recipient to BIDV, account **1410373736**, TRAN THANH DUY.
SePay's linked official VA is **96247BIOGENAI**. QR transfers MUST use that VA,
not the main account, because BIDV personal API notifications cover VA receipts.
The same VietQR image service is retained; each order inserts its exact amount,
VA and random memo. Main bank details/prices live in `data/paymentPlans.json`;
`SEPAY_BIDV_VA` supplies the confirmed VA from the backend environment.
Trials remain two exam credits and three manual actions once per account.

## Bank/provider prerequisite

SePay's Free plan lists 50 incoming transactions/month and webhook/API support;
the owner's dashboard shows Free. Limits count bank receipts, not generated
exams. Over-limit service charges and bank fees are separate from the 0 VND plan.
The earlier Techcombank/SMS route was superseded by the owner's explicit BIDV
choice. The BIDV dashboard confirms main account 1410373736 and VA 96247BIOGENAI.
No actual incoming transfer has been confirmed yet.

The owner handles bank/provider identity, consent, OTP and any paid subscription
directly. The app needs only authenticated incoming transaction notifications;
it does not need internet banking credentials or withdrawal authority.

Sources checked 14 October 2026:
- https://sepay.vn/bang-gia.html
- https://sepay.vn/faq.html
- https://docs.sepay.vn/ket-noi-bidv.html

## Configure only after the connection is confirmed

1. Use the verified BIDV account/VA in SePay and verify incoming transaction
   data contains the main `accountNumber`, VA in `subAccount`, complete order
   memo and exact amount, including 20,000 VND. Do not substitute a transfer
   into the main account for a VA test.
2. Configure one **incoming transfers / JSON** webhook for this account only:
   `https://biogenai-api-preview.onrender.com/api/payments/sepay/webhook`.
3. Prefer HMAC-SHA256. Configure a dedicated strong secret in SePay and as
   `SEPAY_WEBHOOK_SECRET` on the Render backend, with `SEPAY_WEBHOOK_AUTH=hmac`.
   Set secrets directly in their dashboards; do not paste them into chat.
   API-key authentication is supported only if explicitly configured as `apikey`.
4. If using SePay code filtering, register prefix `BGP`, exactly 20 alphanumeric
   suffix characters, for the preview. Orders use hexadecimal uppercase suffixes.
   `biogen_preview` uses BGP; other isolated namespaces use BGL. Production must
   use a separate namespace, secret, endpoint and provider filter configuration.
5. Set `SEPAY_BIDV_VA=96247BIOGENAI`. Without a valid 96247-prefixed VA, readiness
   stays false even when the other flags and secret are set. Limit the webhook
   to this account and this VA, JSON/incoming only, with retry enabled.
   Only after the linked bank/VA and authenticated webhook are verified and the
   backend secret is ready, set `AUTOMATIC_PAYMENTS_ENABLED=true` on preview.
6. The owner performs the real transfer acceptance test directly. Verify the
   authenticated UI receives the purchased allowance once in each module, and
   replaying a provider notification does not grant again. No main merge occurs.

SePay Test mode uses the same payload format as real transfers, so it MUST NOT
share the live signing secret or credit namespace. A signed simulated positive
transaction cannot be distinguished from a live one solely from the payload.
The provider's signed Send test payload with integer ID 0 is acknowledged only
as a connection probe, with no ledger/order/storage call. Forged probes are
rejected. Actual settlement still requires a strictly positive transaction ID.
This is not a substitute for separating Test mode and Live credentials/data;
Test mode can use positive IDs.

## Receiver and ledger behavior

- Verify HMAC over original request bytes and the signing timestamp (five-minute
  window), or the explicitly configured API key. Missing setup rejects requests.
- Accept only incoming BIDV transfers with both main account 1410373736 and
  the exact configured VA in `subAccount`. A missing/different VA, old bank or
  main-account-only transfer cannot grant allowance.
- Match the random payment code to the stored UID, product, allowance and price;
  client-supplied amounts, UID or balances never control fulfillment.
- Require exact amount and a transaction time no earlier than order creation
  (60-second tolerance for bank/server timestamp differences).
- Snapshot both main account and VA in the stored purchase. An order issued
  before the recipient change cannot be silently reused: checkout hides its
  outdated QR and the backend refuses to settle it for the new recipient.
- Record the transaction ID, bank reference, order status, grant and wallet in one
  Firestore transaction. Concurrent retries and manual admin grants cannot replay
  the same bank reference. AI/network calls are outside these transactions.
- Over/underpayment, closed order and previously used receipt are logged for
  reconciliation and do not silently grant an incorrect package. A blocked user
  may receive a paid balance but stays blocked from generation.
- Do not store unrelated bank transactions, payer descriptions or account balance
  snapshots. Auth failures and malformed-body errors do not echo financial data.
- Return `{"success": true}` only after durable processing. Storage failures return
  an error so SePay can retry. The browser polls its own order every five seconds
  while visible/pending, then shows thanks and refreshes the correct wallet.

Official implementation sources:
- https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook
- https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc
- https://developer.sepay.vn/vi/sepay-webhooks/cau-hinh-ma-thanh-toan
- https://developer.sepay.vn/vi/sepay-webhooks/test-mode/so-sanh-voi-live
