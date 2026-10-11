import { emptyBlueprintAllocations, type ExamBlueprint } from '../types/examBlueprint';
import { getOutcomesForGrade } from './biologySpecification';
import { getSpecificationRecordsForGrade } from './biologySpecification/catalog';

// Application defaults, not a scoring matrix inferred from source question addresses.
export const createDefaultBlueprint = (grade: 10 | 11 | 12 = 10): ExamBlueprint => ({
  grade, title: 'Đề kiểm tra Sinh học', durationMinutes: 50,
  scores: {
    mcq: { questionCount: 12, totalScore: 6 },
    tf: { questionCount: 2, totalScore: 2, scoreLevels: { correct1: 10, correct2: 25, correct3: 50, correct4: 100 } },
    short: { questionCount: 4, totalScore: 2 },
  }, rows: [],
});
export interface ExamBlueprintPreset {
  id: string;
  grade: 10 | 11 | 12;
  title: string;
  contentIds: string[];
  allocationMode: 'manual';
}
export const EXAM_BLUEPRINT_PRESETS: ExamBlueprintPreset[] = ([10, 11, 12] as const).flatMap(grade => {
  const records = getSpecificationRecordsForGrade(grade);
  const allContents = Array.from(new Set(records.map(record => record.contentId)));
  const strands = Array.from(new Set(records.map(record => record.strand)));
  return [
    { id: `g${grade}-all`, grade, title: `Sinh ${grade} · Toàn bộ YCCĐ`, contentIds: allContents, allocationMode: 'manual' as const },
    ...strands.map((strand, index) => ({
      id: `g${grade}-strand-${index + 1}`, grade, title: `Sinh ${grade} · ${strand}`,
      contentIds: Array.from(new Set(records.filter(record => record.strand === strand).map(record => record.contentId))),
      allocationMode: 'manual' as const,
    })),
  ];
});
export const getBlueprintPresetsForGrade = (grade: 10 | 11 | 12) =>
  EXAM_BLUEPRINT_PRESETS.filter(preset => preset.grade === grade);
export const createBlueprintFromPreset = (presetId: string, current?: ExamBlueprint): ExamBlueprint => {
  const preset = EXAM_BLUEPRINT_PRESETS.find(item => item.id === presetId);
  if (!preset) throw new Error(`Unknown blueprint preset: ${presetId}`);
  const blueprint = createDefaultBlueprint(preset.grade);
  return {
    ...blueprint, title: preset.title,
    ...(current ? { scores: structuredClone(current.scores), durationMinutes: current.durationMinutes } : {}),
    rows: getOutcomesForGrade(preset.grade).filter(outcome => preset.contentIds.includes(outcome.contentId))
      .map(outcome => ({ id: `row-${preset.id}-${outcome.id}`, contentId: outcome.contentId,
        competencyCode: outcome.competencyCode, outcomeId: outcome.id, allocations: emptyBlueprintAllocations() })),
  };
};
