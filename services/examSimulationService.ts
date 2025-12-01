import { GoogleGenAI } from '@google/genai';
import type { GeneratedQuestion, Criteria } from '../types';
import { generatePrompt } from './geminiService';
import { SETTINGS } from '../constants';

const safeJsonParse = (text: string): any[] => {
    try {
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return [];
    }
};

// Helper to pick random topics from the user's selection for a specific batch
const pickRandomTopics = (sourceList: string[], count: number = 2): string[] => {
    if (!sourceList || sourceList.length === 0) return [];
    const shuffled = [...sourceList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

export const simulateExam = async (apiKey: string, config: any, lang: string = 'vi'): Promise<GeneratedQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const batchRequests: any[] = []; // Stores { criteria, specificTopics }

  const { p1_topics, p2_topics, p3_topics } = config;

  // --- PART I: 18 MCQ (3 Batches x 6) ---
  for (let i = 0; i < 3; i++) {
    // Pick diverse topics for each batch from the user's selection
    const batchTopics = pickRandomTopics(p1_topics, 3); 
    
    batchRequests.push({
      criteria: {
        questionType: "type_mcq",
        questionCount: 6,
        difficulty: i === 0 ? "diff_1" : (i === 1 ? "diff_2" : "diff_3"), // Tăng độ khó
        competency: "nt1",
        setting: SETTINGS[0], // Theory
        chapter: "mixed", // Placeholder, used topics instead
        customPrompt: ""
      },
      specificTopics: batchTopics
    });
  }

  // --- PART II: 4 TF (4 Batches x 1) ---
  // Mỗi câu chùm nên tập trung vào 1 chủ đề cụ thể
  for (let i = 0; i < 4; i++) {
     const singleTopic = pickRandomTopics(p2_topics, 1);
     batchRequests.push({
      criteria: {
        questionType: "type_tf",
        questionCount: 1,
        difficulty: "diff_4",
        competency: "nt4",
        setting: "set_exp", // Experiment context
        chapter: "mixed",
        customPrompt: ""
      },
      specificTopics: singleTopic
    });
  }

  // --- PART III: 6 Short (2 Batches x 3) ---
  for (let i = 0; i < 2; i++) {
     const batchTopics = pickRandomTopics(p3_topics, 2);
     batchRequests.push({
      criteria: {
        questionType: "type_short",
        questionCount: 3,
        difficulty: "diff_3",
        competency: "vd1",
        setting: "set_calc", // Calculation
        chapter: "mixed",
        customPrompt: ""
      },
      specificTopics: batchTopics
    });
  }

  // EXECUTE
  const promises = batchRequests.map(async (req, index) => {
    await new Promise(r => setTimeout(r, index * 300));

    // Pass the specific topics list to the prompt generator
    const prompt = generatePrompt(req.criteria, lang, req.specificTopics);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });

        const questions = safeJsonParse(response.text || "");
        if (!Array.isArray(questions)) return [];

        return questions.map(q => ({ 
            ...q, 
            criteria: { 
                ...req.criteria,
                chapter: req.specificTopics.join(", ") // Store used topics in metadata
            } 
        }));

    } catch (error) {
        console.error(`Batch ${index} failed:`, error);
        return [];
    }
  });

  const results = await Promise.all(promises);
  const allQuestions = results.flat();

  const typeOrder = { "Multiple choices": 1, "True/ False": 2, "Short response": 3 };
  
  return allQuestions.sort((a, b) => {
     // @ts-ignore
     return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
  });
};
