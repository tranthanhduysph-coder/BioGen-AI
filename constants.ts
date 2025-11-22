
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
    "NT1: Nhận biết, kể tên, phát biểu, nêu được các đối tượng, khái niệm, quy luật, quá trình sống.",
    "NT2: Trình bày được các đặc điểm, vai trò của các đối tượng và các quá trình sống bằng các hình thức biểu đạt.",
    "NT3: Phân loại được các đối tượng, hiện tượng sống theo các tiêu chí khác nhau.",
    "NT4: Phân tích được các đặc điểm của một đối tượng, sự vật, quá trình theo logic nhất định.",
    "NT5: So sánh, lựa chọn được các đối tượng, khái niệm, các cơ chế, quá trình sống dựa theo tiêu chí nhất định.",
    "NT6: Giải thích được mối quan hệ giữa các sự vật và hiện tượng (nguyên nhân – kết quả, cấu tạo – chức năng).",
    "NT7: Nhận ra và chỉnh sửa được những điểm sai; đưa ra được những nhận định có tính phê phán.",
    "NT8: Tìm được từ khoá, sử dụng thuật ngữ khoa học, kết nối thông tin theo logic, lập dàn ý.",
    "TH1: Đề xuất vấn đề liên quan đến thế giới sống (đặt câu hỏi, phân tích bối cảnh).",
    "TH2: Đưa ra phán đoán và xây dựng giả thuyết nghiên cứu.",
    "TH3: Lập kế hoạch thực hiện (xây dựng khung logic, lựa chọn phương pháp).",
    "TH4: Thực hiện kế hoạch (thu thập, xử lí dữ liệu, phân tích kết quả).",
    "TH5: Viết, trình bày báo cáo và thảo luận kết quả nghiên cứu.",
    "VD1: Giải thích thực tiễn: giải thích, đánh giá hiện tượng thường gặp, tác động đến phát triển bền vững.",
    "VD2: Có hành vi, thái độ thích hợp: đề xuất giải pháp bảo vệ sức khoẻ, môi trường, thích ứng biến đổi khí hậu."
  ]
};

export const SETTINGS = [
  "Lý thuyết",
  "Thực nghiệm",
  "Bài tập tính toán",
  "Tình huống thực tiễn"
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
    "question": "Ở tế bào nhân thực, cấu trúc nào sau đây đóng vai trò kiểm soát sự vận chuyển các chất đi vào và đi ra khỏi tế bào?",
    "type": "Multiple choices",
    "options": ["A. Ti thể.", "B. Màng sinh chất.", "C. Lưới nội chất.", "D. Bộ máy Golgi."],
    "answer": "B. Màng sinh chất.",
    "explanation": "Màng sinh chất (hay còn gọi là màng tế bào) là một cấu trúc bao bọc bên ngoài tế bào, có chức năng chính là kiểm soát sự vận chuyển các chất ra vào tế bào."
  },
  {
    "question": "Một nhà khoa học đang nghiên cứu về cấu trúc của virus cúm A. Ông nhận thấy virus này có vật chất di truyền là RNA và có lớp vỏ ngoài. Dựa trên kiến thức về virus, hãy đánh giá các phát biểu sau:",
    "type": "True/ False",
    "options": [
      "a) Virus cúm A là virus có vật chất di truyền là DNA.",
      "b) Lớp vỏ ngoài của virus cúm A có nguồn gốc từ màng sinh chất của tế bào chủ.",
      "c) Nếu loại bỏ lớp vỏ ngoài, virus cúm A vẫn giữ nguyên khả năng lây nhiễm vào tế bào người.",
      "d) Việc nghiên cứu thuốc ức chế enzyme sao chép ngược (reverse transcriptase) là hướng đi hiệu quả nhất để điều trị cúm A."
    ],
    "answer": "a) Sai, b) Đúng, c) Sai, d) Sai",
    "explanation": "a) Sai vì cúm A là RNA virus. b) Đúng, vỏ ngoài thường lấy từ màng tế bào chủ. c) Sai, gai glycoprotein trên vỏ ngoài giúp bám dính. d) Sai, cúm A không dùng phiên mã ngược (đây là đặc điểm của Retrovirus như HIV)."
  },
  {
    "question": "Một gen có chiều dài 4080 Å. Gen này có bao nhiêu chu kỳ xoắn?",
    "type": "Short response",
    "options": [],
    "answer": "120",
    "explanation": "Chiều dài L = 4080 Å. Số nu N = (4080 / 3.4) * 2 = 2400. Số chu kỳ xoắn C = N / 20 = 2400 / 20 = 120."
  }
];
