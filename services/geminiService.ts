import type { Criteria } from '../types';
import { EXAMPLE_QUESTIONS } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const exampleString = JSON.stringify(EXAMPLE_QUESTIONS, null, 2);
  const isEnglish = lang === 'en';

  // --- HƯỚNG DẪN LOẠI CÂU HỎI (QUAN TRỌNG NHẤT) ---
  let typeInstruction = "";
  if (criteria.questionType.includes("Trắc nghiệm nhiều lựa chọn") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "MANDATORY: Generate ONLY 'Multiple choices' questions. Format: Question + 4 Options (A,B,C,D). ONE correct answer."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Multiple choices' (Trắc nghiệm nhiều lựa chọn). Cấu trúc: Câu hỏi + 4 phương án (A,B,C,D). 1 đáp án đúng.";
  } else if (criteria.questionType.includes("Trắc nghiệm Đúng/Sai") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? "MANDATORY: Generate ONLY 'True/ False' questions. Format: A Context/Stem + 4 Statements (a,b,c,d). Answer must specify True/False for EACH statement."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'True/ False' (Đúng/Sai theo chùm). Cấu trúc: Một câu dẫn/ngữ cảnh + 4 mệnh đề (a,b,c,d). Đáp án phải chỉ rõ Đúng/Sai cho từng ý.";
  } else if (criteria.questionType.includes("Trả lời ngắn") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "MANDATORY: Generate ONLY 'Short response' questions. The answer MUST be a specific number (integer/decimal). No options."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Short response' (Trả lời ngắn). Đáp án PHẢI là một con số cụ thể. Không có phương án lựa chọn.";
  } else {
      typeInstruction = isEnglish
        ? "Generate a mix of: Multiple choices, True/ False, and Short response."
        : "Tạo hỗn hợp các loại: Multiple choices, True/ False, và Short response.";
  }

  // --- VAI TRÒ & NGÔN NGỮ ---
  const role = isEnglish
    ? "You are an expert Biology Teacher creating an exam."
    : "Bạn là giáo viên Sinh học chuyên nghiệp đang soạn đề thi.";

  const task = isEnglish
    ? `Generate ${criteria.questionCount} high-quality questions in **ENGLISH**.`
    : `Tạo ${criteria.questionCount} câu hỏi chất lượng cao bằng **TIẾNG VIỆT**.`;

  // --- ĐỊNH DẠNG JSON ---
  // Sử dụng cấu trúc đơn giản để AI dễ follow
  const jsonFormat = isEnglish 
  ? `
    OUTPUT FORMAT (JSON Array):
    [
      {
        "type": "Multiple choices" | "True/ False" | "Short response",
        "question": "Question content...",
        "options": ["Option A", "Option B"...] OR ["Statement a", "Statement b"...],
        "answer": "Key (e.g. 'A' or 'a) T, b) F...' or '120')",
        "explanation": "Explanation..."
      }
    ]
  ` : `
    ĐỊNH DẠNG ĐẦU RA (Mảng JSON):
    [
      {
        "type": "Multiple choices" | "True/ False" | "Short response",
        "question": "Nội dung câu hỏi...",
        "options": ["Phương án A", "Phương án B"...] HOẶC ["Ý a", "Ý b"...],
        "answer": "Đáp án (VD: 'A' hoặc 'a) Đ, b) S...' hoặc '120')",
        "explanation": "Giải thích chi tiết..."
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

Ensure valid JSON. Do not include markdown code blocks.
`;
};
