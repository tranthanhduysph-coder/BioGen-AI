import { GoogleGenAI } from '@google/genai';
import type { GeneratedQuestion, Criteria } from '../types';
import { generatePrompt } from './geminiService';
import { CRITERIA_DATA, SETTINGS } from '../constants';

// Keyword mapping to identifying chapters from user prompt
const CHAPTER_KEYWORDS: Record<string, string> = {
    "tế bào": "grade10_structure",
    "cell": "grade10_structure",
    "vi sinh": "grade10_microbiology",
    "microbio": "grade10_microbiology",
    "di truyền": "grade12_molecular",
    "genetics": "grade12_molecular",
    "tiến hóa": "grade12_evolution",
    "evolution": "grade12_evolution",
    "sinh thái": "grade12_community",
    "ecology": "grade12_community",
    "thực vật": "grade11_photosynthesis",
    "plant": "grade11_photosynthesis",
    "động vật": "grade11_nutrition",
    "animal": "grade11_nutrition"
};

const inferContextFromPrompt = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    let matchedChapter = "";
    let matchedSetting = "";

    // 1. Match Keyword to Chapter Key
    for (const [keyword, chapterKey] of Object.entries(CHAPTER_KEYWORDS)) {
        if (lowerPrompt.includes(keyword)) {
            matchedChapter = chapterKey;
            break;
        }
    }

    // 2. Default setting if not found
    matchedSetting = SETTINGS[0]; // Default to theory

    return { matchedChapter, matchedSetting };
};

const getCompetencyForDifficulty = (difficultyKey: string): string => {
    let pool = CRITERIA_DATA.competencies;

    if (difficultyKey === "diff_recall") { // Nhận biết
        // Filter out High level competencies (TH, VD)
        pool = pool.filter(c => c.startsWith("comp_nt") && !["comp_nt6", "comp_nt7"].includes(c));
    } else if (difficultyKey === "diff_analyze") { // Vận dụng cao
        pool = pool.filter(c => c.startsWith("comp_vd") || c.startsWith("comp_th"));
    }
    
    if (pool.length === 0) return CRITERIA_DATA.competencies[0];
    return pool[Math.floor(Math.random() * pool.length)];
};

export const simulateExam = async (apiKey: string, userPrompt: string = ""): Promise<GeneratedQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const batchRequests: Criteria[] = [];
  const { matchedChapter, matchedSetting } = inferContextFromPrompt(userPrompt);

  // Part I: 3 batches (Multiple Choice)
  for (let i = 0; i < 3; i++) {
    // Default chapter key if none matched
    const chapterKey = matchedChapter || "grade12_molecular"; 
    
    const difficultyKey = i === 0 ? "diff_recall" : (i === 1 ? "diff_understand" : "diff_apply");
    const randomCompetency = getCompetencyForDifficulty(difficultyKey);

    batchRequests.push({
      chapter: chapterKey,
      difficulty: difficultyKey,
      competency: randomCompetency,
      setting: matchedSetting,
      questionType: "type_mcq",
      questionCount: 6,
      customPrompt: matchedChapter 
        ? `${userPrompt}` 
        : `${userPrompt} General biology knowledge.`
    });
  }

  // Part II: 4 batches (True/False)
  for (let i = 0; i < 4; i++) {
     const chapterKey = matchedChapter || CRITERIA_DATA.chapters[Math.floor(Math.random() * CRITERIA_DATA.chapters.length)];
     const difficultyKey = "diff_analyze";
     const randomCompetency = "comp_nt6"; // Analysis

     batchRequests.push({
      chapter: chapterKey,
      difficulty: difficultyKey,
      competency: randomCompetency,
      setting: matchedSetting,
      questionType: "type_tf",
      questionCount: 1,
      customPrompt: `${userPrompt}`
    });
  }

  // Part III: 2 batches (Short Response)
  for (let i = 0; i < 2; i++) {
     const chapterKey = matchedChapter || "grade12_population"; // Good for math problems
     const difficultyKey = "diff_analyze";
     const randomCompetency = "comp_vd1"; // Application

     batchRequests.push({
      chapter: chapterKey,
      difficulty: difficultyKey,
      competency: randomCompetency,
      setting: "setting_calculation",
      questionType: "type_short",
      questionCount: 3,
      customPrompt: `${userPrompt}`
    });
  }

  // Detect language intent
  const isEnglish = userPrompt.toLowerCase().includes("english");
  const lang = isEnglish ? 'en' : 'vi';

  const promises = batchRequests.map(async (criteria, index) => {
    await new Promise(r => setTimeout(r, index * 300));

    const prompt = generatePrompt(criteria, lang);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });

        const jsonText = response.text?.replace(/```json|```/g, '').trim();
        if (!jsonText) return [];
        
        const questions = JSON.parse(jsonText) as GeneratedQuestion[];
        if (!Array.isArray(questions)) return [];

        return questions.map(q => ({ 
            ...q, 
            criteria: { ...criteria, chapter: criteria.chapter } 
        }));

    } catch (error) {
        console.error("Batch generation failed:", error);
        return [];
    }
  });

  const results = await Promise.all(promises);
  const allQuestions = results.flat();

  return allQuestions.sort((a, b) => {
     const getOrder = (q: GeneratedQuestion) => {
         if (q.type === "Multiple choices") return 1;
         if (q.type === "True/ False") return 2;
         if (q.type === "Short response") return 3;
         return 4;
     };
     return getOrder(a) - getOrder(b);
  });
};
