export const CRITERIA_DATA = {
  chapters: [
    // LỚP 10
    "Lớp 10: Thành phần hóa học của tế bào (Nước, Carbohydrate, Lipid, Protein, Nucleic acid)",
    "Lớp 10: Cấu trúc tế bào (Nhân sơ, Nhân thực, Màng sinh chất, Bào quan)",
    "Lớp 10: Trao đổi chất qua màng & Truyền tin tế bào",
    "Lớp 10: Chuyển hóa vật chất và năng lượng (Enzyme, Hô hấp tế bào, Quang hợp)",
    "Lớp 10: Chu kỳ tế bào và phân bào (Nguyên phân, Giảm phân, Ung thư)",
    "Lớp 10: Công nghệ tế bào & Vi sinh vật (Virus, Miễn dịch)",
    
    // LỚP 11
    "Lớp 11: Trao đổi nước và khoáng ở thực vật",
    "Lớp 11: Quang hợp & Hô hấp ở thực vật",
    "Lớp 11: Dinh dưỡng và tiêu hóa ở động vật",
    "Lớp 11: Hô hấp & Tuần hoàn ở động vật",
    "Lớp 11: Miễn dịch & Bài tiết (Cân bằng nội môi)",
    "Lớp 11: Cảm ứng ở sinh vật (Thực vật & Động vật)",
    "Lớp 11: Sinh trưởng và phát triển ở sinh vật",
    "Lớp 11: Sinh sản ở sinh vật (Vô tính, Hữu tính)",
    
    // LỚP 12
    "Lớp 12: Cơ sở vật chất di truyền (DNA, RNA, Gene, Mã di truyền)",
    "Lớp 12: Cơ chế di truyền (Tái bản, Phiên mã, Dịch mã, Điều hòa)",
    "Lớp 12: Nhiễm sắc thể & Đột biến (Gene, NST)",
    "Lớp 12: Quy luật di truyền (Mendel, Tương tác gene, Liên kết, Hoán vị)",
    "Lớp 12: Di truyền liên kết giới tính & Ngoài nhân",
    "Lớp 12: Di truyền quần thể & Ứng dụng di truyền",
    "Lớp 12: Di truyền học người (Bệnh, Tư vấn di truyền)",
    "Lớp 12: Tiến hóa (Bằng chứng, Cơ chế, Sự phát sinh sự sống)",
    "Lớp 12: Môi trường và Quần thể sinh vật",
    "Lớp 12: Quần xã sinh vật & Hệ sinh thái",
    "Lớp 12: Sinh quyển & Bảo vệ môi trường"
  ],
  difficulties: [
    "Nhận biết (Recall)",
    "Thông hiểu (Understand)",
    "Vận dụng (Apply)",
    "Vận dụng cao (Analyze/Evaluate)"
  ],
  competencies: [
    "NT1: Nhận biết, kể tên, phát biểu, nêu được đối tượng/khái niệm.",
    "NT2: Trình bày đặc điểm, vai trò, cơ chế.",
    "NT3: Phân loại đối tượng, hiện tượng.",
    "NT4: Phân tích đặc điểm, cấu trúc, quá trình.",
    "NT5: So sánh, lựa chọn đối tượng theo tiêu chí.",
    "NT6: Giải thích mối quan hệ (Nguyên nhân-Kết quả, Cấu tạo-Chức năng).",
    "NT7: Tư duy phản biện, nhận ra điểm sai.",
    "TH1-5: Năng lực thực hành, thí nghiệm, xử lý số liệu.",
    "VD1-2: Vận dụng thực tiễn, giải quyết vấn đề."
  ]
};

export const SETTINGS = [
  "Lý thuyết hàn lâm",
  "Phân tích thí nghiệm/Thực nghiệm",
  "Bài tập tính toán/Số liệu",
  "Tình huống thực tiễn/Đời sống",
  "Phân tích biểu đồ/Sơ đồ"
];

export const QUESTION_TYPES = [
  "Tất cả / Ngẫu nhiên",
  "Trắc nghiệm nhiều lựa chọn (Part I)",
  "Trắc nghiệm Đúng/Sai (Part II)",
  "Trắc nghiệm Trả lời ngắn (Part III)"
];

// Dữ liệu mẫu chính xác dùng cho RAG (Few-shot prompting)
export const RAG_EXAMPLES = {
  MCQ: {
    "question": "Bào quan nào sau đây là nơi tổng hợp protein?",
    "type": "Multiple choices",
    "options": ["A. Ti thể", "B. Ribosome", "C. Lizosome", "D. Không bào"],
    "answer": "B. Ribosome",
    "explanation": "Ribosome là nơi diễn ra quá trình dịch mã tổng hợp protein."
  },
  TF: {
    "question": "Một nhóm nghiên cứu thực hiện thí nghiệm đánh giá hiệu quả của vaccine X trên chuột. Dựa vào biểu đồ kết quả (giả định), hãy đánh giá các phát biểu sau:",
    "type": "True/ False",
    "options": [
      "a) Vaccine X kích thích sinh kháng thể IgG.",
      "b) Kháng thể đạt đỉnh sau 2 ngày tiêm.",
      "c) Đây là đáp ứng miễn dịch đặc hiệu.",
      "d) Chuột không được tiêm vaccine sẽ chết 100%."
    ],
    "answer": "a) Đúng, b) Sai, c) Đúng, d) Sai",
    "explanation": "a) Đúng vì... b) Sai vì đỉnh thường sau 2 tuần... c) Đúng... d) Sai vì..."
  },
  SHORT: {
    "question": "Một phân tử DNA có 3000 nucleotide, A=20%. Tính số liên kết Hydrogen.",
    "type": "Short response",
    "options": [],
    "answer": "3900",
    "explanation": "A=600, G=900. H=2A+3G = 1200+2700=3900."
  }
};

// Mảng rỗng để tránh lỗi import ở các file khác, nhưng logic chính sẽ dùng RAG_EXAMPLES
export const EXAMPLE_QUESTIONS = [RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT];
