# Biology specification ingestion

The Exam Builder catalog was transcribed against all 33 rendered pages of the original `Bảng đặc tả Sinh học THPT.pdf`. The Markdown attachment is preserved byte for byte as an OCR reference. The original PDF is available from `/specification/biology-thpt.pdf`, including page anchors in the catalog and matrix.

## Source of truth

- `data/biologySpecification/grade10.psv`, `grade11.psv`, `grade12.psv`: one record per nonempty requirement cell, with cognitive level, printed competency code, page(s), complete requirement text, and the three original question-address cells. `|` separates fields. `@` introduces a content unit and its strand. Codes are not inferred from verbs or cognitive levels.
- `data/biologySpecification/topicOutlines.json`: the left-column content outlines. The ecosystem heading is explicitly marked as inferred because its original heading is absent.
- `data/biologySpecification/catalog.json`: reproducible structured output, source SHA-256 fingerprints, all raw Markdown pages, topics, rows, duplicates and source limitations.
- `data/biologySpecification.ts`: the grade/content/code selection adapter. Only complete, nonempty canonical rows are offered as new outcomes.
- `data/examBlueprintPresets.ts`: coverage presets derived from the source catalog, separate from the component. Presets contain no inferred allocations. The existing application score defaults remain application defaults. Loading a preset retains the teacher's score/duration settings and starts every allocation at zero.
- `data/biologySpecification/legacyOutcomes.ts`: compatibility lookup for saved v1 draft IDs only. These older sample outcomes are not inserted into new source menus.

Run `npm run specification:ingest` after editing the transcription or outlines. `npm run specification:check` verifies the generated file is current and the source fingerprints match.

## Coverage

| Grade | Content units | Source rows, including repeated/empty/partial cells | Complete canonical YCCĐ available in builder |
| --- | ---: | ---: | ---: |
| 10 | 13 | 104 | 103 |
| 11 | 20 | 195 | 180 |
| 12 | 13 | 180 | 156 |
| Total | 46 | 479 | 439 |

There are 33 repeated rows, 5 explicit “Ko có.” cells and 3 incomplete fragments; the repeated page-31 fragment belongs to both the repeated and incomplete categories. No source row is deleted. The source catalog can show these records, but its Add button is omitted for them.

18 source occurrences have no printed competency code; 12 have no determinable cognitive-level group. These fields remain `null` in the structured source. The adapter uses an empty code for the existing string-based engine, with an explicit “Nguồn không ghi mã” label. Cognitive level remains `null`; the teacher sets the matrix allocation without an inferred source level.

## Source limitations

- The three final columns are **addresses of illustrative questions/statements**, not question counts or scoring allocations. They are retained verbatim apart from line wrapping, in `questionReferences`. A bare “Câu 4” in the T/F column is not silently expanded to four statements.
- Page 28 repeats the 16 evolution outcomes on page 27. Both occurrences are retained, with `duplicateOf` links.
- Page 31 repeats the grade-11 response/growth material on page 17, despite appearing inside the grade-12 section. These 15 records retain grade 11 and page 31 provenance; they do not enter grade-12 menus.
- The end of a community practical requirement on page 30 and the start of the ecosystem section before page 32 are absent in the original PDF. Their remaining fragments are retained and marked incomplete. No replacement requirement is invented.
- Blank cells and unusual combined codes (`NT2/NT6`, `NT4/NT6`, `TH2-5`, `NT5-H`, `VD/NT5`, etc.) remain explicit. “Không có” level cells are retained separately from learning outcomes.
- This file does not establish a term/semester scope, exam duration or complete scoring matrix. No “Sinh 10 HKI” matrix is claimed to come from this source.

## Verification

`npm test` checks source coverage, all grades, source anomalies, question references, preset isolation, legacy draft lookup, and the unchanged engine's matrix → 12 MCQ + 2 T/F (4 statements each) + 4 short-answer slots → mock generation → format validation → draft recovery flow for each grade.

`npm run typecheck:exam-builder` checks the component and its complete import graph. Full-repository `tsc --noEmit` encounters a pre-existing `cconst` typo in the unused root `firebase.ts`; this task deliberately leaves Firebase files unchanged.

`npm run build` builds the frontend. The application continues to use the existing Firebase/backend, generation, review, draft, scoring and DOCX services without edits.

The built frontend was also exercised in a browser for grades 10, 11 and 12: lock a valid matrix, generate 18 mock questions, verify export is blocked before review, approve and lock all questions, reload and restore the draft, then download the mixer DOCX. Grade 12 additionally exported the full dossier. The three mixer files each contain exactly 12 underlined MCQ answer letters, four underlined true-statement letters across the two T/F questions, and four short numeric answers. A 390-pixel mobile viewport was checked for preset loading, searching and adding a source outcome. The original PDF endpoint returned a valid PDF.
