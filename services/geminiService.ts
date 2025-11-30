import type { Criteria } from '../types';
import { RAG_EXAMPLES } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const isEnglish = lang === 'en';

  // 1. XÁC ĐỊNH LOẠI CÂU HỎI & MẪU JSON (Few-Shot Injection)
  let typeInstruction = "";
  let jsonStructureExample = "";
  
  if (criteria.questionType.includes("Part I") || criteria.questionType.includes("nhiều lựa chọn")) {
      typeInstruction = isEnglish 
        ? "TASK: Generate 'Multiple choices' questions (Standard MCQ). 4 options A,B,C,D. 1 Correct Answer."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn'. 4 phương án A,B,C,D. Chỉ 1 phương án đúng.";
      
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.MCQ], null, 2);
  } 
  else if (criteria.questionType.includes("Part II") || criteria.questionType.includes("Đúng/Sai")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'True/ False' questions (Cluster/PISA Format). \nCRITICAL: The 'question' field MUST be a context/stem (Experiment, Scenario). The 'options' field MUST contain EXACTLY 4 statements labeled a), b), c), d). The 'answer' MUST specify True/False for EACH statement."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Đúng/Sai' (Dạng chùm PISA). \nQUAN TRỌNG: Trường 'question' phải là ĐOẠN DẪN NGỮ CẢNH (Thí nghiệm, Tình huống). Trường 'options' chứa ĐÚNG 4 MỆNH ĐỀ a), b), c), d). Trường 'answer' phải chỉ rõ Đúng/Sai cho từng ý.";
      
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.TF], null, 2);
  } 
  else if (criteria.questionType.includes("Part III") || criteria.questionType.includes("Trả lời ngắn")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'Short response' questions. The answer MUST be a specific number or short phrase. NO OPTIONS."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Trả lời ngắn'. Đáp án PHẢI là một con số cụ thể hoặc từ khóa ngắn. KHÔNG có phương án lựa chọn.";
      
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.SHORT], null, 2);
  } 
  else {
      // Mixed mode
      typeInstruction = isEnglish
        ? "TASK: Generate a mix of Multiple Choice, True/False (PISA), and Short Response questions."
        : "NHIỆM VỤ: Tạo hỗn hợp 3 loại câu hỏi: Trắc nghiệm 4 lựa chọn, Đúng/Sai chùm (PISA), và Trả lời ngắn.";
      
      jsonStructureExample = JSON.stringify([RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT], null, 2);
  }

  // 2. VAI TRÒ & NGÔN NGỮ
  const role = isEnglish
    ? "You are an expert Biology Teacher creating a standard exam based on the 2018 General Education Program."
    : "Bạn là chuyên gia soạn đề thi Sinh học theo chương trình GDPT 2018 mới.";

  const taskLang = isEnglish
    ? `Generate ${criteria.questionCount} questions in **ENGLISH**.`
    : `Tạo ${criteria.questionCount} câu hỏi bằng **TIẾNG VIỆT**.`;

  // 3. TẠO PROMPT
  return `
${role}
${taskLang}

TARGET CONFIGURATION:
- Topic: "${criteria.chapter}"
- Context: "${criteria.setting}"
- Difficulty: "${criteria.difficulty}"
- Competency: "${criteria.competency}"
${criteria.customPrompt ? `- Extra Note: "${criteria.customPrompt}"` : ''}

${typeInstruction}

STRICT OUTPUT FORMAT (JSON Array):
Follow this exact JSON structure. Do not include markdown code blocks (like \`\`\`json).
${jsonStructureExample}

ENSURE:
1. Valid JSON Array syntax.
2. True/False questions MUST have a Context stem and 4 statements.
3. Short Response answers MUST be precise (numbers preferred).
`;
};
