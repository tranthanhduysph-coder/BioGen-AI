import { GoogleGenAI } from '@google/genai';
import { QuestionType, type GeneratedQuestion } from '../types';
import type { CognitiveLevel } from '../types/examBlueprint';
import type { GeneratedExamItem, GenerationProgress } from '../types/generatedExam';
import type {
  ExamQuestionSlot,
  ExamSlotPackage,
  TrueFalseQuestionSlot,
} from '../types/examSlots';

const levelLabel: Record<CognitiveLevel, { vi: string; en: string }> = {
  know: { vi: 'Biết', en: 'Know' },
  understand: { vi: 'Hiểu', en: 'Understand' },
  apply: { vi: 'Vận dụng', en: 'Apply' },
};

const stripJsonFence = (text: string) => text.replace(/\`\`\`json|\`\`\`/g, '').trim();

const parseQuestion = (text: string): GeneratedQuestion => {
  const parsed = JSON.parse(stripJsonFence(text));
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('AI did not return a JSON object.');
  }

  return {
    question: String(parsed.question || '').trim(),
    type: parsed.type as QuestionType,
    options: Array.isArray(parsed.options) ? parsed.options.map((item: unknown) => String(item)) : [],
    answer: String(parsed.answer ?? '').trim(),
    explanation: String(parsed.explanation ?? '').trim(),
  };
};

const normalizeMcqOptions = (options: string[]) =>
  options.slice(0, 4).map((option, index) => {
    const letter = String.fromCharCode(65 + index);
    const clean = option.replace(/^\s*[A-D][\.)]\s*/i, '').trim();
    return `${letter}. ${clean}`;
  });

const normalizeTfOptions = (options: string[]) =>
  options.slice(0, 4).map((option, index) => {
    const letter = String.fromCharCode(97 + index);
    const clean = option.replace(/^\s*[a-d][\.)]\s*/i, '').trim();
    return `${letter}) ${clean}`;
  });

const validateQuestion = (question: GeneratedQuestion, part: 'mcq' | 'tf' | 'short') => {
  const issues: string[] = [];

  if (!question.question) issues.push('Thiếu nội dung câu hỏi.');
  if (!question.answer) issues.push('Thiếu đáp án.');
  if (!question.explanation) issues.push('Thiếu giải thích.');

  if (part === 'mcq') {
    if (question.options.length !== 4) issues.push('MCQ phải có đúng 4 phương án.');
    if (!/^[A-D]/i.test(question.answer)) issues.push('Đáp án MCQ phải chỉ rõ A/B/C/D.');
  }

  if (part === 'tf') {
    if (question.options.length !== 4) issues.push('Đúng/Sai phải có đúng 4 ý a–d.');
    const answerText = question.answer.toLowerCase();
    const markers = ['a', 'b', 'c', 'd'].filter((letter) =>
      new RegExp(`${letter}\\s*[\\)\\.: -]`).test(answerText),
    );
    if (markers.length < 4) issues.push('Đáp án Đúng/Sai phải nêu đủ a, b, c, d.');
  }

  if (part === 'short') {
    if (question.options.length > 0) issues.push('Trả lời ngắn không được có phương án lựa chọn.');
    if (!/^-?\d+(?:[.,]\d+)?$/.test(question.answer.trim())) {
      issues.push('Đáp án trả lời ngắn phải là một giá trị số.');
    }
  }

  return issues;
};

const mcqPrompt = (slot: ExamQuestionSlot, lang: string) => {
  const isEnglish = lang === 'en';
  return isEnglish
    ? `You are an expert Biology teacher. Create ONE multiple-choice question for this exact exam slot.
Content: ${slot.contentLabel}
Competency: ${slot.competencyCode}
Learning outcome: ${slot.outcomeText}
Cognitive level: ${levelLabel[slot.level].en}

