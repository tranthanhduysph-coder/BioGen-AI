# Exam Builder workspace

The automatic exam module uses the full application width, up to 1920px, instead of sharing the manual question generator's 4/12-column configuration sidebar. The manual generator retains its configuration/results layout.

The three steps are Setup, Matrix allocation, and Generate/review. Panels stay mounted while navigating; navigation does not change the blueprint or discard questions. Locking opens the review step. Restored cloud exams open review, and saved local review drafts have a visible restore action. Editing the blueprint uses the existing draft invalidation behavior.

The sticky toolbar sits below the measured application header and shows MCQ question counts, TF statement counts and short-answer counts. Count completion, missing counts, excess counts and invalid groups of four are labeled explicitly as well as colored. Overall locking still uses the original engine validation. Clicking a count focuses the relevant allocation input; incomplete TF group links focus a row of the corresponding content.

Account/credit controls and outcome lookup remain available as expandable sections. The plan banner is compact in the automatic workspace; the purchase dialog retains its plans and QR flow. Competency selections show compact summaries while expanded options retain full descriptions and linked outcomes.

The matrix has its own bounded scroll region, sticky two-row headings, a fixed content column during horizontal scrolling and sticky column totals. Numeric input text remains visible in narrow columns.

## Validation — 2026-10-15

- 46 frontend tests passed, including three new progress tests for a 7+1 TF split, grouping across rows of the same content and missing/excess/zero targets.
- Expanded TypeScript check through `App.tsx` and the production Vite build passed.
- Browser checks used local guest data, with no AI generation or customer credit consumption: invalid 7+1 grouping blocks lock, 13/12 MCQ reports excess, valid 12 MCQ + 8 TF statements + 4 short answers enables lock and opens the 18-question structure in review.
- Desktop scrolling keeps the complete toolbar below the application header. At a 390px viewport the page width remained within the viewport and the matrix scrolled internally. Manual module switching retained its separate layout.
