
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

export const EXAMPLE_QUESTIONS = [
  {
    "question": "Bào quan nào sau đây là nơi tổng hợp protein?",
    "type": "Multiple choices",
    "options": ["A. Ti thể", "B. Ribosome", "C. Lizosome", "D. Không bào"],
    "answer": "B. Ribosome",
    "explanation": "Ribosome là bào quan không có màng bao bọc, làm nhiệm vụ tổng hợp protein cho tế bào."
  },
  {
    "question": "Một nhóm nghiên cứu thực hiện thí nghiệm đánh giá hiệu quả của vaccine. Dựa vào biểu đồ kết quả (giả định), hãy đánh giá các phát biểu sau:",
    "type": "True/ False",
    "options": [
      "a) Vaccine X kích thích sinh kháng thể mạnh hơn vaccine Y.",
      "b) Cả hai loại vaccine đều tạo ra đáp ứng miễn dịch.",
      "c) Vaccine Y có hiệu quả bảo vệ 100%.",
      "d) Chỉ số kháng thể là tiêu chí duy nhất."
    ],
    "answer": "a) Đúng, b) Đúng, c) Sai, d) Sai",
    "explanation": "Giải thích chi tiết cho từng ý đúng sai..."
  },
  {
    "question": "Một phân tử DNA có 3000 nucleotide, trong đó A chiếm 20%. Tính số liên kết Hydrogen.",
    "type": "Short response",
    "options": [],
    "answer": "3900",
    "explanation": "A=T=600, G=X=900. H=2A+3G = 1200+2700=3900."
  }
];
