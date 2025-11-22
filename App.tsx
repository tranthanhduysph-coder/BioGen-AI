
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CriteriaSelector } from './components/CriteriaSelector';
import { QuestionList } from './components/QuestionList';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { DisclaimerModal } from './components/DisclaimerModal';
import { Footer } from './components/Footer';
import type { Criteria, GeneratedQuestion } from './types';
import { generatePrompt } from './services/geminiService';
import { simulateExam } from './services/examSimulationService';

const App: React.FC = () => {
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  
  // Lifted state: Manage Quiz Mode at App level to control Layout
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Handler for Manual Generation (via Queue)
  const handleGenerate = useCallback(async (criteriaList: Criteria[]) => {
    if (criteriaList.length === 0) return;

    setIsLoading(true);
    setError(null);
    setHasGenerated(true);
    setGeneratedQuestions([]); 
    setIsQuizMode(false); // Reset quiz mode on new generation

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const promises = criteriaList.map(async (criteria) => {
        const prompt = generatePrompt(criteria);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const jsonText = response.text?.replace(/```json|```/g, '').trim();
        if (!jsonText) return [];

        const questions = JSON.parse(jsonText) as GeneratedQuestion[];
        
        if (!Array.isArray(questions)) return [];
        
        return questions.map(q => ({ ...q, criteria }));
      });

      const results = await Promise.all(promises);
      const allQuestions = results.flat();

      if (allQuestions.length === 0) {
        throw new Error("Không tạo được câu hỏi nào từ các yêu cầu đã chọn.");
      }

      setGeneratedQuestions(allQuestions);

    } catch (err) {
      console.error("Error generating questions:", err);
      setError("Không thể tạo câu hỏi. Vui lòng kiểm tra kết nối hoặc thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler for Full Exam Simulation (2025 Format)
  const handleSimulateExam = useCallback(async (userPrompt: string = "") => {
      setIsLoading(true);
      setError(null);
      setHasGenerated(true);
      setGeneratedQuestions([]);
      setIsQuizMode(false); // Reset quiz mode on new generation

      try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set.");
        }
        
        // Call the dedicated simulation service
        const allQuestions = await simulateExam(process.env.API_KEY, userPrompt);
        
        if (allQuestions.length === 0) throw new Error("Không tạo được đề thi. Vui lòng thử lại.");
        
        setGeneratedQuestions(allQuestions);

      } catch (err) {
          console.error("Simulation Error:", err);
          setError("Lỗi khi tạo đề thi mô phỏng. Hệ thống có thể đang bận, vui lòng thử lại.");
      } finally {
          setIsLoading(false);
      }
  }, []);


  return (
    <div className={`min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col`}>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 h-full">
          {/* Hide Sidebar when in Quiz Mode to give full focus */}
          {!isQuizMode && (
            <div className="lg:col-span-4 xl:col-span-4">
              <CriteriaSelector 
                  onGenerate={handleGenerate} 
                  isLoading={isLoading} 
                  onSimulate={handleSimulateExam} 
              />
            </div>
          )}
          
          {/* Expand Main Content when in Quiz Mode */}
          <div className={`${isQuizMode ? 'lg:col-span-12 xl:col-span-12' : 'lg:col-span-8 xl:col-span-8'}`}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 p-1 md:p-6 min-h-[70vh] flex flex-col transition-colors duration-300 h-full">
              {isLoading ? (
                <LoadingSpinner />
              ) : error ? (
                <ErrorMessage message={error} />
              ) : hasGenerated ? (
                <QuestionList 
                  questions={generatedQuestions} 
                  isQuizMode={isQuizMode}
                  setQuizMode={setIsQuizMode}
                />
              ) : (
                <WelcomeScreen />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenDisclaimer={() => setShowDisclaimer(true)} />

      <DisclaimerModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </div>
  );
};

export default App;
