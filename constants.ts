// KEYS for translation lookup
export const CHAPTERS_KEYS = [
    "g10_intro", "g10_chemical", "g10_structure", "g10_transport", "g10_metabolism", "g10_cycle", "g10_microbio", "g10_virus",
    "g11_water", "g11_photo", "g11_resp_plant", "g11_nutri_animal", "g11_resp_animal", "g11_circ", "g11_immune", "g11_excrete", "g11_sense_plant", "g11_sense_animal", "g11_growth", "g11_repro",
    "g12_mol_gen", "g12_gene_reg", "g12_chrom_gen", "g12_extra_gen", "g12_mendel", "g12_sex_linked", "g12_pop_gen", "g12_human", "g12_evolution", "g12_origin", "g12_comm_eco", "g12_biosphere"
];

export const DIFFICULTIES_KEYS = ["diff_1", "diff_2", "diff_3", "diff_4"];

// Năng lực cốt lõi chuẩn 2018
export const COMPETENCIES_KEYS = [
    "nt1", "nt2", "nt3", "nt4", "nt5", "nt6", "nt7", "nt8",
    "th1", "th2", "th3", "th4", "th5",
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

// RAG EXAMPLES (Giữ nguyên mẫu chuẩn)
export const RAG_EXAMPLES = {
  MCQ: {
    "question": "Bào quan nào sau đây là nơi tổng hợp protein?",
    "type": "Multiple choices",
    "options": ["A. Ti thể", "B. Ribosome", "C. Lizosome", "D. Không bào"],
    "answer": "B. Ribosome",
    "explanation": "Ribosome là nơi diễn ra quá trình dịch mã tổng hợp protein."
  },
  TF: {
    "question": "Một nhóm nghiên cứu thực hiện thí nghiệm đánh giá hiệu quả của vaccine X. Dựa vào biểu đồ (giả định), hãy đánh giá các phát biểu sau:",
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
    "question": "Một phân tử DNA có 3000 nucleotide, A=20%. Tính số liên kết Hydrogen. (Điền số)",
    "type": "Short response",
    "options": [],
    "answer": "3900", 
    "explanation": "A=600, G=900. H=2*600 + 3*900 = 3900."
  }
};

export const EXAMPLE_QUESTIONS = [RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT];
