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
      hello: "Xin chào"
    },
    auth: {
      title: "BioGen AI",
      subtitle: "Đăng nhập để lưu trữ dữ liệu",
      login_tab: "Đăng nhập",
      register_tab: "Đăng ký mới",
      fullname: "Họ và tên",
      email: "Email",
      password: "Mật khẩu",
      login_btn: "Đăng nhập",
      register_btn: "Đăng ký tài khoản",
      processing: "Đang xử lý...",
      or_google: "Hoặc tiếp tục với",
      no_firebase: "Chưa kết nối Firebase",
      no_firebase_msg: "Hệ thống chưa cấu hình API Key. Vui lòng kiểm tra file config hoặc sử dụng chế độ Demo.",
      demo_mode: "Vào chế độ Demo",
      quick_experience: "Chỉ muốn trải nghiệm nhanh?",
      use_guest: "Dùng chế độ khách",
      errors: {
        invalid_email: "Email không đúng định dạng.",
        user_disabled: "Tài khoản này đã bị vô hiệu hóa.",
        user_not_found: "Không tìm thấy tài khoản. Vui lòng đăng ký trước.",
        wrong_password: "Sai mật khẩu.",
        email_in_use: "Email này đã được đăng ký rồi.",
        weak_password: "Mật khẩu quá yếu (cần ít nhất 6 ký tự).",
        invalid_credential: "Thông tin đăng nhập không hợp lệ.",
        operation_not_allowed: "Phương thức đăng nhập này chưa được bật.",
        network_error: "Lỗi mạng. Vui lòng kiểm tra kết nối internet.",
        popup_closed: "Bạn đã đóng cửa sổ đăng nhập.",
        unauthorized_domain: "Tên miền trang web chưa được cấp quyền chạy Google Login.",
        invalid_api_key: "API Key không hợp lệ.",
        missing_fields: "Vui lòng điền đầy đủ email và mật khẩu.",
        missing_name: "Vui lòng nhập tên hiển thị (Họ tên)."
      }
    },
    welcome: {
      title: "Chào mừng bạn đến với BioGen AI",
      desc: "Công cụ hỗ trợ giáo viên và học sinh tạo đề trắc nghiệm Sinh học tự động.",
      instruction: "Hãy chọn Chương, Mức độ, và Năng lực ở bảng bên trái để bắt đầu."
    },
    criteria: {
      title: "Cấu hình câu hỏi",
      quick_exam_title: "Tạo đề tự động (Nhanh)",
      quick_exam_desc: "Tạo ngẫu nhiên đề thi hoàn chỉnh theo cấu trúc 2025 (18 câu trắc nghiệm, 4 câu Đ/S, 6 câu trả lời ngắn) với ma trận ngẫu nhiên.",
      quick_exam_placeholder: "VD: Tập trung vào di truyền, hạn chế câu hỏi lớp 10...",
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
      placeholder_extra: "VD: Tập trung vào bài tập di truyền phả hệ...",
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
      no_data: "Chưa có dữ liệu",
      no_data_desc: "Hãy thêm cấu hình vào danh sách và nhấn \"Tạo\" để bắt đầu.",
      share: "Chia sẻ",
      share_success: "Đã sao chép nội dung đề thi vào bộ nhớ tạm!",
      share_title: "ĐỀ THI SINH HỌC (BioGen AI)",
      error_export: "Lỗi xuất file. Vui lòng thử lại."
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
      content_1: "Nền tảng này sử dụng mô hình ngôn ngữ lớn (AI) để cung cấp các gợi ý và phản hồi. Các thông tin do AI tạo ra chỉ mang tính chất tham khảo, hỗ trợ học tập và không thể thay thế cho kiến thức chuyên môn, sự phán đoán của giảng viên hoặc các hướng dẫn học thuật chính thức.",
      content_2: "Người biên soạn không chịu trách nhiệm về bất kỳ sự sai lệch, thiếu sót, hoặc hậu quả nào phát sinh từ việc sử dụng các thông tin do AI cung cấp.",
      content_3: "Người dùng có trách nhiệm tự kiểm tra, đối chiếu và chịu trách nhiệm cuối cùng cho sản phẩm học thuật của mình.",
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
