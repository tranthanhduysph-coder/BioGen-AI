import type { Criteria } from '../types';
import { EXAMPLE_QUESTIONS } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const isEnglish = lang === 'en';

  // --- 1. ĐỊNH NGHĨA VAI TRÒ & NHIỆM VỤ ---
  const role = isEnglish
    ? "You are a strict Biology Exam Generator adhering to the Vietnam Ministry of Education (MOET) 2025 format."
    : "Bạn là hệ thống tạo đề thi Sinh học nghiêm ngặt tuân theo cấu trúc định dạng 2025 của Bộ GD&ĐT Việt Nam.";

  // --- 2. XÁC ĐỊNH LOẠI CÂU HỎI (CRITICAL) ---
  // Phân tích chuỗi input để xác định chính xác loại câu hỏi
  let targetType = "MIXED";
  let typeInstruction = "";
  
  if (criteria.questionType.includes("Part I") || criteria.questionType.includes("nhiều lựa chọn")) {
      targetType = "MCQ";
      typeInstruction = isEnglish 
        ? "MANDATORY: Generate ONLY 'Multiple choices' questions. Format: Question stem + 4 distinct options (A, B, C, D). ONE correct answer."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn'. Cấu trúc: Câu hỏi + 4 phương án (A, B, C, D). Chỉ 1 phương án đúng.";
  } else if (criteria.questionType.includes("Part II") || criteria.questionType.includes("Đúng/Sai")) {
      targetType = "TF";
      typeInstruction = isEnglish
        ? "MANDATORY: Generate ONLY 'True/ False' cluster questions. Format: A context paragraph (stem) followed by exactly 4 statements (a, b, c, d). Answer key must indicate True/False for EACH statement."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trắc nghiệm Đúng/Sai theo chùm'. Cấu trúc: Một đoạn dẫn (ngữ cảnh/thí nghiệm) theo sau là đúng 4 mệnh đề (a, b, c, d). Đáp án phải chỉ rõ Đúng/Sai cho từng mệnh đề.";
  } else if (criteria.questionType.includes("Part III") || criteria.questionType.includes("Trả lời ngắn")) {
      targetType = "SHORT";
      typeInstruction = isEnglish
        ? "MANDATORY: Generate ONLY 'Short response' questions. The answer MUST be a specific number (integer or decimal). No multiple choice options."
        : "BẮT BUỘC: Chỉ tạo câu hỏi 'Trả lời ngắn'. Đáp án PHẢI là một con số cụ thể (nguyên hoặc thập phân). Không được có các phương án lựa chọn.";
  } else {
      typeInstruction = isEnglish
        ? "Generate a balanced mix of 3 types: Multiple choices, True/ False (Cluster), and Short response."
        : "Tạo hỗn hợp 3 loại: Trắc nghiệm nhiều lựa chọn, Đúng/Sai (Chùm), và Trả lời ngắn.";
  }

  // --- 3. ĐỊNH DẠNG JSON (STRICT SCHEMA) ---
  // Ép kiểu JSON trả về để code React render đúng
  const jsonFormat = `
  IMPORTANT: Return ONLY a raw JSON Array. No Markdown. No code blocks.
  
  REQUIRED JSON STRUCTURE:
  [
    {
      "type": "${targetType === 'MCQ' ? 'Multiple choices' : targetType === 'TF' ? 'True/ False' : targetType === 'SHORT' ? 'Short response' : 'One of the valid types'}",
      "question": "The main question text (or the context paragraph for True/False)",
      "options": [
         // FOR MCQ: ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"]
         // FOR True/False: ["a) Statement 1", "b) Statement 2", "c) Statement 3", "d) Statement 4"]
         // FOR Short Response: [] (Empty array)
      ],
      "answer": "The correct key (e.g., 'B' or 'a) S, b) Đ, c) S, d) Đ' or '120')",
      "explanation": "Detailed explanation..."
    }
  ]
  `;

  // --- 4. NỘI DUNG CHI TIẾT (BIOMETRIC AI STYLE) ---
  const contentDepth = isEnglish
    ? `CONTENT QUALITY:
       - Context: "${criteria.setting}" (Ensure questions match this setting: Theory, Experiment, or Calculation).
       - Competency: "${criteria.competency}" (Ensure questions test this specific skill).
       - Difficulty: "${criteria.difficulty}".
       - For True/False: The Stem MUST describe an experiment, a dataset, or a biological mechanism. Do not just list random facts.
       - For Short Response: Ensure the question requires calculation or precise recall of a number (e.g., "How many ATP...", "Probability is...").`
    : `CHẤT LƯỢNG NỘI DUNG:
       - Bối cảnh: "${criteria.setting}" (Lý thuyết, Thí nghiệm, hoặc Tính toán).
       - Năng lực: "${criteria.competency}".
       - Độ khó: "${criteria.difficulty}".
       - Với câu Đúng/Sai: Phần dẫn (question) PHẢI mô tả một thí nghiệm, bảng số liệu, hoặc cơ chế sinh học. KHÔNG liệt kê kiến thức rời rạc.
       - Với câu Trả lời ngắn: Câu hỏi phải yêu cầu tính toán hoặc con số chính xác (VD: "Có bao nhiêu ATP...", "Tỷ lệ là...").`;

  return `
${role}

TASK:
${isEnglish ? `Generate ${criteria.questionCount} questions on topic: "${criteria.chapter}"` : `Tạo ${criteria.questionCount} câu hỏi về chủ đề: "${criteria.chapter}"`}
${criteria.customPrompt ? `Extra Requirement: ${criteria.customPrompt}` : ""}

INSTRUCTIONS:
${typeInstruction}
${contentDepth}

${jsonFormat}
`;
};
