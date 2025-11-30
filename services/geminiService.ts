import type { Criteria } from '../types';
import { RAG_EXAMPLES } from '../constants';

export const generatePrompt = (criteria: Criteria, lang: string = 'vi'): string => {
  const isEnglish = lang === 'en';

  // 1. XÁC ĐỊNH LOẠI CÂU HỎI VÀ INJECT MẪU JSON (RAG)
  let typeInstruction = "";
  let jsonExample = "";
  
  if (criteria.questionType.includes("Part I") || criteria.questionType.includes("nhiều lựa chọn")) {
      typeInstruction = isEnglish 
        ? "TASK: Generate 'Multiple choices' questions. 4 distinct options A,B,C,D. Only 1 correct answer."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm nhiều lựa chọn'. 4 phương án A,B,C,D. Chỉ 1 phương án đúng.";
      
      jsonExample = JSON.stringify([RAG_EXAMPLES.MCQ], null, 2);
  } 
  else if (criteria.questionType.includes("Part II") || criteria.questionType.includes("Đúng/Sai")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'True/ False' questions (PISA Format). \n- Field 'question': Must be a Context/Stem (Scenario/Experiment data).\n- Field 'options': Must contain EXACTLY 4 STATEMENTS labelled a), b), c), d).\n- Field 'answer': Must specify True/False for EACH statement (e.g., 'a) True, b) False...')."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Đúng/Sai' (Dạng chùm PISA). \n- Trường 'question': Phải là ĐOẠN DẪN NGỮ CẢNH (Thí nghiệm, tình huống).\n- Trường 'options': Chứa ĐÚNG 4 MỆNH ĐỀ a), b), c), d).\n- Trường 'answer': Phải chỉ rõ Đúng/Sai cho từng ý (VD: 'a) Đ, b) S...').";
      
      jsonExample = JSON.stringify([RAG_EXAMPLES.TF], null, 2);
  } 
  else if (criteria.questionType.includes("Part III") || criteria.questionType.includes("Trả lời ngắn")) {
      typeInstruction = isEnglish
        ? "TASK: Generate 'Short response' questions.\nCRITICAL RULE: The 'answer' field MUST BE A NUMBER (integer or decimal). Do NOT include units or text in the answer field."
        : "NHIỆM VỤ: Tạo câu hỏi 'Trắc nghiệm Trả lời ngắn'.\nQUY TẮC TUYỆT ĐỐI: Trường 'answer' PHẢI LÀ MỘT CON SỐ (nguyên hoặc thập phân). KHÔNG viết đơn vị hay lời giải thích vào trường answer.";
      
      // Inject mẫu chỉ có số
      jsonExample = JSON.stringify([RAG_EXAMPLES.SHORT], null, 2);
  } 
  else {
      // Mixed
      typeInstruction = isEnglish
        ? "TASK: Generate a mix of: Multiple choices, True/ False (PISA), and Short response (Numeric answer)."
        : "NHIỆM VỤ: Tạo hỗn hợp 3 loại: Trắc nghiệm 4 lựa chọn, Đúng/Sai chùm (PISA), và Trả lời ngắn (Điền số).";
      jsonExample = JSON.stringify([RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT], null, 2);
  }

  // 2. VAI TRÒ & NGÔN NGỮ
  const role = isEnglish
    ? "You are an expert Biology Teacher creating an exam based on the 2018 General Education Curriculum."
    : "Bạn là chuyên gia soạn đề thi Sinh học theo Chương trình GDPT 2018.";

  const taskLang = isEnglish
    ? `Generate ${criteria.questionCount} questions in **ENGLISH**.`
    : `Tạo ${criteria.questionCount} câu hỏi bằng **TIẾNG VIỆT**.`;

  return `
${role}
${taskLang}

TARGET CRITERIA:
- Topic: "${criteria.chapter}"
- Context: "${criteria.setting}"
- Difficulty: "${criteria.difficulty}"
- Competency: "${criteria.competency}"
${criteria.customPrompt ? `- Note: "${criteria.customPrompt}"` : ''}

${typeInstruction}

STRICT OUTPUT FORMAT (Valid JSON Array):
${jsonExample}

CONSTRAINTS:
1. Return valid JSON only. No markdown.
2. For Short Response: Answer must be NUMERIC (e.g., "120", "0.5").
3. For True/False: Must have context stem and 4 statements.
`;
};