Requirements:
- Exactly 4 options A-D.
- Exactly 1 correct answer.
- Match the requested cognitive level and learning outcome.
- Do not mention the matrix, slot, competency code, or cognitive label in the question.
- Use scientifically accurate Biology.
- Return ONLY one valid JSON object:
{"question":"...","type":"Multiple choices","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"..."}`
    : `Bạn là chuyên gia soạn đề Sinh học. Hãy tạo ĐÚNG MỘT câu trắc nghiệm nhiều lựa chọn cho slot sau.
Nội dung: ${slot.contentLabel}
Năng lực: ${slot.competencyCode}
Yêu cầu cần đạt: ${slot.outcomeText}
Mức độ: ${levelLabel[slot.level].vi}

Yêu cầu:
- Đúng 4 phương án A-D.
- Chỉ 1 phương án đúng.
- Phải bám đúng yêu cầu cần đạt và mức độ đã chỉ định.
- Không nhắc đến ma trận, slot, mã năng lực hay tên mức độ trong câu hỏi.
- Nội dung Sinh học phải chính xác.
- Chỉ trả về MỘT JSON object hợp lệ:
{"question":"...","type":"Multiple choices","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A. ...","explanation":"..."}`;
};

const shortPrompt = (slot: ExamQuestionSlot, lang: string) => {
  const isEnglish = lang === 'en';
  return isEnglish
    ? `You are an expert Biology teacher. Create ONE numeric short-response Biology question for this exact exam slot.
Content: ${slot.contentLabel}
Competency: ${slot.competencyCode}
Learning outcome: ${slot.outcomeText}
Cognitive level: ${levelLabel[slot.level].en}

Requirements:
- The final answer MUST be a single number, integer or decimal.
- No multiple-choice options.
- Match the requested cognitive level and learning outcome.
- Return ONLY one valid JSON object:
{"question":"...","type":"Short response","options":[],"answer":"12.5","explanation":"..."}`
    : `Bạn là chuyên gia soạn đề Sinh học. Hãy tạo ĐÚNG MỘT câu trả lời ngắn bằng số cho slot sau.
Nội dung: ${slot.contentLabel}
Năng lực: ${slot.competencyCode}
Yêu cầu cần đạt: ${slot.outcomeText}
Mức độ: ${levelLabel[slot.level].vi}

Yêu cầu:
- Đáp án cuối cùng PHẢI là một giá trị số duy nhất, có thể là số nguyên hoặc thập phân.
- Không có phương án lựa chọn.
- Phải bám đúng yêu cầu cần đạt và mức độ đã chỉ định.
- Chỉ trả về MỘT JSON object hợp lệ:
{"question":"...","type":"Short response","options":[],"answer":"12,5","explanation":"..."}`;
};

const tfPrompt = (slot: TrueFalseQuestionSlot, lang: string) => {
  const isEnglish = lang === 'en';
  const specs = slot.statements
    .map((statement) => {
      const label = String.fromCharCode(96 + statement.statementOrder);
      return `${label}) Level: ${isEnglish ? levelLabel[statement.level].en : levelLabel[statement.level].vi}; Outcome: ${statement.outcomeText}`;
    })
    .join('\n');

  const contentLabel = slot.statements[0]?.contentLabel || 'Biology';

  return isEnglish
    ? `You are an expert Biology teacher. Create ONE True/False cluster with EXACTLY 4 statements for this exam slot.
Shared content: ${contentLabel}
The four statements MUST follow these specifications in order:
${specs}

Requirements:
- Write one coherent shared stem/context in "question".
- "options" must contain EXACTLY four statements a), b), c), d) in the same order as the specifications.
- Each statement must match its own requested cognitive level and learning outcome.
- Use a meaningful mix of true and false statements; avoid all four having the same truth value.
- Do not mention the matrix, slot, competency codes, or cognitive labels.
- Return ONLY one valid JSON object:
{"question":"...","type":"True/ False","options":["a) ...","b) ...","c) ...","d) ..."],"answer":"a) True; b) False; c) True; d) False","explanation":"a) ...; b) ...; c) ...; d) ..."}`
    : `Bạn là chuyên gia soạn đề Sinh học. Hãy tạo ĐÚNG MỘT câu trắc nghiệm Đúng/Sai gồm CHÍNH XÁC 4 ý cho slot sau.
Nội dung chung: ${contentLabel}
Bốn ý phải lần lượt bám đúng các đặc tả sau:
${specs}

Yêu cầu:
- Trường "question" là một đoạn dẫn/ngữ cảnh chung mạch lạc cho cả 4 ý.
- "options" phải có ĐÚNG bốn ý a), b), c), d), đúng thứ tự đặc tả.
- Mỗi ý phải đúng mức độ và yêu cầu cần đạt riêng của nó.
- Nên có sự pha trộn hợp lí giữa mệnh đề đúng và sai; tránh cả 4 ý cùng một giá trị.
- Không nhắc đến ma trận, slot, mã năng lực hay tên mức độ.
- Chỉ trả về MỘT JSON object hợp lệ:
{"question":"...","type":"True/ False","options":["a) ...","b) ...","c) ...","d) ..."],"answer":"a) Đúng; b) Sai; c) Đúng; d) Sai","explanation":"a) ...; b) ...; c) ...; d) ..."}`;
};

