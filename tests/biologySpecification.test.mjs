import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

mkdirSync('tmp/tests', { recursive: true });
const target = resolve('tmp/tests/subject.mjs');
await build({ stdin: { contents: `
export * from './data/biologySpecification';
export * from './data/biologySpecification/catalog';
export * from './data/examBlueprintPresets';
export * from './services/examBlueprintService';
export * from './services/examMockService';
export * from './services/examMixValidationService';
export * from './services/examDraftService';
export * from './services/examMixerFormatService';
`, resolveDir: process.cwd(), loader: 'ts' }, outfile: target, bundle: true, platform: 'node', format: 'esm' });
const api = await import(pathToFileURL(target).href);
const doc = JSON.parse(readFileSync('data/biologySpecification/catalog.json', 'utf8'));

test('lossless source coverage, complete grade catalogs and reproducible import', () => {
  assert.deepEqual(doc.sourcePages.map(page => page.page), Array.from({ length: 33 }, (_, i) => i + 1));
  assert.equal(new Set(doc.records.map(record => record.id)).size, 479);
  assert.equal(doc.source.allocations, null);
  assert.equal(doc.source.scores, null);
  assert.deepEqual([10, 11, 12].map(grade => api.getSpecificationRecordsForGrade(grade).length), [122, 212, 217]);
  assert.deepEqual([10, 11, 12].map(grade => api.getOutcomesForGrade(grade).length), [121, 197, 193]);
  for (const row of doc.records) {
    assert.ok(row.text.length > 0);
    assert.ok(row.sourcePages.every(page => page >= 1 && page <= 33));
    assert.ok(['know', 'understand', 'apply', null].includes(row.level));
  }
  execFileSync(process.execPath, ['scripts/ingest-biology-specification.mjs', '--check']);
});

test('curriculum supplementation preserves source identity and fills all identified core gaps', () => {
  const supplement = JSON.parse(readFileSync('data/biologySpecification/curriculum.json', 'utf8'));
  assert.equal(supplement.source.pageCount, 65);
  assert.equal(supplement.records.length, 72);
  assert.equal(supplement.records.filter(row => row.scope === 'core').length, 22);
  assert.equal(supplement.records.filter(row => row.scope === 'elective').length, 50);
  assert.deepEqual([10, 11, 12].map(grade => api.getOutcomesForGrade(grade).filter(row => row.scope === 'core').length), [104, 182, 175]);
  for (const row of supplement.records) {
    assert.equal(row.sourceId, 'curriculum');
    assert.equal(row.competencyCode, null);
    assert.equal(row.level, null);
    assert.ok(row.sourceCodeMissing && row.sourceLevelMissing);
    assert.deepEqual(row.questionReferences, { mcq: '', tf: '', short: '' });
    assert.ok(row.sourcePages.every(page => page >= 21 && page <= 56));
    assert.equal(api.getOutcomeById(row.id).sourceId, 'curriculum');
  }
  for (const original of doc.records) {
    const row = api.getSpecificationRecordById(original.id);
    for (const key of ['text', 'level', 'competencyCode', 'sourcePage']) assert.deepEqual(row[key], original[key]);
    assert.equal(row.sourceId, 'specification');
  }
  const shannon = api.getSpecificationRecordById('curr-g12-community-shannon');
  assert.ok(shannon.text.endsWith('theo chỉ số Shannon.'));
  assert.deepEqual(shannon.relatedSourceRecordIds, ['spec-g12-p30-r15']);
  assert.ok(api.getSpecificationRecordById('spec-g12-p30-r15').sourceIncomplete);
  assert.ok(api.getSpecificationRecordById('curr-g12-succession-causes').relatedSourceRecordIds.includes('spec-g12-p32-r01'));
  const hardy = api.getOutcomeById('curr-g12-hardy-weinberg');
  assert.equal(hardy.sourcePage, 47);
  assert.equal(api.getSpecificationSourceUrl(hardy.sourcePage, hardy.sourceId), '/specification/biology-curriculum-2018.pdf#page=47');
  assert.equal(api.getSpecificationSourceUrl(22), '/specification/biology-thpt.pdf#page=22');
  const ecosystem = api.BIOLOGY_SPECIFICATION_TOPICS.find(topic => topic.contentId === 'ecosystems_biosphere');
  assert.equal(ecosystem.sourceLabelInferred, false);
  assert.ok(ecosystem.outline.includes('Chuỗi thức ăn'));
});

