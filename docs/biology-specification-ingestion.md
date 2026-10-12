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

## Curriculum cross-check and supplementation

The second user-provided source, `14. CT_Sinh hoc.pdf`, is the 65-page Ministry of Education and Training Biology curriculum issued with Circular 32/2018/TT-BGDĐT. Its original bytes are available at `/specification/biology-curriculum-2018.pdf`. The core YCCĐ tables for grades 10 (pages 13–21), 11 (24–38), and 12 (40–54) were compared with the existing catalog, including requirements split into several specification rows. The nine elective tables on pages 21–24, 38–40 and 54–56 were also transcribed after the user requested electives.

`data/biologySpecification/curriculum.psv` stores stable ids, grade, topic, core/elective scope, source pages, and the missing requirement or clause. `curriculum.json` is generated separately from the first source, with its PDF fingerprint, nine elective topics, and the recovered ecosystem outline. The original `catalog.json`, transcription and all existing source row ids/text/codes/levels remain unchanged. Two complete curriculum requirements link back to the incomplete community-practical and succession fragments. Those original fragments remain visible as source issues and are not offered as new outcomes. Existing saved drafts continue to resolve their original ids.

The curriculum does not provide specification competency codes, cognitive-level columns, question addresses or score allocations. Every supplemental record therefore has `null` code/level, empty question references and explicit source labels. No code or level is inferred from the requirement verb. Compound requirements are kept together unless only a particular clause was missing; for example, the Mendel regularity clause is added without duplicating the existing explanation of Mendel's experiment.

| Grade | Added core YCCĐ | Elective YCCĐ | Complete core YCCĐ after supplementation | Complete YCCĐ including electives |
| --- | ---: | ---: | ---: | ---: |
| 10 | 1 | 17 | 104 | 121 |
| 11 | 2 | 15 | 182 | 197 |
| 12 | 19 | 18 | 175 | 193 |
| Total | 22 | 50 | 461 | 511 |

Core gaps filled: virus transmission/prevention (grade 10); the role of plant responses and meristems (grade 11); Mendel regularity, chromosome practical work, Hardy–Weinberg, community as a living level, Shannon practical work, and fourteen ecosystem/biosphere requirements (grade 12). These cover ecosystem concepts, food webs, energy flow, ecological efficiency and its calculation, biogeochemical cycles, ecosystem changes and succession, environmental phenomena, the biosphere and biomes.

Each of the nine elective modules has its own preset. Existing `g10-all`, `g11-all`, `g12-all` and strand presets cover only the core curriculum. Electives are visible in the catalog and available through a scope filter and the nine dedicated presets. All preset allocations remain zero until the teacher chooses them.

## Original specification coverage (before curriculum supplementation)

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
- The end of a community practical requirement on page 30 and the start of the ecosystem section before page 32 are absent in the original PDF. Their remaining fragments are retained and marked incomplete. Complete requirements are now available separately from the curriculum source, with their own page links; the first source is not rewritten.
- Blank cells and unusual combined codes (`NT2/NT6`, `NT4/NT6`, `TH2-5`, `NT5-H`, `VD/NT5`, etc.) remain explicit. “Không có” level cells are retained separately from learning outcomes.
- This file does not establish a term/semester scope, exam duration or complete scoring matrix. No “Sinh 10 HKI” matrix is claimed to come from this source.

## Verification

### Competency descriptors and outcome mapping

`data/biologySpecification/competencies.ts` defines the complete text of all 15 competency expressions in curriculum section IV.2 (pages 5–7): NT1–NT8, TH1–TH5, VD1–VD2. Only line wrapping and final punctuation are normalised. The complete inquiry steps, collaboration/reflection clauses and health/environment/sustainability clauses are retained. Numbering follows the convention already used by the app and specification; the curriculum does not itself print these codes. Cognitive levels and competency groups remain distinct. English descriptions are app translations.

`competencyMappings.ts` attaches a structured `competencySpecification` to each of the 511 usable outcomes. Exact codes and slash combinations link to individual descriptors. Inquiry-step ranges (`TH1-TH5`, `TH2-5`) retain their range notation. Hyphenated pairs of NT codes (`NT2-NT4`, `NT5-NT6`) link only to the two printed codes: in particular the tree-of-life outcome on specification page 27 refers to NT2 and NT4, not NT3. `NT5-H` retains its unexplained suffix while linking the known NT5 base. `VD/NT5` retains its unspecified VD component; no VD1/VD2 is invented.

