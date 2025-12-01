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
import { DonateModal } from './components/DonateModal';
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
  
  // Modals
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showDonate, setShowDonate] = useState<boolean>(false);
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);
  
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [usageCount, setUsageCount] = useState<number>(0);

  useEffect(() => {
    const storedUsage = parseInt(localStorage.getItem('biogen_usage_count') || '0', 10);
    setUsageCount(storedUsage);

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

  const incrementUsage = () => {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('biogen_usage_count', String(newCount));
      if (newCount > 0 && newCount % 3 === 0) {
          setIsLimitReached(false);
          setShowDonate(true);
      }
  };

  const handleGenerate = useCallback(async (criteriaList: Criteria[]) => {
    if (criteriaList.length === 0) return;
    setIsLoading(true);
    setError(null);
    setHasGenerated(true);
    setGeneratedQuestions([]); 
    setIsQuizMode(false);

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
      incrementUsage();

    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || t('error.title'));
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language, t, usageCount]);

  const handleSimulateExam = useCallback(async (userPrompt: string = "") => {
      setIsLoading(true);
      setError(null);
      setHasGenerated(true);
      setGeneratedQuestions([]);
      setIsQuizMode(false);

      try {
        if (!process.env.API_KEY) throw new Error("API_KEY missing.");
        
        const langInstruction = i18n.language === 'en' ? " (English)" : "";
        const allQuestions = await simulateExam(process.env.API_KEY, userPrompt + langInstruction);
        
        if (allQuestions.length === 0) throw new Error("Simulation failed.");
        
        setGeneratedQuestions(allQuestions);
        incrementUsage();

      } catch (err: any) {
          console.error("Simulation Error:", err);
          setError(err.message || "Error simulating exam.");
      } finally {
          setIsLoading(false);
      }
  }, [i18n.language, t, usageCount]);

  if (isAuthLoading) return <LoadingSpinner />;
  if (!user) return <LoginScreen onDemoLogin={handleDemoLogin} />;

  return (
    <div className={`min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col`}>
      
      <Header 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
          user={user} 
          onLogout={handleLogout}
          onShowHistory={() => setShowHistory(true)}
      />
      
      {!isQuizMode && (
         <div className="container mx-auto px-4 pt-4">
             <BannerAd onDonateClick={() => setShowDonate(true)} />
         </div>
      )}

      <main className="container mx-auto p-4 md:p-6 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* SIDEBAR (Left - 4 cols) */}
            {!isQuizMode && (
                <div className="lg:col-span-4 h-full">
                    <CriteriaSelector 
                        onGenerate={handleGenerate} 
                        isLoading={isLoading} 
                        onSimulate={handleSimulateExam} 
                    />
                </div>
            )}
            
            {/* MAIN CONTENT (Right - 8 cols or Full) */}
            <div className={`${isQuizMode ? 'lg:col-span-12' : 'lg:col-span-8'} h-full`}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 md:p-6 min-h-[70vh] flex flex-col relative">
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
      <DonateModal isOpen={showDonate} onClose={() => setShowDonate(false)} onConfirmPayment={() => setShowDonate(false)} isLimitReached={isLimitReached} />
    </div>
  );
};

export default App;
