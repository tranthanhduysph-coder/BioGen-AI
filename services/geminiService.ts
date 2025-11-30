import type { Criteria } from '../types';
import { EXAMPLE_QUESTIONS } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const isEnglish = lang === 'en';

  // --- 1. ROLE & TASK (Language Specific) ---
  const role = isEnglish
    ? "You are a distinguished Professor of Biology and an expert in Educational Assessment."
    : "Bạn là Giáo sư Sinh học đầu ngành và chuyên gia kiểm tra đánh giá giáo dục.";

  const task = isEnglish
    ? `Your task is to generate ${criteria.questionCount} high-quality, academic-standard biology questions in **ENGLISH**.`
    : `Nhiệm vụ của bạn là soạn thảo ${criteria.questionCount} câu hỏi sinh học chất lượng cao, chuẩn học thuật bằng **TIẾNG VIỆT**.`;

  // --- 2. QUESTION TYPE INSTRUCTION ---
  let typeInstruction = "";
  if (criteria.questionType.includes("Trắc nghiệm nhiều lựa chọn") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "STRICTLY generate 'Multiple choices' questions (4 options A,B,C,D)."
        : "CHỈ TẠO các câu hỏi 'Multiple choices' (4 lựa chọn A,B,C,D).";
  } else if (criteria.questionType.includes("Trắc nghiệm Đúng/Sai") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? "STRICTLY generate 'True/ False' questions (Cluster of 4 statements a,b,c,d)."
        : "CHỈ TẠO các câu hỏi 'True/ False' (Chùm 4 ý a,b,c,d).";
  } else if (criteria.questionType.includes("Trả lời ngắn") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "STRICTLY generate 'Short response' questions (Numeric answer only)."
        : "CHỈ TẠO các câu hỏi 'Short response' (Điền số).";
  } else {
      typeInstruction = isEnglish
        ? "Generate a balanced mix of: Multiple choices, True/ False, and Short response questions."
        : "Tạo hỗn hợp cân bằng các loại: Multiple choices, True/ False, và Short response.";
  }

  // --- 3. QUALITY & DEPTH (BIOMETRIC STANDARD) ---
  const qualityInstruction = isEnglish
    ? `
    *** QUALITY STANDARDS (BIOMETRIC AI) ***
    1.  **Deep Context**: Do not ask simple definitions. Questions MUST be based on biological mechanisms, experimental data analysis, or complex scenarios.
    2.  **Detailed Explanation**: The 'explanation' field must be comprehensive. Explain the underlying biological principle, why the correct answer is right, and critically why distractors are wrong.
    3.  **True/False Structure**: The 'question' field MUST contain a "Stem" (a paragraph describing an experiment, a diagram context, or a clinical case) BEFORE listing the 4 statements.
    4.  **Short Response**: Ensure the answer is a specific number derived from calculation or precise biological facts (e.g., "46", "0.25").
    `
    : `
    *** TIÊU CHUẨN CHẤT LƯỢNG (BIOMETRIC AI) ***
    1.  **Chiều sâu ngữ cảnh**: Tuyệt đối không hỏi định nghĩa đơn giản. Câu hỏi PHẢI dựa trên cơ chế sinh học sâu, phân tích dữ liệu thí nghiệm, hoặc tình huống thực tế phức tạp.
    2.  **Giải thích chi tiết**: Trường 'explanation' phải cực kỳ chi tiết (như sách giáo khoa chuyên sâu). Giải thích cơ chế, tại sao đúng, và phân tích tại sao các phương án nhiễu lại sai.
    3.  **Cấu trúc Đúng/Sai**: Trường 'question' BẮT BUỘC phải có một đoạn văn dẫn (mô tả thí nghiệm, sơ đồ, hoặc bệnh án) trước khi đưa ra 4 nhận định.
    4.  **Trả lời ngắn**: Đáp án phải là một con số cụ thể từ tính toán hoặc dữ kiện chính xác (VD: "24", "0.125").
    `;

  // --- 4. OUTPUT FORMAT ---
  const jsonFormat = isEnglish
  ? `
    OUTPUT FORMAT (Valid JSON Array):
    [
      {
        "question": "Question stem with context...",
        "type": "Multiple choices" | "True/ False" | "Short response",
        "options": ["A. ...", "B. ..."] OR ["a) ...", "b) ..."],
        "answer": "Correct key (e.g. 'A. ...' or 'a) True, b) False...')",
        "explanation": "In-depth scientific explanation..."
      }
    ]
  `
  : `
    ĐỊNH DẠNG ĐẦU RA (Mảng JSON hợp lệ):
    [
      {
        "question": "Nội dung câu hỏi và ngữ cảnh...",
        "type": "Multiple choices" | "True/ False" | "Short response",
        "options": ["A. ...", "B. ..."] HOẶC ["a) ...", "b) ..."],
        "answer": "Đáp án đúng (VD: 'A. ...' hoặc 'a) Đ, b) S...')",
        "explanation": "Giải thích khoa học chi tiết..."
      }
    ]
  `;

  return `
${role}
${task}

CONFIGURATION:
- Topic: "${criteria.chapter}"
- Context/Setting: "${criteria.setting}"
- Difficulty: "${criteria.difficulty}"
- Competency: "${criteria.competency}"
${criteria.customPrompt ? `- Specific Requirement: "${criteria.customPrompt}"` : ''}

${typeInstruction}
${qualityInstruction}
${jsonFormat}

Ensure the output is pure JSON. No markdown formatting.
`;
};
