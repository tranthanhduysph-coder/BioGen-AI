export const CRITERIA_DATA = {
  chapters: [
    "Thành phần hóa học của tế bào",
    "Cấu trúc tế bào",
    "Vận chuyển các chất qua màng sinh chất",
    "Chuyển hóa vật chất và năng lượng",
    "Chu kỳ tế bào và phân bào",
    "Vi sinh vật và Virus",
    "Trao đổi chất và chuyển hóa năng lượng ở thực vật",
    "Trao đổi chất và chuyển hóa năng lượng ở động vật",
    "Cảm ứng ở sinh vật",
    "Sinh trưởng và phát triển",
    "Sinh sản ở sinh vật",
    "Cơ chế di truyền và biến dị cấp độ phân tử",
    "Cơ chế di truyền và biến dị cấp độ tế bào",
    "Quy luật di truyền",
    "Di truyền học quần thể",
    "Ứng dụng di truyền học",
    "Di truyền học người",
    "Tiến hóa",
    "Sinh thái học cá thể và quần thể",
    "Quần xã sinh vật",
    "Hệ sinh thái, Sinh quyển và Bảo vệ môi trường"
  ],
  difficulties: [
    "Nhận biết",
    "Thông hiểu",
    "Vận dụng",
    "Vận dụng cao"
  ],
  competencies: [
    "NT1: Nhận thức sinh học",
    "NT2: Tìm hiểu thế giới sống",
    "NT3: Vận dụng kiến thức, kỹ năng đã học",
    "TD1: Tư duy hệ thống",
    "TD2: Tư duy phản biện",
    "TD3: Giải quyết vấn đề",
    "TN1: Năng lực thực nghiệm",
    "TN2: Phân tích dữ liệu",
    "TT1: Giao tiếp khoa học",
    "TT2: Trách nhiệm xã hội"
  ]
};

export const SETTINGS = [
  "Lý thuyết",
  "Thực nghiệm/Thí nghiệm",
  "Bài tập tính toán",
  "Tình huống thực tiễn",
  "Phân tích biểu đồ/Hình ảnh"
];

export const QUESTION_TYPES = [
  "Tất cả / Ngẫu nhiên",
  "Trắc nghiệm nhiều lựa chọn (Part I)",
  "Trắc nghiệm Đúng/Sai (Part II)",
  "Trắc nghiệm Trả lời ngắn (Part III)"
];

export const EXAM_BLUEPRINT_2025 = [
    {
        partName: "PHẦN I",
        questionType: "Trắc nghiệm nhiều lựa chọn (Part I)",
        count: 18, 
        distribution: ["Nhận biết", "Nhận biết", "Nhận biết", "Nhận biết", "Nhận biết", "Thông hiểu", "Thông hiểu", "Thông hiểu", "Thông hiểu", "Thông hiểu", "Thông hiểu", "Thông hiểu", "Vận dụng", "Vận dụng", "Vận dụng", "Vận dụng", "Vận dụng cao", "Vận dụng cao"]
    },
    {
        partName: "PHẦN II",
        questionType: "Trắc nghiệm Đúng/Sai (Part II)",
        count: 4,
        distribution: ["Thông hiểu", "Vận dụng", "Vận dụng", "Vận dụng cao"] 
    },
    {
        partName: "PHẦN III",
        questionType: "Trắc nghiệm Trả lời ngắn (Part III)",
        count: 6,
        distribution: ["Thông hiểu", "Thông hiểu", "Vận dụng", "Vận dụng", "Vận dụng cao", "Vận dụng cao"]
    }
];

export const EXAMPLE_QUESTIONS = [
  {
    "question": "Bào quan nào sau đây là nơi tổng hợp protein?",
    "type": "Multiple choices",
    "options": ["A. Ti thể", "B. Ribosome", "C. Lizosome", "D. Không bào"],
    "answer": "B. Ribosome",
    "explanation": "Ribosome là bào quan không có màng bao bọc, làm nhiệm vụ tổng hợp protein cho tế bào."
  },
  {
    "question": "Cho các phát biểu sau về quá trình quang hợp ở thực vật C3:",
    "type": "True/ False",
    "options": [
      "a) Chất nhận CO2 đầu tiên là Ribulose-1,5-bisphosphate (RuBP).",
      "b) Sản phẩm ổn định đầu tiên là hợp chất 3 cacbon (APG).",
      "c) Quá trình này chỉ xảy ra vào ban đêm.",
      "d) Oxi được giải phóng từ pha tối."
    ],
    "answer": "a) Đúng, b) Đúng, c) Sai, d) Sai",
    "explanation": "c) Sai vì quang hợp cần ánh sáng (pha sáng) và ATP/NADPH (pha tối) thường diễn ra ban ngày. d) Sai vì O2 sinh ra từ quang phân li nước ở pha sáng."
  },
  {
    "question": "Một phân tử DNA có 3000 nucleotide, trong đó Adenine chiếm 20%. Tính số liên kết Hydrogen của gen này.",
    "type": "Short response",
    "options": [],
    "answer": "3900",
    "explanation": "A = T = 20% * 3000 = 600. G = X = 30% * 3000 = 900. H = 2A + 3G = 2*600 + 3*900 = 1200 + 2700 = 3900."
  }
];
