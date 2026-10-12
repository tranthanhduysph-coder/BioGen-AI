import { resolveCompetencyCode, type CompetencyResolution } from './competencies';

export interface BiologyCompetencySpecification extends CompetencyResolution {
  origin: 'source' | 'missing';
  proposedCodes: string[];
  rationale?: string;
}

export const getCompetencySpecification = (_outcomeId: string, sourceCode: string | null): BiologyCompetencySpecification => {
  const source = resolveCompetencyCode(sourceCode);
  return { ...source, origin: source.status === 'missing' ? 'missing' : 'source', proposedCodes: [] };
};
