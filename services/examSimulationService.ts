import { GoogleGenAI } from '@google/genai';
import type { GeneratedQuestion, Criteria } from '../types';
import { generatePrompt } from './geminiService';
import { CRITERIA_DATA, SETTINGS } from '../constants';

// Logic suy luận chủ đề từ prompt người dùng
const inferContextFromPrompt = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    let matchedChapter = "";
    
    // Nếu người dùng có nhập prompt, thử tìm xem họ muốn chủ đề gì
    if (prompt.trim()) {
        for (const chapterKey of CRITERIA_DATA.chapters) {
             // Tìm kiếm từ khóa đơn giản trong tên chương
             // Ví dụ: "Di truyền" sẽ khớp với "Di truyền phân tử", "Di truyền quần thể"...
             // Lấy chương đầu tiên khớp làm chủ đề chính
             const keywords = chapterKey.toLowerCase().split(/[:()-]/); 
             if (keywords.some(k => k.trim() && lowerPrompt.includes(k.trim()))) {
                 matchedChapter = chapterKey;
                 break;
             }
        }
    }

    // Nếu không tìm thấy hoặc không nhập, trả về rỗng để logic sau tự random
    return matchedChapter;
};

export const simulateExam = async (apiKey: string, userPrompt: string = ""): Promise<GeneratedQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const batchRequests: Criteria[] = [];
  
  // Xác định chủ đề chính (nếu người dùng yêu cầu cụ thể)
  const forcedChapter = inferContextFromPrompt(userPrompt);
  
  // Hàm lấy chủ đề: Nếu user ép buộc -> dùng nó. Nếu không -> Random để đa dạng
  const getChapter = () => forcedChapter || CRITERIA_DATA.chapters[Math.floor(Math.random() * CRITERIA_DATA.chapters.length)];
  const getSetting = () => SETTINGS[Math.floor(Math.random() * SETTINGS.length)];

  // --- CẤU TRÚC ĐỀ CHUẨN 2025 (28 Câu) ---

  // PHẦN I: 18 Câu Trắc nghiệm nhiều lựa chọn (3 Batch x 6 câu)
  for (let i = 0; i < 3; i++) {
    batchRequests.push({
      chapter: getChapter(), 
      difficulty: i === 0 ? "Nhận biết" : (i === 1 ? "Thông hiểu" : "Vận dụng"), // Tăng dần độ khó
      competency: "NT1", // Competency tương đối
      setting: getSetting(),
      questionType: "Trắc nghiệm nhiều lựa chọn (Part I)", 
      questionCount: 6,
      customPrompt: userPrompt 
        ? `${userPrompt} (Part I: Multiple Choice - Batch ${i+1})`
        : `Đa dạng hóa chủ đề cho 6 câu trắc nghiệm này.`
    });
  }

  // PHẦN II: 4 Câu Đúng/Sai (4 Batch x 1 câu chùm)
  // Mỗi câu Đ/S là một chùm 4 ý, nên ta tách riêng từng request để AI tập trung
  for (let i = 0; i < 4; i++) {
     batchRequests.push({
      chapter: getChapter(),
      difficulty: "Vận dụng cao", // Phần này thường khó
      competency: "NT4",
      setting: getSetting(),
      questionType: "Trắc nghiệm Đúng/Sai (Part II)", 
      questionCount: 1, // 1 câu chùm 4 ý
      customPrompt: userPrompt 
        ? `${userPrompt} (Part II: True/False Cluster - Question ${i+1})`
        : `Tạo 1 câu hỏi chùm Đúng/Sai về chủ đề này.`
    });
  }

  // PHẦN III: 6 Câu Trả lời ngắn (2 Batch x 3 câu)
  for (let i = 0; i < 2; i++) {
     batchRequests.push({
      chapter: getChapter(),
      difficulty: "Vận dụng",
      competency: "VD1",
      setting: "Bài tập tính toán", // Ưu tiên tính toán cho phần này
      questionType: "Trắc nghiệm Trả lời ngắn (Part III)", 
      questionCount: 3,
      customPrompt: userPrompt 
        ? `${userPrompt} (Part III: Short Response)`
        : `Tạo câu hỏi tính toán sinh học, điền số.`
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

  // Sort output to maintain structure: Part I -> Part II -> Part III
  const typeOrder = { 
      "Multiple choices": 1, 
      "True/ False": 2, 
      "Short response": 3 
  };
  
  return allQuestions.sort((a, b) => {
     // @ts-ignore
     return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
  });
};
