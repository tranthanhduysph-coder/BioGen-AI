# Automatic QR payments — preview setup

The code is prepared for both products. This document does not mean SePay or the
bank is connected. No bank login, SMS routing, provider subscription or real
transfer has been performed by the agent.

## Confirmed products and recipient

| Product | Allowance | Price |
| --- | --- | --- |
| Exam | 10 credits / 10 exams | 199,000 VND |
| Exam | 20 credits / 20 exams | 349,000 VND |
| Exam | 30 credits / 30 exams | 479,000 VND |
| Manual questions | 3 generation actions | 20,000 VND |

The existing QR recipient remains Techcombank / TCB, account 84907276901,
TRAN THANH DUY. The same VietQR image service is retained; each order inserts its
own exact amount and random memo. Prices/recipient live in `data/paymentPlans.json`.
Trials remain two exam credits and three manual actions once per account.

## Bank/provider prerequisite

SePay's published Free plan lists 50 transactions/month and API/webhook support,
but its listed direct-API banks do not include Techcombank. The FAQ describes
SMS Banking as a separate connection requiring SMS balance notifications to a
SePay-provided number. Do not assume the Free plan can connect this Techcombank
account, or assume all 20,000 VND transfers generate usable notifications.
The owner must confirm current Techcombank connection support, any SePay/SMS
fees and notification thresholds before enabling the QR. No recipient change
is authorized as a workaround.

The owner handles bank/provider identity, consent, OTP and any paid subscription
directly. The app needs only authenticated incoming transaction notifications;
it does not need internet banking credentials or withdrawal authority.

Sources checked 12 October 2026:
- https://sepay.vn/bang-gia.html
- https://sepay.vn/faq.html
- https://sepay.vn/blog/api-techcombank-api-ngan-hang-techcombank-moi-nhat/

## Configure only after the connection is confirmed

1. Link the existing Techcombank account in SePay and verify incoming transaction
   data contains the complete order memo and exact amount, including 20,000 VND.
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
5. Enable automatic retry on failures. Only after the bank is verified and the
   backend secret is ready, set `AUTOMATIC_PAYMENTS_ENABLED=true` on preview.
6. The owner performs the real transfer acceptance test directly. Verify the
   authenticated UI receives the purchased allowance once in each module, and
   replaying a provider notification does not grant again. No main merge occurs.

SePay Test mode uses the same payload format as real transfers, so it MUST NOT
share the live signing secret or credit namespace. A signed simulated positive
transaction cannot be distinguished from a live one solely from the payload.
The provider form's example transaction ID 0 is rejected, but that is not a
substitute for separating Test mode and Live credentials/data.

## Receiver and ledger behavior

- Verify HMAC over original request bytes and the signing timestamp (five-minute
  window), or the explicitly configured API key. Missing setup rejects requests.
- Accept only incoming Techcombank transfers into the existing recipient.
- Match the random payment code to the stored UID, product, allowance and price;
  client-supplied amounts, UID or balances never control fulfillment.
- Require exact amount and a transaction time no earlier than order creation
  (60-second tolerance for bank/server timestamp differences).
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
