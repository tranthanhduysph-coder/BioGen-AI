import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import JSZip from 'jszip';
import { createElement } from 'react';

mkdirSync('tmp/tests', { recursive: true });
const target = resolve('tmp/tests/question-content.cjs');
await build({ stdin: { contents: `
export * from './services/questionContent';
export * from './services/questionContentDocx';
export * from './services/docxService';
export * from './services/examMixDocxService';
export * from './services/examPackageDocxService';
export * from './tests/fixtures/questionFormatting';
export { createDefaultBlueprint } from './data/examBlueprintPresets';
export { Packer, Document, Paragraph } from 'docx';
export { renderToStaticMarkup } from 'react-dom/server';
export { QuestionContent } from './components/QuestionContent';
`, resolveDir: process.cwd(), loader: 'tsx' }, outfile: target, bundle: true, platform: 'node', format: 'cjs',
  loader: { '.css': 'empty' }, external: ['react', 'react-dom/server'] });
const api = createRequire(import.meta.url)(target);
const xml = async document => (await JSZip.loadAsync(await api.Packer.toBuffer(document))).file('word/document.xml').async('string');
const walk = ns => ns.flatMap(n => [n, ...(n.kind === 'element' ? walk(n.children) : [])]);

test('HTML text, entities and typography retain meaning through the shared content tree', () => {
  const nodes = walk(api.parseQuestionContent('<p><b>ADN</b> &amp; O<sub>2</sub> + Ca<sup>2+</sup> &alpha; &le; &times; →</p>'));
  assert.ok(nodes.some(n => n.tag === 'b')); assert.ok(nodes.some(n => n.tag === 'sub')); assert.ok(nodes.some(n => n.tag === 'sup'));
  assert.equal(api.contentPlainText('<b>A.</b> O<sub>2</sub> &amp; α'), 'A. O2 & α');
});

test('untrusted question HTML cannot execute scripts, load resources or inject attributes', () => {
  const value = '<script>evil()</script><iframe src="https://evil.test"></iframe><p onclick="evil()"><a href="javascript:evil()">ADN</a><math><mi onclick="evil()">p</mi></math></p>';
  const markup = api.renderToStaticMarkup(createElement(api.QuestionContent, { value }));
  assert.doesNotMatch(markup, /script|iframe|onclick|javascript:|evil\(/);
  assert.match(markup, /<math/); assert.match(markup, /ADN/);
});

test('all equation delimiters, nested fractions, roots, scripts and chemistry become MathML and editable OMML', () => {
  const samples = ['$p<q$', '$$\\frac{p^2}{q_1}+\\sqrt[3]{8}$$', '\\(\\alpha \\le \\beta \\times 2\\)', '\\[\\sum_{i=1}^n i\\]', '$\\ce{CO2 + H2O -> O2}$', '$\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$'];
  for (const source of samples) {
    const math = walk(api.parseQuestionContent(source)).find(n => n.kind === 'math');
    assert.ok(math, source); const omml = api.mathmlToOmml(math.mathml);
    assert.match(omml, /<m:oMath/); assert.doesNotMatch(omml, /annotation|\\frac|<img|&amp;lt;/);
  }
});

test('invalid equations visibly warn and stop DOCX export instead of silently losing notation', () => {
  const source = '$\\frac{1}{$';
  assert.ok(api.contentErrors(api.parseQuestionContent(source)).length);
  assert.throws(() => api.richTextBlocks(source), /Công thức/);
});

test('editor formulas and raw MathML stay native, and chemistry does not reserve phantom atom width', () => {
  for (const source of ['<span class="ql-formula" data-value="\\frac{1}{2}"></span>', '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>']) {
    const math = walk(api.parseQuestionContent(source)).find(n => n.kind === 'math');
    assert.match(api.mathmlToOmml(math.mathml), /<m:f>/);
  }
  const chemistry = walk(api.parseQuestionContent('$\\ce{6CO2 + 6H2O -> C6H12O6 + 6O2}$')).find(n => n.kind === 'math');
  const omml = api.mathmlToOmml(chemistry.mathml);
  assert.doesNotMatch(omml, /<m:phant>|>X</);
  assert.equal((omml.match(/<m:sSub>/g) || []).length, 6);
});

test('manual, full package and mixer DOCX all preserve HTML and native equations', async () => {
  const bp = api.createDefaultBlueprint(12);
  for (const document of [api.createManualExamDocument(api.formattingQuestions), api.createExamPackageDocument(bp, api.formattingItems), api.createMixReadyExamDocument(bp, api.formattingItems)]) {
    const documentXml = await xml(document);
    assert.match(documentXml, /<m:oMath/); assert.match(documentXml, /<m:f>/); assert.match(documentXml, /<m:rad>/);
    assert.match(documentXml, /w:val="subscript"/); assert.match(documentXml, /w:val="superscript"/);
    assert.match(documentXml, /α/); assert.match(documentXml, /≤/); assert.match(documentXml, /→/);
    assert.match(documentXml, /<w:tbl>/); assert.doesNotMatch(documentXml, /&lt;(?:p|sub|sup|table|b)&gt;|\\frac|\\sqrt/);
  }
});

test('mixer retains only the correct answer labels underlined and does not duplicate HTML-wrapped labels', async () => {
  const items = structuredClone(api.formattingItems);
  items[0].question.options[1] = '<p><b>B.</b> $2pq$</p>';
  const documentXml = await xml(api.createMixReadyExamDocument(api.createDefaultBlueprint(12), items));
  const underlined = [...documentXml.matchAll(/<w:r>(?:(?!<\/w:r>)[\s\S])*?<\/w:r>/g)].filter(([run]) => run.includes('<w:u '));
  assert.deepEqual(underlined.map(([run]) => [...run.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)].map(m => m[1]).join('')), ['B', 'a', 'c']);
  assert.match(documentXml, />A\.<\/w:t>/); assert.match(documentXml, /2,5/);
});
