import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

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
export * from './services/geminiService';
export { vi } from './locales/vi';
export { en } from './locales/en';
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

test('all 15 competency descriptors link to curriculum pages and resolve exact and combined source codes', () => {
  assert.equal(api.BIOLOGY_COMPETENCY_DESCRIPTORS.length, 15);
  assert.equal(new Set(api.BIOLOGY_COMPETENCY_DESCRIPTORS.map(item => item.code)).size, 15);
  for (const descriptor of api.BIOLOGY_COMPETENCY_DESCRIPTORS) {
    assert.ok(descriptor.description.length > 40);
    assert.ok(descriptor.sourcePages.every(page => page >= 5 && page <= 7));
    assert.deepEqual(api.resolveCompetencyCode(descriptor.code).descriptors.map(item => item.code), [descriptor.code]);
  }
  for (const [code, expected] of Object.entries({
    'NT2/NT6': ['NT2', 'NT6'], 'NT4/NT6': ['NT4', 'NT6'],
    'TH1-TH5': ['TH1', 'TH2', 'TH3', 'TH4', 'TH5'], 'TH2-5': ['TH2', 'TH3', 'TH4', 'TH5'],
    'NT2-NT4': ['NT2', 'NT4'], 'NT5-NT6': ['NT5', 'NT6'],
  })) {
    const resolved = api.resolveCompetencyCode(code);
    assert.equal(resolved.status, 'mapped');
    assert.equal(resolved.sourceCode, code);
    assert.deepEqual(resolved.descriptors.map(item => item.code), expected);
  }
  assert.deepEqual(api.resolveCompetencyCode('VD/NT5').groups, ['VD', 'NT']);
  assert.ok(api.getCompetencyLabel('VD/NT5').includes('Nhận thức sinh học'));
  assert.ok(api.getCompetencyLabel('VD/NT5').includes('Vận dụng'));
});

test('ambiguous suffixes and unknown or reversed ranges never become invented competency codes', () => {
  for (const code of ['NT5-H', 'VD/NT5', 'NT9', 'TH5-TH1', 'NT1-TH5', 'NT1-NT99']) {
    const resolved = api.resolveCompetencyCode(code);
    assert.equal(resolved.status, 'partial');
    assert.ok(resolved.unresolvedTokens.length);
    assert.equal(resolved.sourceCode, code);
  }
  assert.deepEqual(api.resolveCompetencyCode('NT5-H').descriptors.map(item => item.code), ['NT5']);
  assert.deepEqual(api.resolveCompetencyCode('VD/NT5').descriptors.map(item => item.code), ['NT5']);
  assert.equal(api.resolveCompetencyCode(null).status, 'missing');
});

test('competency selections and manual prompts retain every full curriculum clause', () => {
  const clauses = {
    NT2: ['công thức, sơ đồ, biểu đồ'], NT7: ['chỉnh sửa được những điểm sai', 'nhận định có tính phê phán'],
    NT8: ['lập được dàn ý', 'các hình thức ngôn ngữ biểu đạt khác nhau'],
    TH1: ['dùng ngôn ngữ của mình'], TH3: ['hồi cứu tư liệu', 'triển khai hoạt động nghiên cứu'],
    TH4: ['tham số thống kê đơn giản', 'so sánh được kết quả với giả thuyết', 'vấn đề nghiên cứu tiếp'],
    TH5: ['lắng nghe tích cực', 'tôn trọng quan điểm', 'bảo vệ kết quả nghiên cứu một cách thuyết phục'],
    VD1: ['phát triển bền vững', 'phản biện được một số mô hình công nghệ'],
    VD2: ['gia đình và cộng đồng', 'thích ứng với biến đổi khí hậu', 'đáp ứng yêu cầu phát triển bền vững'],
  };
  for (const [code, required] of Object.entries(clauses)) for (const clause of required) {
    assert.ok(api.getCompetencyDescription(code).includes(clause), `${code}: ${clause}`);
  }
  for (const descriptor of api.BIOLOGY_COMPETENCY_DESCRIPTORS) {
    const key = descriptor.code.toLowerCase();
    assert.ok(api.vi.translation.constants.competencies[key].includes(descriptor.description));
    assert.ok(api.getCompetencyLabel(descriptor.code).includes(descriptor.description));
    for (const lang of ['vi', 'en']) {
      const prompt = api.generatePrompt({ chapter: 'g10_intro', difficulty: 'diff_2', competency: key,
        setting: 'set_theory', questionType: 'type_mcq', questionCount: 1, customPrompt: '' }, lang);
      assert.ok(prompt.includes(api.getCompetencyDescription(descriptor.code, lang === 'en')));
      assert.ok(prompt.length <= 16000);
    }
  }
  for (const code of ['NT2/NT6', 'TH1-TH5', 'NT2-NT4', 'NT5-H']) {
    for (const descriptor of api.resolveCompetencyCode(code).descriptors) {
      assert.ok(api.getCompetencyDescription(code).includes(descriptor.description));
    }
  }
});

