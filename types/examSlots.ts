import type { CognitiveLevel, ExamPartKey } from './examBlueprint';

export interface ExamQuestionSlot {
  id: string;
  part: ExamPartKey;
  order: number;
  maxScore: number;
  contentId: string;
  contentLabel: string;
  competencyCode: string;
  outcomeId: string;
  outcomeText: string;
  level: CognitiveLevel;
}

export interface TrueFalseStatementSlot {
  id: string;
  statementOrder: 1 | 2 | 3 | 4;
  contentId: string;
  contentLabel: string;
  competencyCode: string;
  outcomeId: string;
  outcomeText: string;
  level: CognitiveLevel;
}

export interface TrueFalseQuestionSlot {
  id: string;
  part: 'tf';
  order: number;
  maxScore: number;
  statements: TrueFalseStatementSlot[];
  scoring: {
    correct1: number;
    correct2: number;
    correct3: number;
    correct4: number;
  };
}

export interface ExamSlotPackage {
  mcq: ExamQuestionSlot[];
  tf: TrueFalseQuestionSlot[];
  short: ExamQuestionSlot[];
}
