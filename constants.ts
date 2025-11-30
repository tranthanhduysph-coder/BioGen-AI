export const CRITERIA_DATA = {
  chapters: [
    "Sinh học tế bào",
    "Vi sinh vật",
    "Sinh học cá thể thực vật",
    "Dinh dưỡng và tiêu hóa ở động vật",
    "Bài tiết và cân bằng nội môi",
    "Vận chuyển các chất trong cơ thể động vật",
    "Miễn dịch ở động vật",
    "Cảm ứng ở sinh vật",
    "Sinh sản ở sinh vật",
    "Di truyền phân tử",
    "Di truyền nhiễm sắc thể",
    "Di truyền gene ngoài nhân",
    "Tiến hoá",
    "Môi trường và Sinh thái học quần thể",
    "Sinh thái học quần xã",
    "Sinh thái học phục hồi, bảo tồn và phát triển bền vững"
  ],
  difficulties: [
    "Nhận biết",
    "Thông hiểu",
    "Vận dụng",
    "Vận dụng cao"
  ],
  competencies: [
    "NT1: Nhận biết, kể tên, phát biểu, nêu được các đối tượng, khái niệm.",
    "NT2: Trình bày được đặc điểm, vai trò, cơ chế bằng hình thức biểu đạt.",
    "NT3: Phân loại được các đối tượng, hiện tượng sống.",
    "NT4: Phân tích được đặc điểm đối tượng, sự vật, quá trình.",
    "NT5: So sánh, lựa chọn được đối tượng, cơ chế dựa theo tiêu chí.",
    "NT6: Giải thích mối quan hệ (nguyên nhân – kết quả, cấu tạo – chức năng).",
    "NT7: Nhận ra và chỉnh sửa điểm sai; đưa ra nhận định phê phán.",
    "NT8: Tìm từ khoá, sử dụng thuật ngữ, kết nối thông tin logic.",
    "TH1: Đề xuất vấn đề liên quan đến thế giới sống.",
    "TH2: Đưa ra phán đoán và xây dựng giả thuyết nghiên cứu.",
    "TH3: Lập kế hoạch thực hiện.",
    "TH4: Thực hiện kế hoạch (thu thập, xử lí dữ liệu).",
    "TH5: Viết, trình bày báo cáo và thảo luận.",
    "VD1: Giải thích thực tiễn, đánh giá hiện tượng thường gặp.",
    "VD2: Có hành vi, thái độ thích hợp, đề xuất giải pháp bảo vệ môi trường."
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
