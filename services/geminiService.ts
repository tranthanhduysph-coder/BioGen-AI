
import type { Criteria } from '../types';
import { EXAMPLE_QUESTIONS } from '../constants';

export const generatePrompt = (criteria: Criteria): string => {
  const exampleString = JSON.stringify(EXAMPLE_QUESTIONS, null, 2);

  let typeInstruction = "";
  if (criteria.questionType === "Trắc nghiệm nhiều lựa chọn (Part I)") {
      typeInstruction = "CHỈ TẠO các câu hỏi thuộc loại 'Multiple choices' (4 lựa chọn A,B,C,D). KHÔNG tạo loại khác.";
  } else if (criteria.questionType === "Trắc nghiệm Đúng/Sai (Part II)") {
      typeInstruction = "CHỈ TẠO các câu hỏi thuộc loại 'True/ False' (Chùm 4 ý a,b,c,d). KHÔNG tạo loại khác.";
  } else if (criteria.questionType === "Trắc nghiệm Trả lời ngắn (Part III)") {
      typeInstruction = "CHỈ TẠO các câu hỏi thuộc loại 'Short response' (Điền số). KHÔNG tạo loại khác.";
  } else {
      typeInstruction = "Tạo hỗn hợp các loại câu hỏi: Multiple choices, True/ False, và Short response một cách ngẫu nhiên hoặc phù hợp với nội dung.";
  }

  // Logic enforcement for NT1
  let difficultyInstruction = `Mức độ chung: "${criteria.difficulty}"`;
  if (criteria.competency.startsWith("NT1")) {
      difficultyInstruction = `Mức độ chung: "Nhận biết" (BẮT BUỘC vì năng lực là NT1, chỉ yêu cầu nhớ/biết/kể tên).`;
  }

  return `
Bạn là một chuyên gia soạn thảo câu hỏi trắc nghiệm môn Sinh học cấp THPT (lớp 10, 11, 12) tại Việt Nam, tuân theo cấu trúc đề thi đánh giá năng lực mới (từ năm 2025).
Nhiệm vụ của bạn là tạo ra ${criteria.questionCount} câu hỏi chất lượng cao.

THÔNG TIN CẤU HÌNH:
- Chương/Chủ đề: "${criteria.chapter}"
- Bối cảnh/Dạng bài: "${criteria.setting}" (Hãy đảm bảo nội dung câu hỏi phù hợp với bối cảnh này: Lý thuyết, Thực nghiệm, Tính toán, hoặc Tình huống thực tiễn).
- Loại câu hỏi yêu cầu: "${criteria.questionType}"
- ${difficultyInstruction}
- Năng lực cốt lõi: "${criteria.competency}"
${criteria.customPrompt ? `- Yêu cầu bổ sung từ người dùng: "${criteria.customPrompt}"` : ''}

${typeInstruction}

QUY ĐỊNH VỀ ĐỊNH DẠNG VÀ CẤU TRÚC CÂU HỎI (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):

1. **Multiple choices (Trắc nghiệm nhiều lựa chọn)**:
   - Câu hỏi tiêu chuẩn với 4 phương án A, B, C, D. Chỉ có 1 phương án đúng.

2. **True/ False (Trắc nghiệm đúng sai theo chùm)**:
   - **Cấu trúc**: Đưa ra một đoạn văn bản, một vấn đề, hình ảnh mô tả (bằng lời), hoặc bảng số liệu làm ngữ cảnh (Context) ở trường "question".
   - **Các ý hỏi**: Trường "options" PHẢI chứa đúng 4 mệnh đề (a, b, c, d).
   - **Phân hóa Bloom**: 4 mệnh đề này phải được sắp xếp theo thứ tự nhận thức tăng dần:
     + a) Nhận biết
     + b) Thông hiểu
     + c) Vận dụng
     + d) Vận dụng cao
   - **Đáp án**: Trường "answer" phải chỉ rõ trạng thái Đúng/Sai cho từng mệnh đề (ví dụ: "a) Đ, b) S, c) Đ, d) S").

3. **Short response (Trắc nghiệm trả lời ngắn)**:
   - Đặt câu hỏi sao cho đáp án là MỘT CON SỐ cụ thể.
   - **Quy định đáp án**: Trường "answer" PHẢI là số (số nguyên hoặc phân số/thập phân), độ dài chuỗi ký tự **KHÔNG QUÁ 4 KÝ TỰ** (tính cả dấu chấm/phẩy âm dương).
   - Ví dụ hợp lệ: "4", "120", "0.5", "-2", "10%".
   - Ví dụ KHÔNG hợp lệ: "12000" (5 ký tự), "40 kg" (có chữ).

Định dạng đầu ra JSON:
[
  {
    "question": "Nội dung câu hỏi hoặc đoạn dẫn ngữ cảnh",
    "type": "Multiple choices" | "True/ False" | "Short response",
    "options": ["Mảng các lựa chọn A,B,C,D hoặc các ý a,b,c,d"],
    "answer": "Đáp án đúng",
    "explanation": "Giải thích chi tiết"
  }
]

Dưới đây là mẫu JSON hợp lệ để tham khảo cấu trúc (không sao chép nội dung):
${exampleString}

Hãy tạo ${criteria.questionCount} câu hỏi mới. Đảm bảo bám sát bối cảnh "${criteria.setting}" và tuân thủ tuyệt đối quy tắc về Short response (max 4 chars) và True/False (4 levels).
`;
};
