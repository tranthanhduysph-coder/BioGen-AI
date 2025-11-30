
export const vi = {
  translation: {
    app: {
      name: "BioGen AI",
      subtitle: "Hệ thống tạo câu hỏi trắc nghiệm thông minh",
    },
    header: {
      history: "Lịch sử",
      theme: "Giao diện",
      logout: "Đăng xuất",
      hello: "Xin chào",
      language: "Ngôn ngữ"
    },
    auth: {
      title: "BioGen AI",
      subtitle: "Đăng nhập để lưu trữ dữ liệu",
      login_tab: "Đăng nhập",
      register_tab: "Đăng ký",
      fullname: "Họ và tên",
      email: "Email",
      password: "Mật khẩu",
      login_btn: "Đăng nhập",
      register_btn: "Đăng ký",
      processing: "Đang xử lý...",
      or_google: "Hoặc tiếp tục với",
      no_firebase: "Chưa kết nối Firebase",
      no_firebase_msg: "Chưa có cấu hình API Key. Dùng chế độ Demo.",
      demo_mode: "Vào chế độ Demo",
      quick_experience: "Chỉ muốn trải nghiệm nhanh?",
      use_guest: "Dùng chế độ khách"
    },
    welcome: {
      title: "Chào mừng bạn đến với BioGen AI",
      desc: "Công cụ hỗ trợ giáo viên và học sinh tạo đề trắc nghiệm Sinh học tự động.",
      instruction: "Hãy chọn Chương, Mức độ, và Năng lực ở bảng bên trái để bắt đầu."
    },
    criteria: {
      title: "Cấu hình câu hỏi",
      quick_exam_title: "Tạo đề tự động (Nhanh)",
      quick_exam_desc: "Tạo ngẫu nhiên đề thi hoàn chỉnh theo cấu trúc 2025.",
      quick_exam_placeholder: "VD: Tập trung vào di truyền...",
      quick_exam_btn: "Tạo đề thi mẫu 2025 ngay",
      generating: "Đang tạo đề...",
      manual_opt: "Hoặc tùy chỉnh thủ công",
      label_chapter: "Chương / Chủ đề",
      label_context: "Bối cảnh",
      label_type: "Loại câu hỏi",
      label_difficulty: "Mức Độ",
      label_quantity: "Số lượng (1-40)",
      label_competency: "Năng Lực Cốt Lõi",
      label_extra: "Yêu cầu thêm",
      placeholder_extra: "VD: Tập trung vào bài tập...",
      add_queue: "Thêm vào danh sách",
      queue_title: "Danh sách tạo",
      clear_all: "Xóa hết",
      generate_btn: "Tạo {{count}} câu hỏi (Thủ công)",
      processing: "Đang xử lý..."
    },
    results: {
      title: "Đề thi đã tạo",
      count_suffix: "câu",
      start_quiz: "Làm bài thi",
      export_docx: "Tải DOCX",
      share: "Chia sẻ",
      share_success: "Đã sao chép nội dung!",
      share_title: "ĐỀ THI SINH HỌC",
      error_export: "Lỗi xuất file",
      no_data: "Chưa có dữ liệu",
      no_data_desc: "Hãy thêm cấu hình vào danh sách và nhấn \"Tạo\" để bắt đầu."
    },
    quiz: {
      title_working: "Đang Làm Bài...",
      title_result: "Kết Quả Bài Thi",
      exit: "Thoát",
      submit: "Nộp Bài",
      score: "Điểm số",
      save_pdf: "Lưu PDF",
      saving: "Đang lưu...",
      header_print: "Kết quả bài thi trắc nghiệm",
      date: "Ngày thi",
      summary_title: "Tổng Kết Bài Thi",
      total_score: "Điểm Tổng",
      scale_10: "Thang điểm 10",
      correct_qs: "Số câu đúng",
      mcq_short: "MCQ & Short Response",
      correct_sub: "Ý đúng/sai",
      in_tf: "Trong phần True/False",
      q_label: "Câu",
      your_answer: "Bạn chọn:",
      your_input: "Bạn điền:",
      correct_answer: "Đáp án đúng:",
      explanation: "Giải thích chi tiết:",
      explanation_short: "Giải thích:",
      no_explanation: "Không có giải thích chi tiết.",
      col_proposition: "Mệnh đề",
      col_choice: "Bạn chọn",
      col_key: "Đáp án",
      placeholder_short: "Nhập số...",
      label_short_yours: "Câu trả lời của bạn",
      text_short_empty: "Điền đáp án số (tối đa 4 ký tự)",
      hide_ans: "Ẩn Đáp Án",
      show_ans: "Xem Đáp Án & Giải Thích",
      copy_tooltip: "Sao chép câu hỏi"
    },
    history: {
      title: "Lịch sử học tập",
      subtitle: "Thống kê kết quả các bài kiểm tra gần đây",
      loading: "Đang tải...",
      exams_count: "Số đề đã làm",
      avg_score: "Điểm trung bình",
      max_score: "Điểm cao nhất",
      list_title: "Chi tiết các lần thi",
      empty: "Chưa có dữ liệu bài thi nào."
    },
    footer: {
      dev_by: "Phát triển bởi",
      email: "Email",
      ai_notice: "Trang web này sử dụng AI tạo sinh.",
      disclaimer_link: "Xem Cảnh báo & Miễn trừ trách nhiệm",
      copyright: "© 2025 BioGen Exam System"
    },
    disclaimer: {
      title: "Cảnh báo & Miễn trừ Trách nhiệm",
      content_1: "Thông tin do AI tạo ra chỉ mang tính chất tham khảo.",
      content_2: "Người biên soạn không chịu trách nhiệm về sai lệch.",
      content_3: "Người dùng tự chịu trách nhiệm kiểm tra.",
      btn_close: "Đã hiểu"
    },
    loading: {
      title: "AI đang suy nghĩ...",
      subtitle: "Đang phân tích dữ liệu và tạo câu hỏi"
    },
    error: {
      title: "Đã xảy ra lỗi",
      reload: "Tải lại trang"
    }
  }
};
