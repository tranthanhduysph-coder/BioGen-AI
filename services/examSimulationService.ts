
import { GoogleGenAI } from '@google/genai';
import type { GeneratedQuestion, Criteria } from '../types';
import { generatePrompt } from './geminiService';
import { EXAM_BLUEPRINT_2025, CRITERIA_DATA, SETTINGS } from '../constants';

// Helper to extract specific intent from user prompt
const inferContextFromPrompt = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    let matchedChapter = "";
    let matchedSetting = "";

    // 1. Try to match a specific chapter
    for (const chapter of CRITERIA_DATA.chapters) {
        // Check for exact chapter name match or strong keywords
        if (lowerPrompt.includes(chapter.toLowerCase())) {
            matchedChapter = chapter;
            break; 
        }
        
        // Heuristics for common keywords if full chapter name isn't typed
        if (lowerPrompt.includes("tế bào") && chapter.includes("tế bào")) matchedChapter = chapter;
        if (lowerPrompt.includes("vi sinh") && chapter.includes("Vi sinh")) matchedChapter = chapter;
        if (lowerPrompt.includes("di truyền") && !matchedChapter) { 
            // Default to Molecular Genetics if just "Genetics" is said, or let it be specific if found later
             if (chapter.includes("Di truyền phân tử")) matchedChapter = chapter; 
        }
        if (lowerPrompt.includes("tiến hóa") && chapter.includes("Tiến hoá")) matchedChapter = chapter;
        if (lowerPrompt.includes("sinh thái") && chapter.includes("Sinh thái") && !matchedChapter) matchedChapter = chapter;
    }

    // 2. Try to match a setting
    for (const setting of SETTINGS) {
        if (lowerPrompt.includes(setting.toLowerCase())) {
            matchedSetting = setting;
            break;
        }
    }

    return { matchedChapter, matchedSetting };
};

// Helper to select competency based on Difficulty Constraint
const getCompetencyForDifficulty = (difficulty: string): string => {
    let pool = CRITERIA_DATA.competencies;

    if (difficulty === "Nhận biết") {
        // For Easy questions, prefer NT1, NT2, NT3. 
        // STRICTLY EXCLUDE TH4, TH5, VD1, VD2
        pool = pool.filter(c => !c.startsWith("TH4") && !c.startsWith("TH5") && !c.startsWith("VD"));
    } else if (difficulty === "Vận dụng" || difficulty === "Vận dụng cao") {
        // For Hard questions, EXCLUDE NT1
        pool = pool.filter(c => !c.startsWith("NT1"));
        // Prefer Analysis/Application
    } else {
        // For "Thông hiểu", exclude NT1 (usually too easy) and maybe very high VD
        pool = pool.filter(c => !c.startsWith("NT1"));
    }
    
    if (pool.length === 0) return CRITERIA_DATA.competencies[0]; // Fallback
    return pool[Math.floor(Math.random() * pool.length)];
};

