import type { Criteria } from '../types';
import { RAG_EXAMPLES } from '../constants';
import { vi } from '../locales/vi';
import { en } from '../locales/en';

// Helper to lookup text from translation keys (Manual implementation since i18n hook isn't available in service)
const lookup = (key: string, lang: string, category: string): string => {
    const resource = lang === 'en' ? en : vi;
    // @ts-ignore
    return resource.translation.constants[category][key] || key;
};

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const isEnglish = lang === 'en';

  // TRANSLATE KEYS TO TEXT
  const chapterText = lookup(criteria.chapter, lang, 'chapters');
  const difficultyText = lookup(criteria.difficulty, lang, 'difficulties');
  const competencyText = lookup(criteria.competency, lang, 'competencies');
  const settingText = lookup(criteria.setting, lang, 'settings');

  // 1. QUESTION TYPE INSTRUCTIONS
  let typeInstruction = "";
  let jsonStructureExample = "";
  
  if (criteria.questionType.includes("type_mcq") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "TASK: Generate 'Multiple choices' questions. 4 options A,B,C,D. 1 Correct Answer."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn'. 4 phương án A,B,C,D. Chỉ 1 phương án đúng.";
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.MCQ], null, 2);
  } 
  else if (criteria.questionType.includes("type_tf") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'True/ False' questions (PISA Format). \n- 'question' field: Context/Stem.\n- 'options' field: EXACTLY 4 statements a), b), c), d).\n- 'answer' field: True/False for EACH statement."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Đúng/Sai' (Dạng chùm PISA). \n- Trường 'question': ĐOẠN DẪN NGỮ CẢNH.\n- Trường 'options': Chứa ĐÚNG 4 MỆNH ĐỀ a), b), c), d).\n- Trường 'answer': Chỉ rõ Đúng/Sai cho từng ý.";
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.TF], null, 2);
  } 
  else if (criteria.questionType.includes("type_short") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'Short response' questions.\nCRITICAL: 'answer' field MUST BE A NUMBER (integer or decimal). NO TEXT."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Trả lời ngắn'.\nQUY TẮC: Trường 'answer' PHẢI LÀ SỐ. KHÔNG viết chữ.";
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.SHORT], null, 2);
  } 
  else {
      // Mixed
      typeInstruction = isEnglish
        ? "TASK: Generate a mix of Multiple Choice, True/False (PISA), and Short Response questions."
        : "NHIỆM VỤ: Tạo hỗn hợp 3 loại câu hỏi: Trắc nghiệm 4 lựa chọn, Đúng/Sai chùm (PISA), và Trả lời ngắn.";
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT], null, 2);
  }

  // 2. ROLE & LANGUAGE
  const role = isEnglish
    ? "You are an expert Biology Teacher creating a standard exam."
    : "Bạn là chuyên gia soạn đề thi Sinh học chuẩn.";

  const taskLang = isEnglish
    ? `Generate ${criteria.questionCount} questions in **ENGLISH**.`
    : `Tạo ${criteria.questionCount} câu hỏi bằng **TIẾNG VIỆT**.`;

  return `
${role}
${taskLang}

TARGET CONFIGURATION (Must follow strictly):
- Topic: "${chapterText}"
- Context: "${settingText}"
- Difficulty: "${difficultyText}"
- Competency: "${competencyText}"
${criteria.customPrompt ? `- Note: "${criteria.customPrompt}"` : ''}

${typeInstruction}

STRICT OUTPUT FORMAT (Valid JSON Array):
${jsonStructureExample}

RULES:
1. Valid JSON only.
2. Short Response Answer MUST be Numeric.
3. True/False MUST have 4 statements.
`;
};
