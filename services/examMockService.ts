import { QuestionType, type GeneratedQuestion } from '../types';
import type { CognitiveLevel } from '../types/examBlueprint';
import type { GeneratedExamItem } from '../types/generatedExam';
import type {
  ExamQuestionSlot,
  ExamSlotPackage,
  TrueFalseQuestionSlot,
} from '../types/examSlots';

const levelLabel: Record<CognitiveLevel, string> = {
  know: 'Biết',
  understand: 'Hiểu',
  apply: 'Vận dụng',
};

const mockSimpleQuestion = (slot: ExamQuestionSlot): GeneratedExamItem => {
  if (slot.part === 'mcq') {
    const question: GeneratedQuestion = {
      question: `[DEMO] ${slot.contentLabel}: ${slot.outcomeText}`,
      type: QuestionType.MultipleChoice,
      options: [
        'A. Phương án mẫu đúng',
        'B. Phương án mẫu nhiễu 1',
        'C. Phương án mẫu nhiễu 2',
        'D. Phương án mẫu nhiễu 3',
      ],
      answer: 'A. Phương án mẫu đúng',
      explanation: `Dữ liệu mẫu để kiểm thử workflow. Slot yêu cầu mức ${levelLabel[slot.level]}.`,
    };

    return { slotId: slot.id, part: slot.part, order: slot.order, question };
  }

  const question: GeneratedQuestion = {
    question: `[DEMO] Bài toán trả lời ngắn thuộc nội dung ${slot.contentLabel}. ${slot.outcomeText}`,
    type: QuestionType.ShortResponse,
    options: [],
    answer: '1',
    explanation: `Dữ liệu mẫu để kiểm thử workflow. Slot yêu cầu mức ${levelLabel[slot.level]}.`,
  };

  return { slotId: slot.id, part: slot.part, order: slot.order, question };
};

const mockTrueFalseQuestion = (slot: TrueFalseQuestionSlot): GeneratedExamItem => {
  const options = slot.statements.map((statement) => {
    const letter = String.fromCharCode(96 + statement.statementOrder);
    return `${letter}) [DEMO · ${levelLabel[statement.level]}] ${statement.outcomeText}`;
  });

  const question: GeneratedQuestion = {
    question: `[DEMO] Câu Đúng/Sai kiểm thử về ${slot.statements[0]?.contentLabel || 'Sinh học'}.`,
    type: QuestionType.TrueFalse,
    options,
    answer: 'a) Đúng; b) Sai; c) Đúng; d) Sai',
    explanation: 'Dữ liệu mẫu để kiểm thử workflow; không sử dụng như câu hỏi học thuật thật.',
  };

  return { slotId: slot.id, part: 'tf', order: slot.order, question };
};

export const generateMockExamFromSlots = (slots: ExamSlotPackage): GeneratedExamItem[] => [
  ...slots.mcq.map(mockSimpleQuestion),
  ...slots.tf.map(mockTrueFalseQuestion),
  ...slots.short.map(mockSimpleQuestion),
];
