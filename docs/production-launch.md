# BioGen AI — production deployment

The owner authorized merging `feature/exam-blueprint-builder` into `main`
and launching the official version on 14 October 2026 (Asia/Saigon).
Earlier preview-only restrictions remain historical acceptance records.

## Deployment contract

- Frontend: existing Render static site `srv-d4gliuchg0os73fsqjs0`, branch
  `main`, publish directory `dist`, https://biogenai.vn. The www domain
  redirects to the apex. Keep https://biogenai.onrender.com available.
- Build-time `VITE_API_BASE_URL` must point to
  `https://biogenai-api-preview.onrender.com`. The existing service name is
  retained so bank webhooks and paid balances continue to work.
- Backend: existing service `srv-db33kogm7kps73ctqpd0`. Promote its source
  branch to `main` and set `APP_ENV=production`. Keep automatic deploy off
  until a separate release workflow is agreed.
- Preserve Firebase project `biogen-ai`, Firestore database `(default)`,
  credit namespace `biogen_preview`, administrator UIDs, server credentials,
  provider configuration, bank VA and the existing signed SePay receiver.
  This namespace contains real purchases; it is not disposable test data.
- Never reset account documents or issue another trial during the launch.
  The pre-launch acceptance account has 12 exam / 5 manual turns and no
  active reservation. Do not spend these for an unnecessary repeat AI test.
- Firebase allows biogenai.vn and www.biogenai.vn. Backend CORS explicitly
  allows both HTTPS origins and the existing frontend Render URLs.
- Frontend builds contain no Gemini key or service account credential.
  Authentication and metering remain enforced by the backend for both modules.

## Release verification

The pre-merge checks passed: 36 frontend tests, 63 backend tests, reproducible
specification import (511 curriculum alignments), scoped Exam Builder
TypeScript check, and Vite production build using the intended API URL.
The existing bundle-size warning is a performance limitation, not a build
failure. Backend tests require an unrestricted local process on this Windows
host; the sandboxed TestClient run hung, while the same suite outside the
sandbox completed successfully.

After deployment verify the live commit on Render, HTTPS and www redirect,
the new frontend bundle and API URL, health, payment plans, explicit CORS,
and rejection of unauthenticated generation/credit requests. Check that
credit balances and webhook configuration remain intact. Google sign-in
must be checked with a real session; the integrated browser previously
returned auth/network-request-failed, so a button click alone is not proof.
Real AI, DOCX and both paid wallets were accepted on the same backend before
promotion; see credit-verification.md. Provider-side replay did not produce
a new delivery log; receiver concurrency/idempotency checks passed.

## Rollback

Before the promotion the frontend was live at `3977ed8`, deploy
`dep-db2v9be0tbcc7385vqs0`; backend was live at `23abe36`, deploy
`dep-db7l77uk1f9s7385dbvg`. Prefer rolling back a faulty new frontend to the
accepted feature build rather than the legacy frontend, which predates
mandatory payment enforcement. Keep the backend receiver and credit store
running during any frontend rollback. Do not roll back wallet documents or
paid receipts. Keep production releases manual to avoid accidental rollout
of later branch edits.
