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
import { BannerAd } from './components/BannerAd';
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
  
  // Mobile Tab State (Config vs Result)
  const [activeMobileTab, setActiveMobileTab] = useState<'config' | 'result'>('config');

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

  const handleDemoLogin = () => setUser(DEMO_USER);
  
  const handleLogout = async () => {
    if (isConfigured && auth) {
      try { await signOut(auth); } catch (err) { console.error(err); }
    }
    setUser(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleGenerate = useCallback(async (criteriaList: Criteria[]) => {
    if (criteriaList.length === 0) return;
    setIsLoading(true);
    setError(null);
    setHasGenerated(true);
    setGeneratedQuestions([]); 
    setIsQuizMode(false);
    setActiveMobileTab('result'); // Auto switch to result on mobile

    try {
      if (!process.env.API_KEY) throw new Error("API_KEY missing.");
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const promises = criteriaList.map(async (criteria) => {
        const prompt = generatePrompt(criteria, i18n.language);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        const jsonText = response.text?.replace(/```json|```/g, '').trim();
        if (!jsonText) return [];
        const questions = JSON.parse(jsonText) as GeneratedQuestion[];
        if (!Array.isArray(questions)) return [];
        return questions.map(q => ({ ...q, criteria }));
      });

      const results = await Promise.all(promises);
      const allQuestions = results.flat();
      if (allQuestions.length === 0) throw new Error(t('results.no_data'));
      setGeneratedQuestions(allQuestions);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || t('error.title'));
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language, t]);

  const handleSimulateExam = useCallback(async (userPrompt: string = "") => {
      setIsLoading(true);
      setError(null);
      setHasGenerated(true);
      setGeneratedQuestions([]);
      setIsQuizMode(false);
      setActiveMobileTab('result'); // Auto switch

      try {
        if (!process.env.API_KEY) throw new Error("API_KEY missing.");
        const langInstruction = i18n.language === 'en' ? " (English)" : "";
        const allQuestions = await simulateExam(process.env.API_KEY, userPrompt + langInstruction);
        if (allQuestions.length === 0) throw new Error("Simulation failed.");
        setGeneratedQuestions(allQuestions);
      } catch (err: any) {
          console.error("Simulation Error:", err);
          setError(err.message || "Error simulating exam.");
      } finally {
          setIsLoading(false);
      }
  }, [i18n.language, t]);

  if (isAuthLoading) return <LoadingSpinner />;
  if (!user) return <LoginScreen onDemoLogin={handleDemoLogin} />;

  return (
    <div className={`h-screen-dynamic w-full font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'} flex flex-col overflow-hidden`}>
      
      {/* 1. HEADER (Fixed Top) */}
      <div className="flex-none z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <Header 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
            user={user} 
            onLogout={handleLogout}
            onShowHistory={() => setShowHistory(true)}
        />
      </div>

      {/* 2. BANNER AD (Visible if not in Quiz Mode) */}
      {!isQuizMode && (
          <div className="flex-none px-4 pt-2 pb-0 z-40 hidden md:block">
             <BannerAd />
          </div>
      )}

      {/* 3. WORKSPACE (Flex Row) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR: Configuration (Desktop: Always visible / Mobile: Conditional) */}
        {!isQuizMode && (
            <aside className={`
                ${activeMobileTab === 'config' ? 'flex' : 'hidden'} 
                md:flex flex-col w-full md:w-[360px] lg:w-[400px] flex-none 
                bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
                z-30 h-full overflow-hidden md:rounded-br-2xl md:shadow-sm
            `}>
                <CriteriaSelector 
                    onGenerate={handleGenerate} 
                    isLoading={isLoading} 
                    onSimulate={handleSimulateExam} 
                />
            </aside>
        )}

        {/* MAIN CONTENT: Question List (Desktop: Flex-1 / Mobile: Conditional) */}
        <main className={`
            ${isQuizMode || activeMobileTab === 'result' ? 'flex' : 'hidden'} 
            md:flex flex-1 flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative h-full overflow-hidden
        `}>
            <div className="flex-1 p-2 md:p-6 h-full w-full overflow-hidden">
                <div className="h-full w-full bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden">
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
        </main>

      </div>

      {/* 4. MOBILE TAB BAR (Visible only on Mobile & Not Quiz Mode) */}
      {!isQuizMode && (
        <div className="md:hidden flex-none bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-2 z-50">
            <button 
                onClick={() => setActiveMobileTab('config')}
                className={`flex flex-col items-center p-2 rounded-lg w-full ${activeMobileTab === 'config' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                <span className="text-[10px] font-bold mt-1">Cấu hình</span>
            </button>
            <button 
                onClick={() => setActiveMobileTab('result')}
                className={`flex flex-col items-center p-2 rounded-lg w-full ${activeMobileTab === 'result' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <span className="text-[10px] font-bold mt-1">Đề thi</span>
            </button>
        </div>
      )}

      {/* 5. FOOTER (Desktop Only) */}
      <div className="hidden md:block flex-none z-40">
         <Footer onOpenDisclaimer={() => setShowDisclaimer(true)} />
      </div>

      {/* Modals */}
      <DisclaimerModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} user={user} />
    </div>
  );
};

export default App;
