export const en = {
  translation: {
    // ... (Giữ nguyên cấu trúc app, header, auth, welcome, results, quiz, history, loading, error)
    app: { name: "BioGen AI", subtitle: "Intelligent Biology Question Generator" },
    header: { history: "History", theme: "Theme", logout: "Sign Out", hello: "Hi", language: "Language" },
    auth: { title: "BioGen AI", subtitle: "Sign in to save data", login_tab: "Sign In", register_tab: "Register", login_btn: "Sign In", register_btn: "Register", demo_mode: "Demo Mode", use_guest: "Guest Mode", no_firebase: "Firebase Error", no_firebase_msg: "API Key missing." },
    welcome: { title: "Welcome to BioGen AI", desc: "Automated Biology quiz generator (2025 Standard).", instruction: "Select options to begin." },
    
    criteria: {
      title: "Exam Configuration",
      tab_auto: "Auto Exam 2025",
      tab_manual: "Manual Config",
      part1: "PART I: Multiple Choice Questions",
      part1_desc: "18 questions (4.5 pts). 1 correct option.",
      part2: "PART II: True/False Questions",
      part2_desc: "4 cluster questions (4.0 pts). 4 statements each.",
      part3: "PART III: Short Response Questions",
      part3_desc: "6 questions (1.5 pts). Numeric answer.",
      select_topics: "Select Topics:",
      selected_count: "{{count}} selected",
      select_all: "Select All",
      clear_all: "Clear",
      start_build: "GENERATE EXAM (28 Qs)",
      
      // Manual labels
      label_chapter: "Topic", label_context: "Context", label_type: "Type", label_difficulty: "Difficulty",
      label_quantity: "Quantity", label_competency: "Competency", label_extra: "Extra",
      add_queue: "Add to Queue", queue_title: "Queue", generate_btn: "Generate Questions", processing: "Processing..."
    },
    results: { title: "Generated Questions", count_suffix: "Qs", start_quiz: "Start Quiz", export_docx: "DOCX", share: "Share", no_data: "No Data" },
    quiz: { title_working: "Quiz Mode", title_result: "Results", exit: "Exit", submit: "Submit", save: "Save", saved_success: "Saved!", score: "Score", save_pdf: "PDF", summary_title: "Summary", total_score: "Total Score" },
    history: { title: "History", exams_count: "Exams", avg_score: "Avg", max_score: "Max", list_title: "Details", empty: "Empty" },
    loading: { title: "Thinking...", subtitle: "Generating..." },
    error: { title: "Error", reload: "Reload" },

    constants: {
        chapters: {
            g10_intro: "Grade 10: Intro & Organization", g10_chemical: "Grade 10: Chemical Composition",
            g10_structure: "Grade 10: Cell Structure", g10_transport: "Grade 10: Membrane Transport",
            g10_metabolism: "Grade 10: Metabolism", g10_cycle: "Grade 10: Cell Cycle",
            g10_microbio: "Grade 10: Microbiology", g10_virus: "Grade 10: Viruses",
            g11_water: "Grade 11: Plant Water", g11_photo: "Grade 11: Photosynthesis",
            g11_respiration: "Grade 11: Plant Respiration", g11_nutri_animal: "Grade 11: Animal Nutrition",
            g11_resp_animal: "Grade 11: Animal Respiration", g11_circ: "Grade 11: Circulation",
            g11_immune: "Grade 11: Immunity", g11_excrete: "Grade 11: Excretion",
            g11_sense_plant: "Grade 11: Plant Sensing", g11_sense_animal: "Grade 11: Animal Sensing",
            g11_growth: "Grade 11: Growth", g11_repro: "Grade 11: Reproduction",
            g12_mol_gen: "Grade 12: Molecular Genetics", g12_gene_reg: "Grade 12: Gene Regulation",
            g12_chrom_gen: "Grade 12: Chromosomal Genetics", g12_extra_gen: "Grade 12: Extranuclear",
            g12_mendel: "Grade 12: Mendel Laws", g12_sex_linked: "Grade 12: Sex-linked",
            g12_pop_gen: "Grade 12: Population Genetics", g12_human: "Grade 12: Human Genetics",
            g12_evolution: "Grade 12: Evolution", g12_origin: "Grade 12: Origin of Life",
            g12_comm_eco: "Grade 12: Ecology", g12_biosphere: "Grade 12: Biosphere"
        },
        difficulties: { diff_1: "Recall", diff_2: "Understand", diff_3: "Apply", diff_4: "Analyze" },
        competencies: {
            nt1: "NT1: Identify/List", nt2: "NT2: Describe", nt3: "NT3: Classify", nt4: "NT4: Analyze",
            nt5: "NT5: Compare", nt6: "NT6: Explain", nt7: "NT7: Critical Thinking", nt8: "NT8: Terminology",
            th1: "TH1: Problem", th2: "TH2: Hypothesis", th3: "TH3: Plan", th4: "TH4: Execute", th5: "TH5: Report",
            vd1: "VD1: Practice", vd2: "VD2: Environment"
        },
        settings: { set_theory: "Theory", set_exp: "Experiment", set_calc: "Calculation", set_real: "Real-world", set_data: "Data" },
        types: { type_mixed: "Mixed", type_mcq: "MCQ (Part I)", type_tf: "True/False (Part II)", type_short: "Short Response (Part III)" }
    }
  }
};