test('all nine elective modules have complete, isolated presets and never enter core presets', () => {
  const expected = { elective_10_1: 7, elective_10_2: 6, elective_10_3: 4, elective_11_1: 6, elective_11_2: 4, elective_11_3: 5, elective_12_1: 9, elective_12_2: 5, elective_12_3: 4 };
  for (const [contentId, count] of Object.entries(expected)) {
    const grade = Number(contentId.split('_')[1]);
    const blueprint = api.createBlueprintFromPreset(`g${grade}-${contentId}`);
    assert.equal(blueprint.rows.length, count);
    assert.ok(blueprint.rows.every(row => row.contentId === contentId && api.getOutcomeById(row.outcomeId).scope === 'elective'));
  }
  for (const grade of [10, 11, 12]) {
    const core = api.createBlueprintFromPreset(`g${grade}-all`);
    assert.ok(core.rows.every(row => api.getOutcomeById(row.outcomeId).scope === 'core'));
  }
});

test('source blanks, combined codes, duplicates, truncated text and addresses remain explicit', () => {
  assert.ok(doc.records.some(record => record.competencyCode === 'NT2/NT6' && record.level === 'understand'));
  assert.ok(doc.records.some(record => record.competencyCode === 'VD1' && record.level === 'understand'));
  const absentCode = doc.records.find(record => record.sourceCodeMissing && !record.sourceIncomplete);
  assert.equal(absentCode.competencyCode, null);
  assert.equal(api.getOutcomeById(absentCode.id).competencyCode, '');
  const absentLevel = doc.records.find(record => record.sourceLevelMissing && !record.sourceIncomplete && !record.sourceDuplicate);
  assert.equal(api.getOutcomeById(absentLevel.id).level, null);
  for (const row of doc.records.filter(record => record.sourceDuplicate || record.sourceIncomplete || record.sourceEmpty)) {
    assert.equal(api.BIOLOGY_OUTCOMES.some(outcome => outcome.id === row.id), false);
  }
  assert.ok(doc.records.filter(record => record.sourcePage === 31).every(record => record.grade === 11 && record.sourceDuplicate));
  const dna = doc.records.find(record => record.text.startsWith('Nêu được khái niệm, nguyên lí và một số thành tựu của công nghệ DNA'));
  assert.deepEqual(dna.questionReferences, { mcq: 'Câu 13', tf: '', short: 'Câu 5' });
  const skills = doc.records.find(record => record.grade === 10 && record.questionReferences.tf === '3a,b');
  assert.ok(skills);
  assert.ok(doc.records.some(record => record.sourceIncomplete && record.questionReferences.short === 'Câu 6'));
});

test('every preset has valid grade references, fresh zero allocations and preserves teacher scores', () => {
  for (const preset of api.EXAM_BLUEPRINT_PRESETS) {
    const current = api.createDefaultBlueprint();
    current.durationMinutes = 45;
    current.scores.mcq.questionCount = 20;
    const blueprint = api.createBlueprintFromPreset(preset.id, current);
    assert.equal(blueprint.grade, preset.grade);
    assert.equal(blueprint.durationMinutes, 45);
    assert.equal(blueprint.scores.mcq.questionCount, 20);
    assert.ok(blueprint.rows.length);
    for (const row of blueprint.rows) {
      const outcome = api.getOutcomeById(row.outcomeId);
      assert.equal(outcome.grade, preset.grade);
      assert.equal(outcome.contentId, row.contentId);
      assert.equal(outcome.competencyCode, row.competencyCode);
      assert.ok(Object.values(row.allocations).every(part => Object.values(part).every(value => value === 0)));
    }
    blueprint.rows[0].allocations.mcq.know = 1;
    blueprint.scores.mcq.questionCount = 1;
    assert.equal(api.createBlueprintFromPreset(preset.id).rows[0].allocations.mcq.know, 0);
    assert.equal(current.scores.mcq.questionCount, 20);
    assert.equal(api.validateExamSlots(blueprint, api.buildExamSlots(blueprint)).valid, false);
  }
});

