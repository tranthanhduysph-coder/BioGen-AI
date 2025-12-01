export const vi = {
  translation: {
    // ... (Giữ nguyên phần app, header, auth, welcome, results, quiz, history, loading, error)
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
      tab_auto: "Tạo đề 2025 (Cấu trúc chuẩn)",
      tab_manual: "Tạo câu hỏi lẻ (Thủ công)",
      part1: "PHẦN I: Trắc nghiệm nhiều lựa chọn",
      part1_desc: "18 câu hỏi (4.5 điểm). Chọn 1 đáp án đúng.",
      part2: "PHẦN II: Trắc nghiệm Đúng/Sai",
      part2_desc: "4 câu chùm (4.0 điểm). Mỗi câu có 4 ý.",
      part3: "PHẦN III: Trắc nghiệm Trả lời ngắn",
      part3_desc: "6 câu hỏi (1.5 điểm). Điền số liệu.",
      select_topics: "Chọn chủ đề cho phần này:",
      selected_count: "{{count}} chủ đề đã chọn",
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
      processing: "Đang xử lý..."
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

    // CHUẨN HÓA NỘI DUNG 2018
    constants: {
        chapters: {
            g10_intro: "Lớp 10: Giới thiệu Sinh học & Các cấp độ tổ chức sống",
            g10_chemical: "Lớp 10: Thành phần hóa học của tế bào",
            g10_structure: "Lớp 10: Cấu trúc tế bào (Nhân sơ, Nhân thực)",
            g10_transport: "Lớp 10: Trao đổi chất qua màng & Truyền tin",
            g10_metabolism: "Lớp 10: Chuyển hóa vật chất & Năng lượng",
            g10_cycle: "Lớp 10: Chu kỳ tế bào & Phân bào",
            g10_microbio: "Lớp 10: Vi sinh vật (Sinh trưởng & Sinh sản)",
            g10_virus: "Lớp 10: Virus và bệnh truyền nhiễm",
            g11_water: "Lớp 11: Trao đổi nước & khoáng ở thực vật",
            g11_photo: "Lớp 11: Quang hợp ở thực vật",
            g11_resp_plant: "Lớp 11: Hô hấp ở thực vật",
            g11_nutri_animal: "Lớp 11: Dinh dưỡng & Tiêu hóa ở động vật",
            g11_resp_animal: "Lớp 11: Hô hấp & Trao đổi khí ở động vật",
            g11_circ: "Lớp 11: Tuần hoàn & Hệ tim mạch",
            g11_immune: "Lớp 11: Miễn dịch & Cân bằng nội môi",
            g11_excrete: "Lớp 11: Bài tiết",
            g11_sense_plant: "Lớp 11: Cảm ứng ở thực vật",
            g11_sense_animal: "Lớp 11: Cảm ứng ở động vật",
            g11_growth: "Lớp 11: Sinh trưởng & Phát triển",
            g11_repro: "Lớp 11: Sinh sản ở sinh vật",
            g12_mol_gen: "Lớp 12: Di truyền phân tử (DNA, Gene, Phiên mã, Dịch mã)",
            g12_gene_reg: "Lớp 12: Điều hòa biểu hiện gene",
            g12_chrom_gen: "Lớp 12: Di truyền nhiễm sắc thể & Đột biến",
            g12_extra_gen: "Lớp 12: Di truyền ngoài nhân",
            g12_mendel: "Lớp 12: Quy luật di truyền (Mendel, Tương tác, Hoán vị)",
            g12_sex_linked: "Lớp 12: Di truyền liên kết giới tính",
            g12_pop_gen: "Lớp 12: Di truyền quần thể",
            g12_human: "Lớp 12: Di truyền học người",
            g12_evolution: "Lớp 12: Tiến hóa (Bằng chứng & Cơ chế)",
            g12_origin: "Lớp 12: Sự phát sinh sự sống & Sinh thái quần thể",
            g12_comm_eco: "Lớp 12: Quần xã sinh vật & Hệ sinh thái",
            g12_biosphere: "Lớp 12: Sinh quyển & Bảo vệ môi trường"
        },
        difficulties: {
            diff_1: "Nhận biết", diff_2: "Thông hiểu", diff_3: "Vận dụng", diff_4: "Vận dụng cao"
        },
        competencies: {
            nt1: "NT1: Nhận biết, kể tên, phát biểu, nêu được các đối tượng, khái niệm, quy luật, quá trình sống.",
            nt2: "NT2: Trình bày được các đặc điểm, vai trò của các đối tượng và các quá trình sống.",
            nt3: "NT3: Phân loại được các đối tượng, hiện tượng sống theo các tiêu chí khác nhau.",
            nt4: "NT4: Phân tích được các đặc điểm của một đối tượng, sự vật, quá trình theo logic nhất định.",
            nt5: "NT5: So sánh, lựa chọn được các đối tượng, khái niệm, cơ chế dựa theo tiêu chí.",
            nt6: "NT6: Giải thích được mối quan hệ giữa các sự vật và hiện tượng (nguyên nhân – kết quả, cấu tạo – chức năng).",
            nt7: "NT7: Nhận ra và chỉnh sửa được những điểm sai; đưa ra được những nhận định có tính phê phán.",
            nt8: "NT8: Tìm được từ khoá, sử dụng thuật ngữ khoa học, kết nối thông tin theo logic.",
            th1: "TH1: Đề xuất vấn đề liên quan đến thế giới sống.",
            th2: "TH2: Đưa ra phán đoán và xây dựng giả thuyết nghiên cứu.",
            th3: "TH3: Lập kế hoạch thực hiện.",
            th4: "TH4: Thực hiện kế hoạch (thu thập, xử lí dữ liệu).",
            th5: "TH5: Viết, trình bày báo cáo và thảo luận kết quả.",
            vd1: "VD1: Giải thích thực tiễn, đánh giá hiện tượng thường gặp.",
            vd2: "VD2: Có hành vi, thái độ thích hợp bảo vệ môi trường, sức khỏe."
        },
        settings: {
            set_theory: "Lý thuyết hàn lâm", set_exp: "Phân tích thí nghiệm", set_calc: "Bài tập tính toán",
            set_real: "Tình huống thực tiễn", set_data: "Phân tích biểu đồ/Sơ đồ"
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
