// KEYS for translation lookup
export const CHAPTERS_KEYS = [
    // LỚP 10
    "g10_intro", 
    "g10_cell_chem", 
    "g10_cell_struct", 
    "g10_cell_transport", 
    "g10_cell_energy", 
    "g10_cell_info",
    "g10_cell_cycle", 
    "g10_microbio_vir",

    // LỚP 11
    "g11_metabolism_plant",
    "g11_metabolism_animal", 
    "g11_sensing",
    "g11_growth",
    "g11_repro",

    // LỚP 12
    "g12_genetics_mol",
    "g12_genetics_chrom",
    "g12_genetics_human",
    "g12_genetics_pop",
    "g12_genetics_app",
    "g12_evolution",
    "g12_ecology_env",
    "g12_ecology_pop",
    "g12_ecology_comm",
    "g12_ecosystem"
];

export const DIFFICULTIES_KEYS = ["diff_1", "diff_2", "diff_3", "diff_4"];

export const COMPETENCIES_KEYS = [
    // Nhận thức sinh học
    "nt1", "nt2", "nt3", "nt4", "nt5", "nt6", "nt7", "nt8",
    // Tìm hiểu thế giới sống
    "th1", "th2", "th3", "th4", "th5",
    // Vận dụng
    "vd1", "vd2"
];

export const SETTINGS_KEYS = ["set_theory", "set_exp", "set_calc", "set_real", "set_data"];

export const QUESTION_TYPES_KEYS = ["type_mixed", "type_mcq", "type_tf", "type_short"];

// Data structure for logic reference
export const CRITERIA_DATA = {
  chapters: CHAPTERS_KEYS,
  difficulties: DIFFICULTIES_KEYS,
  competencies: COMPETENCIES_KEYS
};

export const SETTINGS = SETTINGS_KEYS;
export const QUESTION_TYPES = QUESTION_TYPES_KEYS;

// RAG Examples (Standard)
export const RAG_EXAMPLES = {
  MCQ: {
    "question": "Bào quan nào sau đây là nơi tổng hợp protein?",
    "type": "Multiple choices",
    "options": ["A. Ti thể", "B. Ribosome", "C. Lizosome", "D. Không bào"],
    "answer": "B. Ribosome",
    "explanation": "Ribosome là nơi diễn ra quá trình dịch mã tổng hợp protein."
  },
  TF: {
    "question": "Một nhóm nghiên cứu thực hiện thí nghiệm đánh giá hiệu quả của vaccine X. Dựa vào biểu đồ kết quả (giả định), hãy đánh giá các phát biểu sau:",
    "type": "True/ False",
    "options": [
      "a) Vaccine X kích thích sinh kháng thể IgG.",
      "b) Kháng thể đạt đỉnh sau 2 ngày tiêm.",
      "c) Đây là đáp ứng miễn dịch đặc hiệu.",
      "d) Chuột không được tiêm vaccine sẽ chết 100%."
    ],
    "answer": "a) Đúng, b) Sai, c) Đúng, d) Sai",
    "explanation": "a) Đúng vì... b) Sai vì..."
  },
  SHORT: {
    "question": "Một phân tử DNA có 3000 nucleotide, A=20%. Tính số liên kết Hydrogen. (Điền số)",
    "type": "Short response",
    "options": [],
    "answer": "3900", 
    "explanation": "A=600, G=900. H=2*600 + 3*900 = 3900."
  }
};

export const EXAMPLE_QUESTIONS = [RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT];
