# Question content and Word equations

Question stems, options, answers and explanations share one parsed content tree in the question list, quiz and Exam Builder review. The manual, full-package and mixer DOCX exporters use that same tree.

## Content contract

- Plain text and Unicode symbols remain text.
- Supported HTML includes paragraphs, line breaks, bold/italic/underline/strike, subscript/superscript, ordered/unordered lists and tables. Common editor styles for bold, italic, underline and vertical alignment are normalized to those tags.
- Inline equations use `$...$` or `\(...\)`; display equations use `$$...$$` or `\[...\]`. JSON responses must escape backslashes normally.
- Presentation MathML and Quill `ql-formula` spans are supported. LaTeX is parsed by KaTeX, including mhchem `\ce{...}`.
- Web equations use sanitized MathML. Word equations use native OMML with Cambria Math, including fractions, roots, scripts, matrices, accents and limits. They remain editable Equation objects.
- `docx` is pinned to the Word-verified 8.5.0 runtime, including when the hosting build resolves dependencies with Yarn.
- External resources, scripts, event handlers and arbitrary CSS are never forwarded. Images and unsupported formulas produce an explicit error; export stops rather than silently replacing an equation with an image or raw LaTeX.

This preserves supported content and equation structure across web and Word. Word retains its document layout, fonts and pagination; it is not a pixel copy of the browser. Arbitrary HTML/CSS, nested table layout and every possible TeX extension are not part of this contract.

## Verification (2026-10-15)

- `npm test`: 43 passing tests, including HTML safety, equations, chemical scripts, all three DOCX exporters and unchanged mixer answer conventions.
- Expanded TypeScript check covering the shared renderer, question/quiz/review components and all exporters passed.
- Production Vite build passed with the existing backend URL; the existing large-bundle warning remains.
- Synthetic MCQ, true/false and short-answer fixtures were checked in the browser. The actual browser download button produced a DOCX.
- Microsoft Word opened all three generated DOCX files and recognized 16 native equations in the manual document, 16 in the package and 9 in the mixer document. All six PDF-rendered pages were visually inspected, including the corrected mhchem post-scripts.
- No provider calls or customer credits were used for these checks. Backend, authentication, payment and credit configuration are unchanged.

The fixtures are in `tests/fixtures/questionFormatting.ts`; local screenshots, DOCX and rendered PDFs live under ignored `tmp/formatting-qa/`.
