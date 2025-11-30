import type { Criteria } from '../types';
import { EXAMPLE_QUESTIONS } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const exampleString = JSON.stringify(EXAMPLE_QUESTIONS, null, 2);
  const isEnglish = lang === 'en';

  // 1. CHỈ THỊ NGÔN NGỮ & VAI TRÒ
  const role = isEnglish
    ? "You are an expert Biology Professor specializing in High School Education."
    : "Bạn là Giáo sư Sinh học và chuyên gia soạn đề thi THPT chất lượng cao.";

  const task = isEnglish
    ? `Generate ${criteria.questionCount} questions in **ENGLISH**. Ensure academic precision.`
    : `Tạo ${criteria.questionCount} câu hỏi bằng **TIẾNG VIỆT**. Đảm bảo tính chính xác học thuật cao.`;

  // 2. CHỈ THỊ LOẠI CÂU HỎI
  let typeInstruction = "";
  if (criteria.questionType.includes("Trắc nghiệm nhiều lựa chọn") || criteria.questionType.includes("Part I")) {
      typeInstruction = isEnglish 
        ? "ONLY generate 'Multiple choices' questions (4 options A,B,C,D)."
        : "CHỈ TẠO các câu hỏi thuộc loại 'Multiple choices' (4 lựa chọn A,B,C,D).";
  } else if (criteria.questionType.includes("Trắc nghiệm Đúng/Sai") || criteria.questionType.includes("Part II")) {
      typeInstruction = isEnglish
        ? "ONLY generate 'True/ False' questions (Cluster of 4 statements a,b,c,d)."
        : "CHỈ TẠO các câu hỏi thuộc loại 'True/ False' (Chùm 4 ý a,b,c,d).";
  } else if (criteria.questionType.includes("Trả lời ngắn") || criteria.questionType.includes("Part III")) {
      typeInstruction = isEnglish
        ? "ONLY generate 'Short response' questions (Numeric answer)."
        : "CHỈ TẠO các câu hỏi thuộc loại 'Short response' (Điền số).";
  } else {
      typeInstruction = isEnglish
        ? "Generate a diverse mix of: Multiple choices, True/ False, and Short response."
        : "Tạo hỗn hợp các loại câu hỏi: Multiple choices, True/ False, và Short response.";
  }

  // 3. CHỈ THỊ NỘI DUNG CHI TIẾT (BIOMETRIC STYLE)
  const detailInstruction = isEnglish
    ? `
    *** CONTENT QUALITY REQUIREMENTS (BIOMETRIC STANDARD) ***
    1. **Contextual Depth**: Questions should be based on biological mechanisms, experiments, or data analysis, not just rote memorization.
    2. **Explanation**: Provide a "Detailed Explanation" that cites the specific biological process (e.g., "Due to the proton gradient in the ETC...").
    3. **True/False Format**: MUST provide a "Stem/Context" (paragraph describing an experiment or scenario) in the 'question' field BEFORE listing the 4 statements.
    `
    : `
    *** YÊU CẦU CHẤT LƯỢNG NỘI DUNG (CHUẨN CHUYÊN SÂU) ***
    1. **Chiều sâu ngữ cảnh**: Câu hỏi nên dựa trên cơ chế sinh học, thí nghiệm hoặc phân tích số liệu.
    2. **Giải thích**: Phần "explanation" phải cực kỳ chi tiết, giải thích rõ cơ chế tại sao đúng/sai (VD: "Do sự chênh lệch nồng độ H+..."), không chỉ nói đáp án là A.
    3. **Định dạng Đúng/Sai**: TRONG TRƯỜNG 'question' PHẢI CÓ đoạn văn dẫn (mô tả thí nghiệm, giả thuyết, hoặc tình huống) trước khi đưa ra các mệnh đề.
    `;

  let difficultyInstruction = `Mức độ: "${criteria.difficulty}"`;
  if (criteria.competency.startsWith("NT1")) {
      difficultyInstruction = isEnglish
        ? `Difficulty: "Nhận biết" (Recall - Strictly enforced for NT1).`
        : `Mức độ: "Nhận biết" (BẮT BUỘC cho năng lực NT1).`;
  }

  // 4. CẤU TRÚC JSON
  const jsonFormat = isEnglish
  ? `
    OUTPUT FORMAT (JSON Array):
    [
      {
        "question": "Question text (include context paragraph here for T/F)",
        "type": "Multiple choices" | "True/ False" | "Short response",
        "options": ["Option A", "Option B", "Option C", "Option D"] OR ["Statement a", "Statement b", "Statement c", "Statement d"],
        "answer": "Correct Answer string (e.g., 'A. ...' or 'a) True, b) False...')",
        "explanation": "Detailed scientific explanation."
      }
    ]
  `
  : `
    ĐỊNH DẠNG ĐẦU RA (Mảng JSON):
    [
      {
        "question": "Nội dung câu hỏi (bao gồm đoạn dẫn ngữ cảnh cho bài Đúng/Sai)",
        "type": "Multiple choices" | "True/ False" | "Short response",
        "options": ["A. ...", "B. ..."] HOẶC ["a) ...", "b) ..."],
        "answer": "Đáp án đúng (VD: 'A. ...' hoặc 'a) Đ, b) S...')",
        "explanation": "Giải thích chi tiết cơ chế."
      }
    ]
  `;

  return `
${role}
${task}

CONFIGURATION:
- Topic: "${criteria.chapter}"
- Setting: "${criteria.setting}"
- ${difficultyInstruction}
- Competency: "${criteria.competency}"
${criteria.customPrompt ? `- Extra Request: "${criteria.customPrompt}"` : ''}

${typeInstruction}
${detailInstruction}
${jsonFormat}

Reference Structure (Do not copy content):
${exampleString}
`;
};
