export type CognitiveLevel = 'know' | 'understand' | 'apply';
export type ExamPartKey = 'mcq' | 'tf' | 'short';

export interface ExamPartScoreConfig {
  questionCount: number;
  totalScore: number;
}

export interface TrueFalseScoreConfig extends ExamPartScoreConfig {
  scoreLevels: {
    correct1: number;
    correct2: number;
    correct3: number;
    correct4: number;
  };
}

export interface ExamScoreConfig {
  mcq: ExamPartScoreConfig;
  tf: TrueFalseScoreConfig;
  short: ExamPartScoreConfig;
}

export interface AllocationByLevel {
  know: number;
  understand: number;
  apply: number;
}

export interface BlueprintAllocations {
  mcq: AllocationByLevel;
  tf: AllocationByLevel;
  short: AllocationByLevel;
}

export interface BlueprintRow {
  id: string;
  contentId: string;
  competencyCode: string;
  outcomeId: string;
  allocations: BlueprintAllocations;
}

export interface BiologyLearningOutcome {
  id: string;
  grade: 10 | 11 | 12;
  contentId: string;
  contentLabel: string;
  competencyCode: string;
  competencyLabel: string;
  level: CognitiveLevel;
  text: string;
}

export interface ExamBlueprint {
  grade: 10 | 11 | 12;
  title: string;
  durationMinutes: number;
  scores: ExamScoreConfig;
  rows: BlueprintRow[];
}

export const emptyAllocation = (): AllocationByLevel => ({
  know: 0,
  understand: 0,
  apply: 0,
});

export const emptyBlueprintAllocations = (): BlueprintAllocations => ({
  mcq: emptyAllocation(),
  tf: emptyAllocation(),
  short: emptyAllocation(),
});
