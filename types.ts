export interface Criteria {
  chapter: string;
  difficulty: string;
  competency: string;
  setting: string;
  questionType: string;
  questionCount: number;
  customPrompt: string;
}

// Cấu hình cho từng phần của đề thi 2025
export interface ExamPartConfig {
    id: 'p1' | 'p2' | 'p3';
    name: string;
    type: string; // 'Multiple Choice', 'True/False', 'Short Response'
    questionCount: number;
    selectedChapters: string[]; // Danh sách chủ đề được chọn cho phần này
}

export enum QuestionType {
  MultipleChoice = 'Multiple choices',
  TrueFalse = 'True/ False',
  ShortResponse = 'Short response',
  FreeAnswer = 'Free answer',
}

export interface GeneratedQuestion {
  question: string;
  type: QuestionType;
  options: string[];
  answer: string;
  explanation: string;
  criteria?: Criteria; 
}

export interface ExamResult {
  id?: string;
  userId: string;
  timestamp: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  chapterSummary: string;
  questionsData?: GeneratedQuestion[];
  userAnswers?: Record<number, any>;
}