test('all 87 missing competency codes remain source gaps, without proposed bindings', () => {
  const missing = api.BIOLOGY_OUTCOMES.filter(item => !item.competencyCode);
  assert.equal(missing.length, 87);
  for (const outcome of api.BIOLOGY_OUTCOMES) {
    const specification = outcome.competencySpecification;
    if (!outcome.competencyCode) {
      assert.equal(specification.origin, 'missing');
      assert.equal(specification.sourceCode, null);
      assert.deepEqual(specification.descriptors, []);
      assert.deepEqual(specification.proposedCodes, []);
      assert.equal(specification.status, 'missing');
      assert.equal(api.getSpecificationRecordById(outcome.id).competencyCode, null);
    } else {
      assert.ok(specification.descriptors.length > 0, outcome.id);
      assert.equal(specification.origin, 'source');
      assert.equal(specification.sourceCode, outcome.competencyCode);
      assert.deepEqual(specification.proposedCodes, []);
    }
  }
  assert.equal(api.getCompetencySpecification('unrecognised', null).origin, 'missing');
  assert.equal(api.getCompetencySpecification(missing[0].id, 'NT6').origin, 'source');
});

test('Evolution exposes the complete atomic competency → outcome relation, including compound source codes', () => {
  const codes = api.getCompetenciesForContent(12, 'evolution').map(item => item.code);
  assert.deepEqual(codes, ['NT1', 'NT2', 'NT4', 'NT5', 'NT8', 'VD1']);
  assert.deepEqual(codes.map(code => api.getOutcomesForSelection(12, 'evolution', code).length), [6, 8, 1, 2, 1, 1]);
  const tree = api.BIOLOGY_OUTCOMES.find(item => item.grade === 12 && item.text.startsWith('Dựa vào sơ đồ cây sự sống'));
  assert.equal(tree.competencyCode, 'NT2-NT4');
  for (const code of ['NT2', 'NT4']) assert.ok(api.getOutcomesForSelection(12, 'evolution', code).includes(tree));
  assert.deepEqual(api.getOutcomesForSelection(12, 'evolution', 'NT3'), []);
  assert.ok(api.getOutcomesForSelection(12, 'evolution', 'NT2/NT5').some(item => item.text.startsWith('Phân biệt được tiến hoá lớn')));
});

test('all content menus cover every printed binding without crossing grades, topics or empty-code gaps', () => {
  for (const grade of [10, 11, 12]) for (const content of api.getContentsForGrade(grade)) {
    const outcomes = api.getOutcomesForGrade(grade).filter(item => item.contentId === content.id);
    const codes = api.getCompetenciesForContent(grade, content.id).map(item => item.code);
    for (const outcome of outcomes) {
      const resolution = api.resolveCompetencyCode(outcome.competencyCode);
      for (const descriptor of resolution.descriptors) {
        assert.ok(codes.includes(descriptor.code), `${content.id}: ${descriptor.code}`);
        assert.ok(api.getOutcomesForSelection(grade, content.id, descriptor.code).includes(outcome));
      }
      if (!outcome.competencyCode) assert.ok(api.getOutcomesForSelection(grade, content.id, '').includes(outcome));
    }
    for (const code of codes) for (const outcome of api.getOutcomesForSelection(grade, content.id, code)) {
      assert.equal(outcome.grade, grade);
      assert.equal(outcome.contentId, content.id);
      if (code) assert.ok(outcome.competencyCode === code || api.resolveCompetencyCode(outcome.competencyCode).descriptors.some(item => item.code === code));
      else assert.equal(outcome.competencyCode, '');
    }
  }
});

test('every usable outcome is located in the curriculum, with original PDF fingerprints and explicit wording variants', () => {
  const alignment = JSON.parse(readFileSync('data/biologySpecification/curriculumAlignment.json', 'utf8'));
  for (const [file, fingerprint] of [['biology-thpt.pdf', alignment.specificationPdfSha256], ['biology-curriculum-2018.pdf', alignment.curriculumPdfSha256]]) {
    assert.equal(createHash('sha256').update(readFileSync(`public/specification/${file}`)).digest('hex'), fingerprint);
  }
  assert.equal(alignment.records.length, 511);
  assert.equal(new Set(alignment.records.map(item => item.outcomeId)).size, 511);
  assert.equal(alignment.records.filter(item => item.status === 'source_variant').length, 7);
  for (const outcome of api.BIOLOGY_OUTCOMES) {
    const reference = api.getCurriculumAlignment(outcome.id);
    assert.ok(reference);
    assert.deepEqual(outcome.curriculumAlignment, reference);
    assert.ok(reference.pages.every(page => page >= 13 && page <= 56));
    if (outcome.grade === 10) assert.ok(reference.pages.every(page => page <= 24));
    if (outcome.grade === 11) assert.ok(reference.pages.every(page => page >= 24 && page <= 40));
    if (outcome.grade === 12) assert.ok(reference.pages.every(page => page >= 40));
    if (reference.status === 'source_variant') assert.ok(reference.note && reference.curriculumText);
  }
  assert.deepEqual(api.getCurriculumAlignment('spec-g12-p27-r07').pages, [47]);
  assert.deepEqual(api.getCurriculumAlignment('spec-g12-p27-r11').pages, [48]);
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
      assert.equal(slot.competencyCode, api.getOutcomeById(slot.outcomeId).competencyCode);
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
