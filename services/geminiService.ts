import type { Criteria } from '../types';
import { EXAMPLE_QUESTIONS } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const exampleString = JSON.stringify(EXAMPLE_QUESTIONS, null, 2);
  const isEnglish = lang === 'en';

  // --- 1. CHỈ THỊ LOẠI CÂU HỎI (STRICT MODE) ---
  let typeInstruction = "";
  
  if (criteria.questionType.includes("Trắc nghiệm nhiều lựa chọn") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "MANDATORY: Generate ONLY 'Multiple choices' questions. Format: Question + 4 Options (A,B,C,D). ONE correct answer."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn'. Cấu trúc: Câu hỏi + 4 phương án (A,B,C,D). 1 đáp án đúng.";
  } 
  else if (criteria.questionType.includes("Trắc nghiệm Đúng/Sai") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? "MANDATORY: Generate ONLY 'True/ False' questions (PISA style). STRUCTURE: The 'question' field MUST contain a context paragraph (Stem/Scenario). The 'options' field MUST contain exactly 4 statements (a,b,c,d). Answer must specify True/False for EACH statement."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trắc nghiệm Đúng/Sai' (Dạng chùm). CẤU TRÚC: Trường 'question' phải chứa ĐOẠN DẪN NGỮ CẢNH (thí nghiệm, biểu đồ...). Trường 'options' CHỨA ĐÚNG 4 MỆNH ĐỀ (a,b,c,d). Đáp án phải chỉ rõ Đúng/Sai cho từng ý.";
  } 
  else if (criteria.questionType.includes("Trả lời ngắn") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "MANDATORY: Generate ONLY 'Short response' questions. The answer MUST be a specific number (integer/decimal). NO text in answer field."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trả lời ngắn'. Đáp án PHẢI là một con số cụ thể (nguyên hoặc thập phân). KHÔNG viết chữ vào trường đáp án.";
  } 
  else {
      typeInstruction = isEnglish
        ? "Generate a mix of: Multiple choices, True/ False, and Short response."
        : "Tạo hỗn hợp các loại: Multiple choices, True/ False, và Short response.";
  }

  // --- 2. VAI TRÒ & NGÔN NGỮ ---
  const role = isEnglish
    ? "You are an expert Biology Teacher creating a standardized exam (2025 Format)."
    : "Bạn là giáo viên Sinh học chuyên nghiệp đang soạn đề thi chuẩn hóa 2025.";

  const task = isEnglish
    ? `Generate ${criteria.questionCount} high-quality questions in **ENGLISH**.`
    : `Tạo ${criteria.questionCount} câu hỏi chất lượng cao bằng **TIẾNG VIỆT**.`;

  // --- 3. ĐỊNH DẠNG JSON (JSON ONLY) ---
  const jsonFormat = `
    OUTPUT FORMAT (Valid JSON Array only, no Markdown):
    [
      {
        "type": "Multiple choices" | "True/ False" | "Short response",
        "question": "Content of the question (or Context paragraph for True/False)",
        "options": ["A...", "B...", "C...", "D..."] OR ["a)...", "b)...", "c)...", "d)..."],
        "answer": "Correct key (e.g., 'A' or 'a) Đ, b) S...' or '120')",
        "explanation": "Detailed explanation..."
      }
    ]
  `;

  return `
${role}
${task}

CONFIGURATION:
- Topic: "${criteria.chapter}"
- Context: "${criteria.setting}"
- Difficulty: "${criteria.difficulty}"
- Competency: "${criteria.competency}"
${criteria.customPrompt ? `- Note: "${criteria.customPrompt}"` : ''}

INSTRUCTIONS:
${typeInstruction}

${jsonFormat}

IMPORTANT: Ensure the output is valid JSON. Do not include \`\`\`json or \`\`\` tags.
`;
};
