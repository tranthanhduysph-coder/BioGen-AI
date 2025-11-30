// KEYS for translation (UI usage)
export const CHAPTERS_KEYS = [
    "grade10_intro",
    "grade10_chemical",
    "grade10_structure",
    "grade10_transport",
    "grade10_metabolism",
    "grade10_cycle",
    "grade10_microbiology",
    "grade10_virus",
    "grade11_water",
    "grade11_photosynthesis",
    "grade11_respiration",
    "grade11_nutrition",
    "grade11_gas",
    "grade11_circulation",
    "grade11_immune",
    "grade11_excretion",
    "grade11_plant_sensing",
    "grade11_animal_sensing",
    "grade11_growth",
    "grade11_reproduction",
    "grade12_molecular",
    "grade12_regulation",
    "grade12_chromosomal",
    "grade12_extranuclear",
    "grade12_mendel",
    "grade12_sex_linked",
    "grade12_population",
    "grade12_human",
    "grade12_evolution",
    "grade12_origin",
    "grade12_community",
    "grade12_biosphere"
];

export const DIFFICULTIES_KEYS = [
    "diff_recall",
    "diff_understand",
    "diff_apply",
    "diff_analyze"
];

export const COMPETENCIES_KEYS = [
    "comp_nt1", "comp_nt2", "comp_nt3", "comp_nt4", "comp_nt5", "comp_nt6", "comp_nt7", "comp_nt8",
    "comp_th1", "comp_th2", "comp_th3", "comp_th4", "comp_th5",
    "comp_vd1", "comp_vd2"
];

export const SETTINGS_KEYS = [
    "setting_theory",
    "setting_experiment",
    "setting_calculation",
    "setting_realworld",
    "setting_data"
];

export const QUESTION_TYPES_KEYS = [
    "type_mixed",
    "type_mcq",
    "type_tf",
    "type_short"
];

// --- DATA FOR LOGIC SERVICES (Simulation, Parsing) ---
// This object mimics the structure needed by examSimulationService.ts
// It maps the Keys back to representational strings or just holds the keys for iteration.
export const CRITERIA_DATA = {
  chapters: CHAPTERS_KEYS,
  difficulties: DIFFICULTIES_KEYS,
  competencies: COMPETENCIES_KEYS
};

export const SETTINGS = SETTINGS_KEYS;
export const QUESTION_TYPES = QUESTION_TYPES_KEYS;

// --- RAG EXAMPLES ---
export const RAG_EXAMPLES = {
  MCQ: {
    "question": "Bào quan nào sau đây là nơi tổng hợp protein?",
    "type": "Multiple choices",
    "options": ["A. Ti thể", "B. Ribosome", "C. Lizosome", "D. Không bào"],
    "answer": "B. Ribosome",
    "explanation": "Ribosome là nơi diễn ra quá trình dịch mã tổng hợp protein."
  },
  TF: {
    "question": "Một nhóm nghiên cứu thực hiện thí nghiệm đánh giá hiệu quả của vaccine X...",
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
    "question": "Một phân tử DNA có 3000 nucleotide...",
    "type": "Short response",
    "options": [],
    "answer": "3900",
    "explanation": "A=600, G=900..."
  }
};

export const EXAMPLE_QUESTIONS = [RAG_EXAMPLES.MCQ, RAG_EXAMPLES.TF, RAG_EXAMPLES.SHORT];
