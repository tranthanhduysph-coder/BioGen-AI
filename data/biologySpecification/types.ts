import type { CognitiveLevel } from '../../types/examBlueprint';

export interface BiologySpecificationRecord {
  id: string;
  grade: 10 | 11 | 12;
  strand: string;
  contentId: string;
  contentLabel: string;
  level: CognitiveLevel;
  competencyCode: string | null;
  text: string;
  sourcePage: number;
  sourceNote?: string;
  sourceIncomplete?: boolean;
  sourceCodeMissing?: boolean;
  sourceDuplicate?: boolean;
}

export type BiologySpecificationTuple = readonly [
  id: string,
  strand: string,
  contentId: string,
  contentLabel: string,
  level: CognitiveLevel,
  competencyCode: string | null,
  text: string,
  sourcePage: number,
  flags?: string,
  sourceNote?: string,
];

export const expandSpecificationRows = (
  grade: 10 | 11 | 12,
  rows: readonly BiologySpecificationTuple[],
): BiologySpecificationRecord[] =>
  rows.map((row) => {
    const [
      id,
      strand,
      contentId,
      contentLabel,
      level,
      competencyCode,
      text,
      sourcePage,
      flags = '',
      sourceNote = '',
    ] = row;

    return {
      id,
      grade,
      strand,
      contentId,
      contentLabel,
      level,
      competencyCode,
      text,
      sourcePage,
      ...(sourceNote ? { sourceNote } : {}),
      ...(flags.includes('i') ? { sourceIncomplete: true } : {}),
      ...(flags.includes('c') ? { sourceCodeMissing: true } : {}),
      ...(flags.includes('d') ? { sourceDuplicate: true } : {}),
    };
  });
