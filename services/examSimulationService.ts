import { GoogleGenAI } from '@google/genai';
import type { GeneratedQuestion, Criteria } from '../types';
import { generatePrompt } from './geminiService';
import { CRITERIA_DATA, SETTINGS } from '../constants';

// Logic suy luận chủ đề từ prompt người dùng
const inferContextFromPrompt = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    let matchedChapter = "";
    let matchedSetting = "";

    // Tìm chủ đề khớp
    for (const chapterKey of CRITERIA_DATA.chapters) {
        if (lowerPrompt.includes("tế bào") && chapterKey.includes("cell")) matchedChapter = chapterKey;
        else if (lowerPrompt.includes("di truyền") && chapterKey.includes("genetics")) matchedChapter = chapterKey;
        // ... (Add more mappings as needed)
    }
    
    // Fallback to a random chapter if none found
    if (!matchedChapter) {
        matchedChapter = CRITERIA_DATA.chapters[Math.floor(Math.random() * CRITERIA_DATA.chapters.length)];
    }

    matchedSetting = SETTINGS[0]; // Default setting
    return { matchedChapter, matchedSetting };
};

// Helper to safely parse JSON
const safeJsonParse = (text: string): any[] => {
    try {
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error in Simulation:", e);
        return [];
    }
};

export const simulateExam = async (apiKey: string, userPrompt: string = ""): Promise<GeneratedQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const batchRequests: Criteria[] = [];
  const { matchedChapter, matchedSetting } = inferContextFromPrompt(userPrompt);

  // --- CẤU TRÚC ĐỀ CHUẨN 2025 (28 Câu) ---
  // Chiến thuật: Gửi các yêu cầu RẤT CỤ THỂ cho từng phần để tránh AI bị lẫn lộn.

  // PHẦN I: 18 Câu Trắc nghiệm nhiều lựa chọn (3 Batch x 6 câu)
  for (let i = 0; i < 3; i++) {
    batchRequests.push({
      chapter: matchedChapter,
      difficulty: i === 0 ? "diff_1" : (i === 1 ? "diff_2" : "diff_3"),
      competency: "nt1",
      setting: matchedSetting,
      questionType: "type_mcq", // Explicit MCQ
      questionCount: 6,
      customPrompt: `${userPrompt} (GENERATE ONLY 6 MULTIPLE CHOICE QUESTIONS. 4 OPTIONS A,B,C,D. ONE CORRECT ANSWER.)`
    });
  }

  // PHẦN II: 4 Câu Đúng/Sai (4 Batch x 1 câu chùm)
  // Lưu ý: Mỗi câu Đ/S là một chùm 4 ý, nên ta yêu cầu 1 câu "lớn".
  for (let i = 0; i < 4; i++) {
     batchRequests.push({
      chapter: matchedChapter,
      difficulty: "diff_4",
      competency: "nt4",
      setting: matchedSetting,
      questionType: "type_tf", // Explicit True/False
      questionCount: 1,
      customPrompt: `${userPrompt} (GENERATE ONLY 1 TRUE/FALSE QUESTION. MUST HAVE CONTEXT STEM AND EXACTLY 4 STATEMENTS a,b,c,d.)`
    });
  }

  // PHẦN III: 6 Câu Trả lời ngắn (2 Batch x 3 câu)
  for (let i = 0; i < 2; i++) {
     batchRequests.push({
      chapter: matchedChapter,
      difficulty: "diff_3",
      competency: "vd1",
      setting: "set_calc",
      questionType: "type_short", // Explicit Short Response
      questionCount: 3,
      customPrompt: `${userPrompt} (GENERATE ONLY 3 SHORT RESPONSE QUESTIONS. ANSWER MUST BE A NUMBER. NO TEXT EXPLANATION IN ANSWER FIELD.)`
    });
  }

  // Detect Language
  const isEnglish = userPrompt.toLowerCase().includes("english");
  const lang = isEnglish ? 'en' : 'vi';

  // Execute requests
  const promises = batchRequests.map(async (criteria, index) => {
    await new Promise(r => setTimeout(r, index * 300)); // Stagger requests

    const prompt = generatePrompt(criteria, lang);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                temperature: 0.7 // Reduce creativity to strictly follow format
            },
        });

        const questions = safeJsonParse(response.text || "");
        
        if (!Array.isArray(questions) || questions.length === 0) {
             console.warn(`Batch ${index} returned invalid data.`);
             return []; 
        }

        // Validate and Filter based on requested type to prevent hallucination leakage
        const filteredQuestions = questions.filter(q => {
            if (criteria.questionType === "type_mcq" && q.type === "Multiple choices") return true;
            if (criteria.questionType === "type_tf" && q.type === "True/ False") return true;
            if (criteria.questionType === "type_short" && q.type === "Short response") return true;
            return false; // Discard wrong types
        });

        return filteredQuestions.map(q => ({ 
            ...q, 
            criteria: { ...criteria } 
        }));

    } catch (error) {
        console.error("Batch generation failed:", error);
        return [];
    }
  });

  const results = await Promise.all(promises);
  const allQuestions = results.flat();

  // Final Sort: Part I -> Part II -> Part III
  const typeOrder = { "Multiple choices": 1, "True/ False": 2, "Short response": 3 };
  
  return allQuestions.sort((a, b) => {
     // @ts-ignore
     return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
  });
};
