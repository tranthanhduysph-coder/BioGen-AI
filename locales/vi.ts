export const vi = {
  translation: {
    app: { name: "BioGen AI", subtitle: "Hệ thống tạo câu hỏi trắc nghiệm thông minh" },
    header: { history: "Lịch sử", theme: "Giao diện", logout: "Đăng xuất", hello: "Xin chào", language: "Ngôn ngữ" },
    auth: {
      title: "BioGen AI", subtitle: "Đăng nhập để lưu trữ dữ liệu", login_tab: "Đăng nhập", register_tab: "Đăng ký",
      demo_mode: "Vào chế độ Demo", quick_experience: "Chỉ muốn trải nghiệm nhanh?", use_guest: "Dùng chế độ khách",
      login_btn: "Đăng nhập", register_btn: "Đăng ký", processing: "Đang xử lý...", or_google: "Hoặc tiếp tục với",
      no_firebase: "Chưa kết nối Firebase", no_firebase_msg: "Dùng chế độ Demo.", 
      errors: { invalid_email: "Email sai.", user_not_found: "Không tìm thấy user.", wrong_password: "Sai mật khẩu." }
    },
    welcome: { title: "Chào mừng bạn đến với BioGen AI", desc: "Công cụ hỗ trợ giáo viên tạo đề trắc nghiệm Sinh học chuẩn 2025." },
    
    criteria: {
      title: "Cấu hình đề thi",
      tab_auto: "Tạo đề 2025 (Tự động)",
      tab_manual: "Tạo câu hỏi lẻ (Thủ công)",
      part1: "PHẦN I: 18 Câu Trắc nghiệm",
      part1_desc: "Chọn 1 đáp án đúng (4.5 điểm)",
      part2: "PHẦN II: 4 Câu Đúng/Sai",
      part2_desc: "Chùm câu hỏi 4 ý (4.0 điểm)",
      part3: "PHẦN III: 6 Câu Trả lời ngắn",
      part3_desc: "Điền số liệu/kết quả (1.5 điểm)",
      select_topics: "Chủ đề cho phần này:",
      selected_count: "{{count}} chủ đề",
      select_all: "Chọn tất cả",
      clear_all: "Bỏ chọn",
      start_build: "TẠO ĐỀ THI (28 CÂU)",
      
      // Manual Section Labels
      label_chapter: "Chương / Chủ đề",
      label_context: "Bối cảnh",
      label_type: "Loại câu hỏi",
      label_difficulty: "Mức độ",
      label_quantity: "Số lượng",
      label_competency: "Năng lực",
      label_extra: "Yêu cầu thêm",
      add_queue: "Thêm vào danh sách",
      queue_title: "Danh sách chờ",
      generate_btn: "Tạo câu hỏi",
      processing: "Đang xử lý...",

      // Fixed missing keys for Quick Exam
      quick_exam_title: "TẠO ĐỀ TỰ ĐỘNG (CẤU TRÚC 2025)",
      quick_exam_desc: "Tạo ngẫu nhiên đề thi hoàn chỉnh theo cấu trúc 2025 (18 MCQ, 4 TF, 6 SR).",
      quick_exam_placeholder: "VD: Tập trung vào Di truyền học người, mức độ Vận dụng cao...",
      quick_exam_btn: "Tạo đề thi ngay",
      generating: "Đang khởi tạo...",
      manual_opt: "Hoặc tùy chỉnh thủ công"
    },
    results: {
      title: "Đề thi đã tạo", count_suffix: "câu", start_quiz: "Làm bài thi", export_docx: "Tải DOCX",
      share: "Chia sẻ", share_success: "Đã sao chép!", share_title: "ĐỀ THI SINH HỌC", error_export: "Lỗi xuất file",
      no_data: "Chưa có dữ liệu", no_data_desc: "Vui lòng tạo đề thi mới."
    },
    quiz: {
      title_working: "Đang Làm Bài...", title_result: "Kết Quả", exit: "Thoát", submit: "Nộp Bài",
      save: "Lưu Kết Quả", saved_success: "Đã lưu!", score: "Điểm", save_pdf: "Lưu PDF", saving: "Lưu...",
      header_print: "Kết quả bài thi", summary_title: "Tổng Kết", total_score: "Điểm Tổng", scale_10: "Thang 10",
      correct_qs: "Số câu đúng", mcq_short: "MCQ & SR", correct_sub: "Ý đúng/sai", in_tf: "Phần TF",
      q_label: "Câu", your_answer: "Chọn:", your_input: "Điền:", correct_answer: "Đúng:", explanation: "Giải thích:",
      explanation_short: "GT:", no_explanation: "Không có giải thích.", placeholder_short: "Nhập số...",
      label_short_yours: "Trả lời", text_short_empty: "Trống", hide_ans: "Ẩn Đ/A", show_ans: "Xem Đ/A"
    },
    history: { title: "Lịch sử", subtitle: "Kết quả gần đây", loading: "Tải...", exams_count: "Số đề", avg_score: "ĐTB", max_score: "Cao nhất", list_title: "Danh sách", empty: "Trống." },
    loading: { title: "AI đang suy nghĩ...", subtitle: "Đang phân tích dữ liệu và tạo câu hỏi" },
    error: { title: "Đã xảy ra lỗi", reload: "Tải lại trang" },

    // CONSTANTS TRANSLATION
    constants: {
        chapters: {
            g10_intro: "Lớp 10: Giới thiệu Sinh học",
            g10_cell_chem: "Lớp 10: Thành phần hóa học tế bào",
            g10_cell_struct: "Lớp 10: Cấu trúc tế bào",
            g10_cell_transport: "Lớp 10: Trao đổi chất & Truyền tin",
            g10_cell_energy: "Lớp 10: Chuyển hóa vật chất & Năng lượng",
            g10_cell_info: "Lớp 10: Thông tin giữa các tế bào",
            g10_cell_cycle: "Lớp 10: Chu kỳ tế bào & Phân bào",
            g10_microbio_vir: "Lớp 10: Vi sinh vật & Virus",

            g11_metabolism_plant: "Lớp 11: Trao đổi chất ở Thực vật",
            g11_metabolism_animal: "Lớp 11: Trao đổi chất ở Động vật",
            g11_sensing: "Lớp 11: Cảm ứng ở sinh vật",
            g11_growth: "Lớp 11: Sinh trưởng & Phát triển",
            g11_repro: "Lớp 11: Sinh sản ở sinh vật",

            g12_genetics_mol: "Lớp 12: Di truyền phân tử",
            g12_genetics_chrom: "Lớp 12: Di truyền nhiễm sắc thể",
            g12_genetics_human: "Lớp 12: Di truyền học người",
            g12_genetics_pop: "Lớp 12: Di truyền quần thể",
            g12_genetics_app: "Lớp 12: Ứng dụng di truyền",
            g12_evolution: "Lớp 12: Tiến hóa",
            g12_ecology_env: "Lớp 12: Môi trường & Nhân tố sinh thái",
            g12_ecology_pop: "Lớp 12: Sinh thái học quần thể",
            g12_ecology_comm: "Lớp 12: Quần xã sinh vật",
            g12_ecosystem: "Lớp 12: Hệ sinh thái & Sinh quyển"
        },
        difficulties: {
            diff_1: "Nhận biết (Mức 1)",
            diff_2: "Thông hiểu (Mức 2)",
            diff_3: "Vận dụng (Mức 3)",
            diff_4: "Vận dụng cao (Mức 4)"
        },
        competencies: {
            nt1: "NT1: Nhận biết, kể tên, phát biểu, nêu khái niệm.",
            nt2: "NT2: Trình bày đặc điểm, vai trò, cơ chế.",
            nt3: "NT3: Phân loại đối tượng, hiện tượng.",
            nt4: "NT4: Phân tích đặc điểm, cấu trúc, quá trình.",
            nt5: "NT5: So sánh, lựa chọn đối tượng theo tiêu chí.",
            nt6: "NT6: Giải thích mối quan hệ (Nguyên nhân-Kết quả).",
            nt7: "NT7: Nhận ra điểm sai, tư duy phản biện.",
            nt8: "NT8: Sử dụng thuật ngữ, kết nối thông tin.",
            th1: "TH1: Đề xuất vấn đề liên quan đến thế giới sống.",
            th2: "TH2: Đưa ra phán đoán và xây dựng giả thuyết.",
            th3: "TH3: Lập kế hoạch thực hiện.",
            th4: "TH4: Thực hiện kế hoạch (thu thập, xử lí dữ liệu).",
            th5: "TH5: Viết báo cáo và thảo luận.",
            vd1: "VD1: Giải thích, đánh giá hiện tượng thực tiễn.",
            vd2: "VD2: Hành vi, thái độ bảo vệ môi trường."
        },
        settings: {
            set_theory: "Lý thuyết hàn lâm",
            set_exp: "Phân tích thí nghiệm",
            set_calc: "Bài tập tính toán",
            set_real: "Tình huống thực tiễn",
            set_data: "Phân tích biểu đồ/Sơ đồ"
        },
        types: {
            type_mixed: "Tất cả / Ngẫu nhiên",
            type_mcq: "Trắc nghiệm nhiều lựa chọn (Part I)",
            type_tf: "Trắc nghiệm Đúng/Sai (Part II)",
            type_short: "Trắc nghiệm Trả lời ngắn (Part III)"
        }
    }
  }
};
