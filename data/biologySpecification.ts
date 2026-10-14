import type { BiologyLearningOutcome } from '../types/examBlueprint';
import { BIOLOGY_OUTCOMES as LEGACY_OUTCOMES } from './biologySpecification/legacyOutcomes';
import { BIOLOGY_SPECIFICATION_RECORDS, getSpecificationContentLabel, isUsableSpecificationRecord } from './biologySpecification/catalog';
import { getCompetencyDescription, getCompetencyGroupLabel, resolveCompetencyCode } from './biologySpecification/competencies';
import { getCompetencySpecification } from './biologySpecification/competencyMappings';
import { getCurriculumAlignment } from './biologySpecification/curriculumAlignment';
export { CURRICULUM_OUTCOME_ALIGNMENTS, getCurriculumAlignment } from './biologySpecification/curriculumAlignment';
export { BIOLOGY_COMPETENCY_DESCRIPTORS, resolveCompetencyCode, getCompetencyDescription, getManualCompetencyTranslations } from './biologySpecification/competencies';
export { getCompetencySpecification } from './biologySpecification/competencyMappings';

export const getCompetencyLabel = (code: string | null) => {
  if (!code) return 'Nguồn không ghi mã năng lực';
  return `${getCompetencyGroupLabel(code)}: ${getCompetencyDescription(code)}`;
};
export const BIOLOGY_OUTCOMES: BiologyLearningOutcome[] = BIOLOGY_SPECIFICATION_RECORDS
  .filter(isUsableSpecificationRecord)
  .map(record => ({
    id: record.id, grade: record.grade, contentId: record.contentId,
    contentLabel: getSpecificationContentLabel(record), competencyCode: record.competencyCode ?? '',
    competencyLabel: getCompetencyLabel(record.competencyCode), level: record.level,
    competencySpecification: getCompetencySpecification(record.id, record.competencyCode),
    text: record.text, sourcePage: record.sourcePage, sourcePages: record.sourcePages,
    sourceId: record.sourceId, scope: record.scope,
    sourceCodeMissing: record.sourceCodeMissing, sourceLevelMissing: record.sourceLevelMissing,
    sourceNote: record.sourceNote,
    curriculumAlignment: getCurriculumAlignment(record.id),
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
export const getCompetenciesForContent = (grade: 10 | 11 | 12, contentId: string) => {
  const codes = new Set<string>();
  for (const outcome of getOutcomesForGrade(grade).filter(item => item.contentId === contentId)) {
    const resolution = resolveCompetencyCode(outcome.competencyCode);
    for (const descriptor of resolution.descriptors) codes.add(descriptor.code);
    // Missing and ambiguous source notations remain available as explicit gaps.
    if (!outcome.competencyCode || resolution.status === 'partial') codes.add(outcome.competencyCode);
  }
  return [...codes].sort((a, b) => !a ? 1 : !b ? -1 : a.localeCompare(b, 'en', { numeric: true }))
    .map(code => ({ code, label: getCompetencyLabel(code) }));
};
export const getOutcomesForSelection = (grade: 10 | 11 | 12, contentId: string, competencyCode: string) =>
  getOutcomesForGrade(grade).filter(item => item.contentId === contentId && (
    item.competencyCode === competencyCode ||
    (Boolean(competencyCode) && resolveCompetencyCode(item.competencyCode).descriptors.some(descriptor => descriptor.code === competencyCode))
  ));
const outcomesById = new Map([...LEGACY_OUTCOMES, ...BIOLOGY_OUTCOMES].map(outcome => [outcome.id, outcome]));
export const getOutcomeById = (outcomeId: string) => outcomesById.get(outcomeId);
export const BIOLOGY_10_CONTENTS = getContentsForGrade(10);
