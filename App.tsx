import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CriteriaSelector } from './components/CriteriaSelector';
import { QuestionList } from './components/QuestionList';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { DisclaimerModal } from './components/DisclaimerModal';
import { HistoryModal } from './components/HistoryModal';
import { Footer } from './components/Footer';
import type { Criteria, GeneratedQuestion } from './types';
import { generatePrompt } from './services/geminiService';
import { simulateExam } from './services/examSimulationService';
import { auth, isConfigured } from './firebaseConfig';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { LoginScreen } from './components/LoginScreen';
import { useTranslation } from 'react-i18next';

const DEMO_USER = {
  uid: 'demo-user-123',
  displayName: 'Khách (Demo)',
  email: 'guest@biogen.ai',
  photoURL: null,
  emailVerified: true,
  isAnonymous: true,
} as unknown as User;

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);

  useEffect(() => {
    if (isConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  const handleDemoLogin = () => {
    setUser(DEMO_USER);
  };

  const handleLogout = async () => {
    if (isConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout error", err);
      }
    }
    setUser(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Static Generation Handler
  const handleGenerate = useCallback(async (criteriaList: Criteria[]) => {
    if (criteriaList.length === 0) return;

    setIsLoading(true);
    setError(null);
    setHasGenerated(true);
    setGeneratedQuestions([]); 
    setIsQuizMode(false);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY not found in .env file.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const promises = criteriaList.map(async (criteria) => {
        // PASS CURRENT LANGUAGE
        const prompt = generatePrompt(criteria, i18n.language);
        
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
        throw new Error(i18n.language === 'en' ? "No questions generated." : "Không tạo được câu hỏi nào.");
      }

      setGeneratedQuestions(allQuestions);

    } catch (err: any) {
      console.error("Error generating questions:", err);
      setError(i18n.language === 'en' ? "Failed to generate questions." : `Lỗi khi tạo câu hỏi: ${err.message || "Kiểm tra kết nối."}`);
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language]);

  // Static Simulation Handler
  const handleSimulateExam = useCallback(async (userPrompt: string = "") => {
      setIsLoading(true);
      setError(null);
      setHasGenerated(true);
      setGeneratedQuestions([]);
      setIsQuizMode(false);

      try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY not found.");
        }
        
        // Pass language instruction as a prompt hack since the service handles logic internally
        const langInstruction = i18n.language === 'en' ? " (Generate output completely in English)" : "";

        const allQuestions = await simulateExam(process.env.API_KEY, userPrompt + langInstruction);
        
        if (allQuestions.length === 0) throw new Error("Không tạo được đề thi.");
        
        setGeneratedQuestions(allQuestions);

      } catch (err) {
          console.error("Simulation Error:", err);
          setError("Lỗi khi tạo đề thi mô phỏng.");
      } finally {
          setIsLoading(false);
      }
  }, [i18n.language]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
         <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className={`min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col`}>
      <Header 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        user={user} 
        onLogout={handleLogout}
        onShowHistory={() => setShowHistory(true)}
      />
      
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 h-full">
          {!isQuizMode && (
            <div className="lg:col-span-4 xl:col-span-4">
              <CriteriaSelector 
                  onGenerate={handleGenerate} 
                  isLoading={isLoading} 
                  onSimulate={handleSimulateExam} 
              />
            </div>
          )}
          
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
                  user={user}
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
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} user={user} />
    </div>
  );
};

export default App;