export const simulateExam = async (apiKey: string, userPrompt: string = ""): Promise<GeneratedQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const batchRequests: Criteria[] = [];
  
  // Analyze user prompt for overrides
  const { matchedChapter, matchedSetting } = inferContextFromPrompt(userPrompt);

  // --- PART I: Multiple Choice (18 questions) ---
  // Strategy: Split into 3 batches of 6 questions to ensure variety and avoid token limits.
  for (let i = 0; i < 3; i++) {
    // If user specified a chapter, use it. Otherwise, use "Tổng hợp" or "General".
    const chapterStr = matchedChapter || "Tổng hợp kiến thức Sinh học THPT (Lớp 10, 11, 12)";
    
    // Random difficulty for this batch based on the blueprint flow (early questions easier)
    const difficultyStr = i === 0 ? "Nhận biết" : (i === 1 ? "Thông hiểu" : "Vận dụng");

    // Pick a competency suitable for the difficulty
    const randomCompetency = getCompetencyForDifficulty(difficultyStr);
    
    // SAFETY OVERRIDE: If we somehow picked NT1, force difficulty to "Nhận biết"
    let finalDifficulty = difficultyStr;
    if (randomCompetency.startsWith("NT1")) {
        finalDifficulty = "Nhận biết";
    }

    batchRequests.push({
      chapter: chapterStr,
      difficulty: finalDifficulty, 
      competency: randomCompetency,
      setting: matchedSetting || "Lý thuyết & Thực nghiệm",
      questionType: "Trắc nghiệm nhiều lựa chọn (Part I)",
      questionCount: 6,
      customPrompt: matchedChapter 
        ? `${userPrompt} Tạo câu hỏi trắc nghiệm 4 lựa chọn tập trung sâu vào chương ${matchedChapter}.`
        : `${userPrompt} Hãy chọn ngẫu nhiên các chủ đề khác nhau cho 6 câu hỏi này (Tế bào, Di truyền, Tiến hóa, Sinh thái...). Đừng trùng lặp chủ đề.`
    });
  }

  // --- PART II: True/False (4 questions) ---
  // Strategy: 4 separate batches of 1 question each.
  for (let i = 0; i < 4; i++) {
     // Pick a random setting if not forced by user
     const randomSetting = matchedSetting || SETTINGS[Math.floor(Math.random() * SETTINGS.length)];
     // Pick a random core chapter if not forced by user
     const randomChapter = matchedChapter || CRITERIA_DATA.chapters[Math.floor(Math.random() * CRITERIA_DATA.chapters.length)];
     
     // True/False requires deep understanding (NT3+), definitely NO NT1
     const deepCompetencies = CRITERIA_DATA.competencies.filter(c => !c.startsWith("NT1") && !c.startsWith("NT2"));
     const randomCompetency = deepCompetencies[Math.floor(Math.random() * deepCompetencies.length)] || "NT4: Phân tích...";

     batchRequests.push({
      chapter: randomChapter,
      difficulty: "Vận dụng - Vận dụng cao",
      competency: randomCompetency,
      setting: randomSetting,
      questionType: "Trắc nghiệm Đúng/Sai (Part II)",
      questionCount: 1,
      customPrompt: `${userPrompt} Tạo một câu hỏi chùm True/False chuyên sâu về ${randomChapter}.`
    });
  }

  // --- PART III: Short Response (6 questions) ---
  // Strategy: 2 batches of 3 questions.
  for (let i = 0; i < 2; i++) {
     const chapterStr = matchedChapter || "Tổng hợp (Di truyền, Sinh thái, Chuyển hóa năng lượng)";
     
     // Short Response usually involves Calculation (VD1) or Analysis (NT4, NT6)
     const calcCompetencies = CRITERIA_DATA.competencies.filter(c => c.startsWith("NT4") || c.startsWith("NT6") || c.startsWith("VD"));
     const randomCompetency = calcCompetencies[Math.floor(Math.random() * calcCompetencies.length)] || "NT6: Giải thích được mối quan hệ...";

     batchRequests.push({
      chapter: chapterStr,
      difficulty: "Vận dụng - Vận dụng cao",
      competency: randomCompetency,
      setting: matchedSetting || "Bài tập tính toán",
      questionType: "Trắc nghiệm Trả lời ngắn (Part III)",
      questionCount: 3,
      customPrompt: `${userPrompt} Tạo câu hỏi yêu cầu tính toán hoặc điền số cụ thể (Gene, NST, Năng lượng...).`
    });
  }

  // --- EXECUTE REQUESTS ---
  const promises = batchRequests.map(async (criteria, index) => {
    // Stagger requests slightly to be gentle on rate limits
    await new Promise(r => setTimeout(r, index * 300));

    const prompt = generatePrompt(criteria);
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

        // Tag questions with metadata for the Matrix Table
        return questions.map(q => ({ 
            ...q, 
            criteria: {
                ...criteria,
                // Ensure the Matrix table shows the specific chapter if inferred, otherwise what was used
                chapter: criteria.chapter
            } 
        }));

    } catch (error) {
        console.error("Batch generation failed:", error);
        return [];
    }
  });

  const results = await Promise.all(promises);
  const allQuestions = results.flat();

  // Sort strictly by Type for the final exam output: Part I -> Part II -> Part III
  const orderMap: Record<string, number> = {
      "Trắc nghiệm nhiều lựa chọn (Part I)": 1,
      "Trắc nghiệm Đúng/Sai (Part II)": 2,
      "Trắc nghiệm Trả lời ngắn (Part III)": 3
  };

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