const callModel = async (
  ai: GoogleGenAI,
  prompt: string,
  expectedPart: 'mcq' | 'tf' | 'short',
  retries = 1,
): Promise<GeneratedQuestion> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt + (attempt > 0 ? '\nIMPORTANT: Fix any structural errors and follow the JSON schema exactly.' : ''),
        config: { responseMimeType: 'application/json' },
      });

      const parsed = parseQuestion(response.text || '');

      if (expectedPart === 'mcq') {
        parsed.type = QuestionType.MultipleChoice;
        parsed.options = normalizeMcqOptions(parsed.options);
      } else if (expectedPart === 'tf') {
        parsed.type = QuestionType.TrueFalse;
        parsed.options = normalizeTfOptions(parsed.options);
      } else {
        parsed.type = QuestionType.ShortResponse;
        parsed.options = [];
        parsed.answer = parsed.answer.replace(',', '.');
      }

      const issues = validateQuestion(parsed, expectedPart);
      if (issues.length > 0) {
        throw new Error(issues.join(' '));
      }

      return parsed;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI generation failed.');
};

export const generateExamItem = async (
  apiKey: string,
  slot: ExamQuestionSlot | TrueFalseQuestionSlot,
  lang: string = 'vi',
): Promise<GeneratedExamItem> => {
  const ai = new GoogleGenAI({ apiKey });

  if (slot.part === 'tf') {
    const question = await callModel(ai, tfPrompt(slot, lang), 'tf', 1);
    return { slotId: slot.id, part: 'tf', order: slot.order, question };
  }

  if (slot.part === 'mcq') {
    const question = await callModel(ai, mcqPrompt(slot, lang), 'mcq', 1);
    return { slotId: slot.id, part: 'mcq', order: slot.order, question };
  }

  const question = await callModel(ai, shortPrompt(slot, lang), 'short', 1);
  return { slotId: slot.id, part: 'short', order: slot.order, question };
};

const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let completed = 0;

  const runners = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
      completed += 1;
      onProgress?.({ completed, total: items.length });
    }
  });

  await Promise.all(runners);
  return results;
};

export const generateExamFromSlots = async (
  apiKey: string,
  slots: ExamSlotPackage,
  lang: string = 'vi',
  onProgress?: (progress: GenerationProgress) => void,
): Promise<GeneratedExamItem[]> => {
  const orderedSlots: Array<ExamQuestionSlot | TrueFalseQuestionSlot> = [
    ...slots.mcq,
    ...slots.tf,
    ...slots.short,
  ];

  return runWithConcurrency(
    orderedSlots,
    3,
    (slot) => generateExamItem(apiKey, slot, lang),
    onProgress,
  );
};
