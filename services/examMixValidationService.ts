import type { GeneratedExamItem } from '../types/generatedExam';
import {
  normalizeMixerShortAnswer,
  parseMcqCorrectLetter,
  parseTrueFalseAnswerMap,
} from './examMixerFormatService';

export interface MixValidationIssue {
  slotId: string;
  part: 'mcq' | 'tf' | 'short';
  order: number;
  message: string;
}

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

      if (!parseMcqCorrectLetter(item.question.answer)) {
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

      const answers = parseTrueFalseAnswerMap(item.question.answer);
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
      const answer = normalizeMixerShortAnswer(item.question.answer);

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
