import type { Criteria } from '../types';
import { RAG_EXAMPLES } from '../constants';
import { vi } from '../locales/vi';
import { en } from '../locales/en';

const lookup = (key: string, lang: string, category: string): string => {
    const resource = lang === 'en' ? en : vi;
    // @ts-ignore
    return resource.translation.constants[category][key] || key;
};

// Updated to accept a list of topics string directly
export const generatePrompt = (criteria: Criteria, lang: string = 'vi', specificTopics: string[] = []): string => {
  const isEnglish = lang === 'en';

  // Handle Topics: If specific topics passed, translate them. If not, use the one in criteria.
  let topicString = "";
  if (specificTopics.length > 0) {
      // Translate keys to text
      const topicsText = specificTopics.map(k => lookup(k, lang, 'chapters')).join(", ");
      topicString = topicsText;
  } else {
      topicString = lookup(criteria.chapter, lang, 'chapters');
  }

  const difficultyText = lookup(criteria.difficulty, lang, 'difficulties');
  const contextInfo = `
    TOPICS/CHAPTERS: [ ${topicString} ]
    SETTING: "${lookup(criteria.setting, lang, 'settings')}"
    DIFFICULTY TARGET: "${difficultyText}"
  `;

  let typeInstruction = "";
  let jsonExample = "";
  let negativeConstraint = "";
  
  if (criteria.questionType.includes("type_mcq") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "TASK: Generate 'Multiple choices' questions (Part I)."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn' (Phần I).";
      jsonExample = JSON.stringify([RAG_EXAMPLES.MCQ], null, 2);
      negativeConstraint = "DO NOT generate True/False or Short Response questions. 4 Options A,B,C,D.";
  } 
  else if (criteria.questionType.includes("type_tf") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'True/ False' questions (PISA Format/Part II)."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Đúng/Sai' (Dạng chùm PISA/Phần II).";
      jsonExample = JSON.stringify([RAG_EXAMPLES.TF], null, 2);
      negativeConstraint = "MUST have a Context Stem and EXACTLY 4 statements (a,b,c,d).";
  } 
  else if (criteria.questionType.includes("type_short") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'Short response' questions (Part III)."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Trả lời ngắn' (Phần III).";
      jsonExample = JSON.stringify([RAG_EXAMPLES.SHORT], null, 2);
      negativeConstraint = "ANSWER MUST BE A NUMBER (Integer/Decimal). NO TEXT in answer.";
  }

  const taskLang = isEnglish
    ? `Generate ${criteria.questionCount} questions in **ENGLISH** based on the provided TOPICS.`
    : `Tạo ${criteria.questionCount} câu hỏi bằng **TIẾNG VIỆT** dựa trên các CHỦ ĐỀ đã cung cấp.`;

  return `
You are an expert Biology Teacher (2025 Curriculum).
${taskLang}

${contextInfo}

${typeInstruction}

NEGATIVE CONSTRAINTS:
${negativeConstraint}

STRICT JSON OUTPUT:
${jsonExample}

Ensure valid JSON.
`;
};
