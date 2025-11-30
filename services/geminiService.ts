import type { Criteria } from '../types';
import { EXAMPLE_QUESTIONS } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const exampleString = JSON.stringify(EXAMPLE_QUESTIONS, null, 2);
  const isEnglish = lang === 'en';

  // --- 1. CHỈ THỊ LOẠI CÂU HỎI (STRICT PISA MODE) ---
  let typeInstruction = "";
  
  if (criteria.questionType.includes("Trắc nghiệm nhiều lựa chọn") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "MANDATORY: Generate ONLY 'Multiple choices' questions. Format: Question + 4 Options (A,B,C,D). ONE correct answer."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn'. Cấu trúc: Câu hỏi + 4 phương án (A,B,C,D). 1 đáp án đúng.";
  } 
  else if (criteria.questionType.includes("Trắc nghiệm Đúng/Sai") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? `MANDATORY: Generate ONLY 'True/ False' questions (PISA Format). 
           STRUCTURE REQUIREMENT:
           1. 'question' field: Must contain the PROBLEM STEM (Scenario/Context/Data/Experiment).
           2. 'options' field: Must contain EXACTLY 4 STATEMENTS labelled a), b), c), d).
           3. 'answer' field: Must indicate True/False for EACH statement (e.g., 'a) True, b) False...').
           4. Difficulty: The 4 statements must range from low to high cognitive level.`
        : `BẮT BUỘC: Chỉ tạo câu hỏi 'Trắc nghiệm Đúng/Sai' (Dạng PISA).
           YÊU CẦU CẤU TRÚC:
           1. Trường 'question': Chứa ĐOẠN DẪN/NGỮ CẢNH (Thí nghiệm, biểu đồ, tình huống).
           2. Trường 'options': Chứa ĐÚNG 4 MỆNH ĐỀ được đánh nhãn a), b), c), d).
           3. Trường 'answer': Phải chỉ rõ Đúng/Sai cho từng mệnh đề (VD: 'a) Đ, b) S...').
           4. Độ khó: 4 mệnh đề phải được sắp xếp từ nhận biết đến vận dụng cao.`;
  } 
  else if (criteria.questionType.includes("Trả lời ngắn") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "MANDATORY: Generate ONLY 'Short response' questions. The answer MUST be a specific number (integer/decimal). No options."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trả lời ngắn'. Đáp án PHẢI là một con số cụ thể. Không có phương án lựa chọn.";
  } 
  else {
      typeInstruction = isEnglish
        ? "Generate a mix of: Multiple choices, True/ False (PISA format), and Short response."
        : "Tạo hỗn hợp các loại: Trắc nghiệm nhiều lựa chọn, Đúng/Sai (Dạng PISA 4 ý), và Trả lời ngắn.";
  }

  // --- 2. VAI TRÒ & NGÔN NGỮ ---
  const role = isEnglish
    ? "You are an expert Biology Teacher creating a standardized exam (2025 Format)."
    : "Bạn là giáo viên Sinh học chuyên nghiệp đang soạn đề thi chuẩn 2025.";

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
