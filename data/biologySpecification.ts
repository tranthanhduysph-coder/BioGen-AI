import type { BiologyLearningOutcome } from '../types/examBlueprint';
import { BIOLOGY_OUTCOMES as LEGACY_OUTCOMES } from './biologySpecification/legacyOutcomes';
import { BIOLOGY_SPECIFICATION_RECORDS, getSpecificationContentLabel, isUsableSpecificationRecord } from './biologySpecification/catalog';

export const getCompetencyLabel = (code: string | null) => {
  if (!code) return 'Nguồn không ghi mã năng lực';
  if (code.startsWith('NT')) return 'Nhận thức sinh học';
  if (code.startsWith('TH')) return 'Tìm hiểu thế giới sống';
  if (/^VD\d/.test(code)) return 'Vận dụng kiến thức, kĩ năng';
  return 'Mã theo bản đặc tả';
};
export const BIOLOGY_OUTCOMES: BiologyLearningOutcome[] = BIOLOGY_SPECIFICATION_RECORDS
  .filter(isUsableSpecificationRecord)
  .map(record => ({
    id: record.id, grade: record.grade, contentId: record.contentId,
    contentLabel: getSpecificationContentLabel(record), competencyCode: record.competencyCode ?? '',
    competencyLabel: getCompetencyLabel(record.competencyCode), level: record.level,
    text: record.text, sourcePage: record.sourcePage, sourcePages: record.sourcePages,
    sourceId: record.sourceId, scope: record.scope,
    sourceCodeMissing: record.sourceCodeMissing, sourceLevelMissing: record.sourceLevelMissing,
    sourceNote: record.sourceNote,
  }));
export const getOutcomesForGrade = (grade: 10 | 11 | 12) =>
  BIOLOGY_OUTCOMES.filter(outcome => outcome.grade === grade);
export const BIOLOGY_10_OUTCOMES = getOutcomesForGrade(10);
export const BIOLOGY_11_OUTCOMES = getOutcomesForGrade(11);
export const BIOLOGY_12_OUTCOMES = getOutcomesForGrade(12);
export const getContentsForGrade = (grade: 10 | 11 | 12) =>
  Array.from(new Map(getOutcomesForGrade(grade).map(outcome => [
    outcome.contentId, { id: outcome.contentId, label: outcome.contentLabel },
  ])).values());
export const getCompetenciesForContent = (grade: 10 | 11 | 12, contentId: string) =>
  Array.from(new Map(getOutcomesForGrade(grade).filter(item => item.contentId === contentId)
    .map(item => [item.competencyCode, { code: item.competencyCode, label: item.competencyLabel }])).values());
export const getOutcomesForSelection = (grade: 10 | 11 | 12, contentId: string, competencyCode: string) =>
  getOutcomesForGrade(grade).filter(item => item.contentId === contentId && item.competencyCode === competencyCode);
const outcomesById = new Map([...LEGACY_OUTCOMES, ...BIOLOGY_OUTCOMES].map(outcome => [outcome.id, outcome]));
export const getOutcomeById = (outcomeId: string) => outcomesById.get(outcomeId);
export const BIOLOGY_10_CONTENTS = getContentsForGrade(10);
