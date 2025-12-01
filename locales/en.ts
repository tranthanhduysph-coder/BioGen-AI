export const en = {
  translation: {
    app: { name: "BioGen AI", subtitle: "Intelligent Biology Question Generator" },
    header: { history: "History", theme: "Theme", logout: "Sign Out", hello: "Hi", language: "Language" },
    auth: {
      title: "BioGen AI", subtitle: "Sign in to save data", login_tab: "Sign In", register_tab: "Register", login_btn: "Sign In", register_btn: "Register", demo_mode: "Demo Mode", quick_experience: "Quick look?", use_guest: "Guest Mode", no_firebase: "Error", no_firebase_msg: "No API Key."
    },
    welcome: { title: "Welcome", desc: "Automated Biology Exam Generator.", instruction: "Select options to begin." },
    
    criteria: {
      title: "Exam Configuration",
      tab_auto: "Auto Exam 2025",
      tab_manual: "Manual Config",
      part1: "PART I: 18 MCQs",
      part1_desc: "Single choice (4.5 pts)",
      part2: "PART II: 4 True/False",
      part2_desc: "Cluster questions (4.0 pts)",
      part3: "PART III: 6 Short Ans",
      part3_desc: "Numeric answers (1.5 pts)",
      select_topics: "Select Topics:",
      selected_count: "{{count}} selected",
      select_all: "Select All",
      clear_all: "Clear",
      start_build: "GENERATE EXAM",
      
      // Manual labels
      label_chapter: "Topic", label_context: "Context", label_type: "Type", label_difficulty: "Difficulty",
      label_quantity: "Quantity", label_competency: "Competency", label_extra: "Extra",
      add_queue: "Add to Queue", queue_title: "Queue", generate_btn: "Generate Questions", 
      
      // Fixed missing keys
      quick_exam_title: "Auto Generate Exam (2025 Format)",
      quick_exam_desc: "Automatically generate a full exam with 28 questions (18 MCQ, 4 T/F, 6 Short) following the standard matrix.",
      quick_exam_placeholder: "E.g. Focus on Human Genetics, high difficulty...",
      quick_exam_btn: "Generate Exam Now",
      generating: "Generating...",
      manual_opt: "OR Manual Configuration",
      processing: "Processing..."
    },
    results: { title: "Questions", count_suffix: "Qs", start_quiz: "Start Quiz", export_docx: "DOCX", share: "Share", no_data: "No Data" },
    quiz: { title_working: "Quiz", title_result: "Results", exit: "Exit", submit: "Submit", save: "Save", saved_success: "Saved!", score: "Score", save_pdf: "PDF", summary_title: "Summary", total_score: "Total", scale_10: "Scale 10", correct_qs: "Correct", mcq_short: "MCQ+Short", correct_sub: "Items", in_tf: "In T/F", q_label: "Q", your_answer: "You:", your_input: "Input:", correct_answer: "Key:", explanation: "Expl:", explanation_short: "Expl:", no_explanation: "None.", placeholder_short: "Number...", label_short_yours: "Ans", text_short_empty: "Empty", hide_ans: "Hide", show_ans: "Show" },
    history: { title: "History", exams_count: "Exams", avg_score: "Avg", max_score: "Max", list_title: "List", empty: "Empty" },
    loading: { title: "Thinking...", subtitle: "Analyzing..." },
    error: { title: "Error", reload: "Reload" },

    constants: {
        chapters: {
            g10_intro: "G10: Intro & Levels", g10_cell_chem: "G10: Chemical Comp",
            g10_cell_struct: "G10: Cell Structure", g10_cell_transport: "G10: Transport & Signaling",
            g10_cell_energy: "G10: Metabolism", g10_cell_info: "G10: Cell Comm",
            g10_cell_cycle: "G10: Cell Cycle", g10_microbio_vir: "G10: Microbio & Virus",
            g11_metabolism_plant: "G11: Plant Metabolism", g11_metabolism_animal: "G11: Animal Metabolism",
            g11_sensing: "G11: Sensing", g11_growth: "G11: Growth", g11_repro: "G11: Reproduction",
            g12_genetics_mol: "G12: Molecular Genetics", g12_genetics_chrom: "G12: Chromosomal Genetics",
            g12_genetics_human: "G12: Human Genetics", g12_genetics_pop: "G12: Population Genetics",
            g12_genetics_app: "G12: Genetic Apps", g12_evolution: "G12: Evolution",
            g12_ecology_env: "G12: Environment", g12_ecology_pop: "G12: Pop Ecology",
            g12_ecology_comm: "G12: Community", g12_ecosystem: "G12: Ecosystem"
        },
        difficulties: { diff_1: "Recall", diff_2: "Understand", diff_3: "Apply", diff_4: "Analyze" },
        
        // ACCURATE COMPETENCY TRANSLATIONS (2018 Curriculum Equivalent)
        competencies: {
            nt1: "NT1: Recognize, list, state concepts/processes.",
            nt2: "NT2: Describe characteristics, roles, mechanisms.",
            nt3: "NT3: Classify objects/phenomena.",
            nt4: "NT4: Analyze features, structures, processes.",
            nt5: "NT5: Compare/Select based on criteria.",
            nt6: "NT6: Explain relationships (Cause-Effect, Structure-Function).",
            nt7: "NT7: Identify errors; Critical thinking.",
            nt8: "NT8: Use terminology; Logical connection.",
            th1: "TH1: Propose research problems/questions.",
            th2: "TH2: Formulate hypotheses.",
            th3: "TH3: Plan research/experiments.",
            th4: "TH4: Execute plan (data collection/processing).",
            th5: "TH5: Report and discuss results.",
            vd1: "VD1: Explain practical phenomena.",
            vd2: "VD2: Demonstrate appropriate behavior (Health/Environment)."
        },
        settings: { set_theory: "Theory", set_exp: "Exp", set_calc: "Calc", set_real: "Real", set_data: "Data" },
        types: { type_mixed: "Mixed", type_mcq: "MCQ", type_tf: "T/F", type_short: "Short" }
    }
  }
};
