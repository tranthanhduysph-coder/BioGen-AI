import document from './curriculumAlignment.json';
import type { CurriculumOutcomeAlignment } from '../../types/examBlueprint';

export const CURRICULUM_OUTCOME_ALIGNMENTS = document.records as CurriculumOutcomeAlignment[];
const byOutcomeId = new Map(CURRICULUM_OUTCOME_ALIGNMENTS.map(row => [row.outcomeId, row]));
export const getCurriculumAlignment = (outcomeId: string) => byOutcomeId.get(outcomeId);
