import { GoogleGenAI } from '@google/genai';
import type { GeneratedQuestion, Criteria } from '../types';
import { generatePrompt } from './geminiService';
import { CRITERIA_DATA, SETTINGS } from '../constants';

const inferContextFromPrompt = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    let matchedChapter = "";
    let matchedSetting = "";
    for (const chapter of CRITERIA_DATA.chapters) {
        if (lowerPrompt.includes(chapter.toLowerCase())) { matchedChapter = chapter; break; }
        if (lowerPrompt.includes("tế bào") && chapter.includes("tế bào")) matchedChapter = chapter;
        if (lowerPrompt.includes("vi sinh") && chapter.includes("Vi sinh")) matchedChapter = chapter;
        if (lowerPrompt.includes("di truyền") && !matchedChapter && chapter.includes("Di truyền phân tử")) matchedChapter = chapter; 
        if (lowerPrompt.includes("tiến hóa") && chapter.includes("Tiến hoá")) matchedChapter = chapter;
        if (lowerPrompt.includes("sinh thái") && chapter.includes("Sinh thái") && !matchedChapter) matchedChapter = chapter;
    }
    for (const setting of SETTINGS) {
        if (lowerPrompt.includes(setting.toLowerCase())) { matchedSetting = setting; break; }
    }
    return { matchedChapter, matchedSetting };
};

const getCompetencyForDifficulty = (difficulty: string): string => {
    let pool = CRITERIA_DATA.competencies;
    if (difficulty === "Nhận biết") {
        pool = pool.filter(c => !c.startsWith("TH4") && !c.startsWith("TH5") && !c.startsWith("VD"));
    } else if (difficulty === "Vận dụng" || difficulty === "Vận dụng cao") {
        pool = pool.filter(c => !c.startsWith("NT1"));
    } else {
        pool = pool.filter(c => !c.startsWith("NT1"));
    }
    if (pool.length === 0) return CRITERIA_DATA.competencies[0];
    return pool[Math.floor(Math.random() * pool.length)];
};

// Helper to safely parse JSON
const safeJsonParse = (text: string): any[] => {
    try {
        // Remove markdown if present
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return [];
    }
};

export const simulateExam = async (apiKey: string, userPrompt: string = ""): Promise<GeneratedQuestion[]> => {
  // STATIC MODE: Initialize SDK directly with provided key
  const ai = new GoogleGenAI({ apiKey });
  
  const batchRequests: Criteria[] = [];
  const { matchedChapter, matchedSetting } = inferContextFromPrompt(userPrompt);

  // --- CẤU TRÚC ĐỀ 2025 (28 Câu) ---

  // Part I: 18 câu (Chia 3 batch x 6 câu)
  for (let i = 0; i < 3; i++) {
    const chapterStr = matchedChapter || "Tổng hợp kiến thức Sinh học THPT (Lớp 10, 11, 12)";
    const difficultyStr = i === 0 ? "Nhận biết" : (i === 1 ? "Thông hiểu" : "Vận dụng");
    const randomCompetency = getCompetencyForDifficulty(difficultyStr);
    let finalDifficulty = difficultyStr;
    if (randomCompetency.startsWith("NT1")) finalDifficulty = "Nhận biết";

    batchRequests.push({
      chapter: chapterStr,
      difficulty: finalDifficulty, 
      competency: randomCompetency,
      setting: matchedSetting || "Lý thuyết & Thực nghiệm",
      questionType: "Trắc nghiệm nhiều lựa chọn (Part I)",
      questionCount: 6,
      customPrompt: matchedChapter 
        ? `${userPrompt} Tạo câu hỏi trắc nghiệm tập trung vào ${matchedChapter}.`
        : `${userPrompt} Chọn chủ đề ngẫu nhiên.`
    });
  }
  
  // Part II: 4 câu (Chia 4 batch x 1 câu chùm)
  for (let i = 0; i < 4; i++) {
     const randomSetting = matchedSetting || SETTINGS[Math.floor(Math.random() * SETTINGS.length)];
     const randomChapter = matchedChapter || CRITERIA_DATA.chapters[Math.floor(Math.random() * CRITERIA_DATA.chapters.length)];
     const deepCompetencies = CRITERIA_DATA.competencies.filter(c => !c.startsWith("NT1") && !c.startsWith("NT2"));
     const randomCompetency = deepCompetencies[Math.floor(Math.random() * deepCompetencies.length)] || "NT4: Phân tích...";
     batchRequests.push({
      chapter: randomChapter,
      difficulty: "Vận dụng - Vận dụng cao",
      competency: randomCompetency,
      setting: randomSetting,
      questionType: "Trắc nghiệm Đúng/Sai (Part II)",
      questionCount: 1,
      customPrompt: `${userPrompt} Tạo câu hỏi chùm True/False chuyên sâu về ${randomChapter}.`
    });
  }
  
  // Part III: 6 câu (Chia 2 batch x 3 câu)
  for (let i = 0; i < 2; i++) {
     const chapterStr = matchedChapter || "Tổng hợp (Di truyền, Sinh thái, Chuyển hóa năng lượng)";
     const calcCompetencies = CRITERIA_DATA.competencies.filter(c => c.startsWith("NT4") || c.startsWith("NT6") || c.startsWith("VD"));
     const randomCompetency = calcCompetencies[Math.floor(Math.random() * calcCompetencies.length)] || "NT6: Giải thích được mối quan hệ...";
     batchRequests.push({
      chapter: chapterStr,
      difficulty: "Vận dụng - Vận dụng cao",
      competency: randomCompetency,
      setting: matchedSetting || "Bài tập tính toán",
      questionType: "Trắc nghiệm Trả lời ngắn (Part III)",
      questionCount: 3,
      customPrompt: `${userPrompt} Câu hỏi tính toán hoặc điền số cụ thể.`
    });
  }

  // Detect language intent
  const isEnglish = userPrompt.includes("Generate output completely in English");
  const lang = isEnglish ? 'en' : 'vi';

  // Execute requests
  const promises = batchRequests.map(async (criteria, index) => {
    await new Promise(r => setTimeout(r, index * 300));

    const prompt = generatePrompt(criteria, lang);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });

        // Safe Parsing
        const questions = safeJsonParse(response.text || "");
        
        if (!Array.isArray(questions) || questions.length === 0) {
             console.warn(`Batch ${index} returned empty or invalid JSON.`);
             return []; 
        }

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

  // Sort output to maintain structure: Part I -> Part II -> Part III
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
