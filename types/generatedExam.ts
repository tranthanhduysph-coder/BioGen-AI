import type { GeneratedQuestion } from '../types';
import type { ExamPartKey } from './examBlueprint';

export interface GeneratedExamItem {
  slotId: string;
  part: ExamPartKey;
  order: number;
  question: GeneratedQuestion;
}

export interface GenerationProgress {
  completed: number;
  total: number;
}
