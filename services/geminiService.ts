import type { Criteria } from '../types';
import { RAG_EXAMPLES } from '../constants';
import { vi } from '../locales/vi';
import { en } from '../locales/en';

const lookup = (key: string, lang: string, category: string): string => {
    const resource = lang === 'en' ? en : vi;
    // @ts-ignore
    return resource.translation.constants[category][key] || key;
};

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const isEnglish = lang === 'en';

  const chapterText = lookup(criteria.chapter, lang, 'chapters');
  const difficultyText = lookup(criteria.difficulty, lang, 'difficulties');
  const competencyText = lookup(criteria.competency, lang, 'competencies');
  const settingText = lookup(criteria.setting, lang, 'settings');

  // --- LOGIC CHỌN LOẠI CÂU HỎI ---
  let typeInstruction = "";
  let jsonExample = "";
  let negativeConstraint = "";
  
  if (criteria.questionType.includes("type_mcq") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "TASK: Generate 'Multiple choices' questions (Part I)."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn' (Phần I).";
      jsonExample = JSON.stringify([RAG_EXAMPLES.MCQ], null, 2);
      negativeConstraint = "DO NOT generate True/False or Short Response.";
  } 
  else if (criteria.questionType.includes("type_tf") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'True/ False' questions (PISA Format/Part II)."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Đúng/Sai' (Dạng chùm PISA/Phần II).";
      jsonExample = JSON.stringify([RAG_EXAMPLES.TF], null, 2);
      negativeConstraint = "MUST have a Context Stem and EXACTLY 4 statements.";
  } 
  else if (criteria.questionType.includes("type_short") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'Short response' questions (Part III)."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Trả lời ngắn' (Phần III).";
      jsonExample = JSON.stringify([RAG_EXAMPLES.SHORT], null, 2);
      negativeConstraint = "ANSWER MUST BE A NUMBER. NO TEXT.";
  } 
  else {
      typeInstruction = isEnglish
        ? "TASK: Generate a mix of questions."
        : "NHIỆM VỤ: Tạo hỗn hợp các loại câu hỏi.";
      jsonExample = JSON.stringify([RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT], null, 2);
  }

  return `
You are an expert Biology Teacher.
${isEnglish ? "Language: English" : "Ngôn ngữ: Tiếng Việt"}

STRICT TOPIC CONSTRAINT:
The questions MUST be about the topic: "${chapterText}".
(If the topic is about Class 10, do NOT ask about Class 12).

CONTEXT:
- Setting: "${settingText}"
- Difficulty: "${difficultyText}"
- Competency: "${competencyText}"
${criteria.customPrompt ? `- Note: "${criteria.customPrompt}"` : ''}

${typeInstruction}

NEGATIVE CONSTRAINTS:
${negativeConstraint}

JSON OUTPUT FORMAT:
${jsonExample}
`;
};
