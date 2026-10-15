# Whole-exam generation

Exam Builder sends one batch request for the locked exam. The backend makes exactly one Gemini `generate_content` attempt for the batch, with SDK retries disabled. Shared learning outcomes appear once in a requirements catalog; every question position references its own requirement. True/False positions retain four separate statement requirements.

The credit route is `POST /api/credits/exams/{examId}/generate` with `slotIds`, `requestId`, and `lang`. The server loads the locked slots from storage, excludes already saved questions, acquires an exam-wide lease, and calls Gemini outside the transaction. A single transaction saves independently validated questions and consumes the existing reservation only when the exam is complete. There is no per-question fallback or automatic format-repair call.

Missing, duplicate, malformed, or oversized questions are returned as failures without discarding other valid questions. A deliberate retry sends all remaining positions in one further call and reuses the exam reservation. Legacy partially generated exams are supported. Individual replacement continues to use the existing item route and replacement allowance.

The browser retains the batch request ID after a lost response. Replaying a completed operation retrieves saved results without another provider call. A new subset or a successful response starts a new operation. Provider failures are not automatically retried; a local rate-limiter admission rejection may wait and retry because no provider request was made. The existing project/model quota still applies.

The loading indicator waits for the complete batch response and does not imply streamed per-question progress. A larger output allowance and 180-second provider timeout accommodate a complete exam; timeouts and truncated JSON remain visible failures.

Deployment order: backend first (old routes remain compatible), then frontend preview and production. No model, key, Firebase, payment, credit namespace, or DOCX configuration change is needed.

Tests cover a mixed 28-question exam making one mocked provider call, partial recovery, legacy drafts, lost responses, lease contention, cancellation, payment guards, usage accounting, and one credit consumed. These tests establish request and accounting behavior; they do not measure live model latency or content quality.