const makeBlueprint = (grade, scope = 'core') => {
  const blueprint = api.createDefaultBlueprint(grade);
  const groups = api.getContentsForGrade(grade).map(content => api.getOutcomesForGrade(grade).filter(outcome => outcome.contentId === content.id && outcome.scope === scope)).filter(group => group.length >= 3);
  blueprint.rows = groups.slice(0, 2).flatMap((group, groupIndex) => group.slice(0, 3).map((outcome, i) => ({
    id: `fixture-${groupIndex}-${i}`, contentId: outcome.contentId, competencyCode: outcome.competencyCode, outcomeId: outcome.id,
    allocations: {
      mcq: { know: groupIndex === 0 && i === 0 ? 4 : 0, understand: groupIndex === 0 && i === 1 ? 4 : 0, apply: groupIndex === 0 && i === 2 ? 4 : 0 },
      tf: { know: i === 0 ? 1 : 0, understand: i === 1 ? 2 : 0, apply: i === 2 ? 1 : 0 },
      short: { know: 0, understand: 0, apply: groupIndex === 1 && i === 0 ? 4 : 0 },
    },
  })));
  return blueprint;
};
for (const grade of [10, 11, 12]) {
  for (const scope of ['core', 'elective']) {
  test(`grade ${grade}, ${scope}: matrix → 18 question slots → mock generation → format validation → draft recovery`, () => {
    const blueprint = makeBlueprint(grade, scope);
    const slots = api.buildExamSlots(blueprint);
    assert.equal(api.validateExamSlots(blueprint, slots).valid, true);
    assert.deepEqual([slots.mcq.length, slots.tf.length, slots.short.length], [12, 2, 4]);
    assert.ok(slots.tf.every(slot => slot.statements.length === 4));
    for (const slot of [...slots.mcq, ...slots.short, ...slots.tf.flatMap(question => question.statements)]) {
      assert.equal(slot.outcomeText, api.getOutcomeById(slot.outcomeId).text);
      assert.equal(api.getOutcomeById(slot.outcomeId).grade, grade);
    }
    const items = api.generateMockExamFromSlots(slots);
    assert.equal(items.length, 18);
    assert.equal(api.validateMixReadyExam(items).valid, true);
    const memory = new Map();
    globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
    api.saveExamReviewDraft(blueprint, items, [items[0].slotId], [items[0].slotId], 'mock');
    const recovered = api.loadExamReviewDraft(blueprint);
    assert.deepEqual(recovered.generatedItems, items);
    assert.deepEqual(recovered.approvedSlotIds, [items[0].slotId]);
    assert.deepEqual(recovered.lockedQuestionIds, [items[0].slotId]);
    assert.equal(api.loadExamReviewDraft({ ...blueprint, title: 'Different blueprint' }), null);
    const broken = structuredClone(blueprint);
    broken.rows[0].allocations.tf.know += 1;
    assert.equal(api.validateExamSlots(broken, api.buildExamSlots(broken)).valid, false);
  });
  }
}

test('v1 draft outcome ids remain resolvable but are not added to new source menus', () => {
  assert.equal(api.getOutcomeById('g10-cell-structure-nt1').grade, 10);
  assert.equal(api.getOutcomeById('g11-careers-nt1').grade, 11);
  assert.equal(api.BIOLOGY_OUTCOMES.some(outcome => outcome.id === 'g10-cell-structure-nt1'), false);
});

test('mixer answer rules retain correct letters, true statements and four-character numeric answers', () => {
  assert.equal(api.parseMcqCorrectLetter('B. phương án đúng'), 'B');
  assert.deepEqual([...api.getTrueStatementLetters('a) Đúng; b) Sai; c) Đúng; d) Sai')], ['a', 'c']);
  assert.equal(api.normalizeMixerShortAnswer('A. 1.25'), '1,25');
  assert.equal(api.isValidMixerShortAnswer('1,25'), true);
  assert.equal(api.isValidMixerShortAnswer('12,25'), false);
});
