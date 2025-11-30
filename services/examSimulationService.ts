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
        // Simplified check: In reality, we would map keywords to keys
        // For now, assume keys are descriptive enough or map simple keywords
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

export const simulateExam = async (apiKey: string, userPrompt: string = ""): Promise<GeneratedQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const batchRequests: Criteria[] = [];
  const { matchedChapter, matchedSetting } = inferContextFromPrompt(userPrompt);

  // CẤU TRÚC ĐỀ THI CHUẨN 2025 (18 MC, 4 TF, 6 SR)
  
  // PHẦN I: 18 Câu Trắc nghiệm nhiều lựa chọn (Chia làm 3 batch x 6 câu)
  for (let i = 0; i < 3; i++) {
    batchRequests.push({
      chapter: matchedChapter, // Focus vào chủ đề người dùng yêu cầu (hoặc random)
      difficulty: i === 0 ? "diff_1" : (i === 1 ? "diff_2" : "diff_3"), // Tăng dần độ khó
      competency: "nt1", // Competency tương đối
      setting: matchedSetting,
      questionType: "type_mcq", // Key cho MCQ
      questionCount: 6,
      customPrompt: `${userPrompt} (Part I: Multiple Choice - Batch ${i+1})`
    });
  }

  // PHẦN II: 4 Câu Đúng/Sai (Mỗi câu là 1 chùm 4 ý -> 4 batch x 1 câu chùm)
  for (let i = 0; i < 4; i++) {
     batchRequests.push({
      chapter: matchedChapter,
      difficulty: "diff_4", // Phần này thường khó
      competency: "nt4",
      setting: matchedSetting,
      questionType: "type_tf", // Key cho True/False
      questionCount: 1, // 1 câu chùm
      customPrompt: `${userPrompt} (Part II: True/False Cluster - Question ${i+1})`
    });
  }

  // PHẦN III: 6 Câu Trả lời ngắn (Chia làm 2 batch x 3 câu)
  for (let i = 0; i < 2; i++) {
     batchRequests.push({
      chapter: matchedChapter,
      difficulty: "diff_3",
      competency: "vd1",
      setting: "set_calc", // Thường là tính toán
      questionType: "type_short", // Key cho Short Response
      questionCount: 3,
      customPrompt: `${userPrompt} (Part III: Short Response - Numeric Answers)`
    });
  }

  // Phát hiện ngôn ngữ
  const isEnglish = userPrompt.toLowerCase().includes("english");
  const lang = isEnglish ? 'en' : 'vi';

  // Thực thi song song (có delay nhẹ để tránh rate limit)
  const promises = batchRequests.map(async (criteria, index) => {
    await new Promise(r => setTimeout(r, index * 200)); // Delay 200ms

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
            criteria: { ...criteria } // Gắn metadata để biết câu hỏi thuộc phần nào
        }));

    } catch (error) {
        console.error("Batch generation failed:", error);
        return [];
    }
  });

  const results = await Promise.all(promises);
  const allQuestions = results.flat();

  // Sắp xếp lại theo thứ tự Part I -> Part II -> Part III
  const typeOrder = { "Multiple choices": 1, "True/ False": 2, "Short response": 3 };
  
  return allQuestions.sort((a, b) => {
     // @ts-ignore
     return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
  });
};
