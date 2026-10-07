import type { GeneratedExamItem } from '../types/generatedExam';

export interface MixValidationIssue {
  slotId: string;
  part: 'mcq' | 'tf' | 'short';
  order: number;
  message: string;
}

const parseMcqLetter = (answer: string) => {
  const match = answer.trim().match(/^([A-D])/i);
  return match ? match[1].toUpperCase() : null;
};

const parseTfAnswers = (answer: string) => {
  const values = new Map<string, boolean>();
  answer
    .split(/[;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const match = part.match(/^([a-d])\s*[\)\.:\-]?\s*(Đúng|Dung|Sai|True|False|T|F)\b/i);
      if (!match) return;
      const letter = match[1].toLowerCase();
      const token = match[2].toLowerCase();
      const isTrue = ['đúng', 'dung', 'true', 't'].includes(token);
      values.set(letter, isTrue);
    });
  return values;
};

const normalizeShortAnswer = (answer: string) =>
  answer.replace(/^\s*A\.\s*/i, '').trim().replace('.', ',');

export const validateMixReadyExam = (items: GeneratedExamItem[]) => {
  const issues: MixValidationIssue[] = [];

  items.forEach((item) => {
    if (item.part === 'mcq') {
      if (item.question.options.length !== 4) {
        issues.push({
          slotId: item.slotId,
          part: item.part,
          order: item.order,
          message: 'MCQ phải có đúng 4 phương án A–D.',
        });
      }

      if (!parseMcqLetter(item.question.answer)) {
        issues.push({
          slotId: item.slotId,
          part: item.part,
          order: item.order,
          message: 'Không nhận diện được đáp án đúng A/B/C/D.',
        });
      }
    }

    if (item.part === 'tf') {
      if (item.question.options.length !== 4) {
        issues.push({
          slotId: item.slotId,
          part: item.part,
          order: item.order,
          message: 'Câu Đúng/Sai phải có đúng 4 ý a–d.',
        });
      }

      const answers = parseTfAnswers(item.question.answer);
      const missing = ['a', 'b', 'c', 'd'].filter((letter) => !answers.has(letter));
      if (missing.length > 0) {
        issues.push({
          slotId: item.slotId,
          part: item.part,
          order: item.order,
          message: `Thiếu đáp án Đúng/Sai cho ý: ${missing.join(', ')}.`,
        });
      }
    }

    if (item.part === 'short') {
      const answer = normalizeShortAnswer(item.question.answer);

      if (!/^-?\d+(?:,\d+)?$/.test(answer)) {
        issues.push({
          slotId: item.slotId,
          part: item.part,
          order: item.order,
          message: 'Đáp án trả lời ngắn phải là một giá trị số.',
        });
      } else if (answer.length > 4) {
        issues.push({
          slotId: item.slotId,
          part: item.part,
          order: item.order,
          message: `Đáp án "${answer}" vượt quá 4 ký tự.`,
        });
      }
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
};
