export interface Criteria {
  chapter: string;
  difficulty: string;
  competency: string;
  setting: string;
  questionType: string; // Added question type
  questionCount: number;
  customPrompt: string;
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
  // Optional metadata for the Matrix table in DOCX
  criteria?: Criteria; 
}

// New Interface for Exam Blueprint
export interface ExamPartBlueprint {
    partName: string;
    questionType: string;
    count: number;
    difficultiesDistribution: string[]; // e.g., ['Nhận biết', 'Thông hiểu']
}

// Interface for storing exam history
export interface ExamResult {
  id?: string;
  userId: string;
  timestamp: number; // Unix timestamp
  score: number; // Normalized score / 10
  totalQuestions: number;
  correctCount: number;
  chapterSummary: string; // e.g. "Di truyền học..." or "Tổng hợp"
  
  // NEW FIELDS FOR REVIEW
  questionsData?: GeneratedQuestion[]; // Store the full questions array
  userAnswers?: Record<number, any>;   // Store user's answers
}
