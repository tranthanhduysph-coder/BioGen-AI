import proposals from './competencyProposals.json';
import { resolveCompetencyCode, type CompetencyResolution } from './competencies';

export interface BiologyCompetencySpecification extends CompetencyResolution {
  origin: 'source' | 'proposal' | 'missing';
  proposedCodes: string[];
  rationale?: string;
}

const proposalsById = new Map(proposals.records.map(record => [record.outcomeId, record]));
export const getCompetencySpecification = (outcomeId: string, sourceCode: string | null): BiologyCompetencySpecification => {
  const source = resolveCompetencyCode(sourceCode);
  if (source.status !== 'missing') return { ...source, origin: 'source', proposedCodes: [] };
  const proposal = proposalsById.get(outcomeId);
  if (!proposal) return { ...source, origin: 'missing', proposedCodes: [] };
  const mapped = resolveCompetencyCode(proposal.codes.join('/'));
  return { ...mapped, sourceCode: source.sourceCode, origin: 'proposal', proposedCodes: [...proposal.codes], rationale: proposal.rationale };
};