All 87 usable outcomes without a printed source code remain explicit source gaps. Proposed competency assignments have been removed at the user's request. These outcomes appear under **Nguồn chưa gán mã**, not under an inferred NT/TH/VD code. The curriculum specifies general competency expressions and content outcomes in separate tables; it does not provide an official code-to-outcome matrix. A curriculum locator must never be presented as evidence for an invented competency binding.

The matrix competency menu lists the atomic competencies actually present in that content, with outcome counts. Selecting NT2 includes both single-code NT2 rows and source combinations containing NT2. The expandable **YCCĐ tương ứng** list displays every complete corresponding outcome, its original source code, specification page and curriculum page, and lets the teacher select an outcome without reading a clipped native dropdown. Saved compound-code selections still resolve without rewriting their original ids or allocations. Ambiguous notations remain explicitly marked. Original PDF bytes, transcriptions, catalog ids, backend, review and DOCX formats are unchanged.

`curriculumAlignment.psv` and its generated `curriculumAlignment.json` locate all 511 usable outcomes in the curriculum YCCĐ tables, separately from the competency framework pages 5–7. 504 requirement clauses match after whitespace/punctuation normalisation. Seven visually checked variants retain both source wording and curriculum wording: Bioinformatics/Bioinfomatics; tích luỹ/tích lũy; the separated synthesis-example clause; the CO₂ subscript; the added “cơ chế” in the hormone outcome; and two ecosystem clauses with rewritten references to their preceding context. Source text and competency codes are not overwritten. The crosswalk records both PDF fingerprints and its transcription fingerprint, and `specification:check` verifies one locator per usable id.

`components/CompetencySelect.tsx` displays complete, wrapped expressions both in the selected value and in its scrollable list, with the group and code as secondary information. Matrix and manual generation use the same control and canonical text. Combined codes show every resolved expression, without shortening the constituent text. Arrow keys, Home/End, Enter/Space, Escape and Tab are supported. Manual queues and AI prompts also use the complete descriptions; the locale tables are derived from the shared framework rather than maintaining abbreviated copies.

`npm test` checks source coverage, all grades, source anomalies, question references, preset isolation, legacy draft lookup, and the unchanged engine's matrix → 12 MCQ + 2 T/F (4 statements each) + 4 short-answer slots → mock generation → format validation → draft recovery flow for each grade.

The 13 tests also verify the 72 supplemental records, null source code/level, original-id preservation, distinct PDF links, fragment recovery, exact coverage of all nine electives, separation from core presets, and the generation/draft flow for elective matrices in each grade.

`npm run typecheck:exam-builder` checks the component and its complete import graph. Full-repository `tsc --noEmit` encounters a pre-existing `cconst` typo in the unused root `firebase.ts`; this task deliberately leaves Firebase files unchanged.

`npm run build` builds the frontend. The application continues to use the existing Firebase/backend, generation, review, draft, scoring and DOCX services without edits.

The built frontend was also exercised in a browser for grades 10, 11 and 12: lock a valid matrix, generate 18 mock questions, verify export is blocked before review, approve and lock all questions, reload and restore the draft, then download the mixer DOCX. Grade 12 additionally exported the full dossier. The three mixer files each contain exactly 12 underlined MCQ answer letters, four underlined true-statement letters across the two T/F questions, and four short numeric answers. A 390-pixel mobile viewport was checked for preset loading, searching and adding a source outcome. The original PDF endpoint returned a valid PDF.

After supplementation, browser verification repeated the complete workflow for six cases (core and electives for each grade), including DOCX downloads and the grade-12 elective dossier. All nine elective presets were loaded individually and checked against their expected row counts. Catalog verification checked core/elective filters, searching and adding the Shannon requirement, both its curriculum page-51 link and original fragment page-30 link, the Hardy–Weinberg page-47 link, the 25 complete ecosystem/biosphere rows, and a mobile search for the vector requirement. Both original PDFs remain available from distinct endpoints.
