import React, { useState, useCallback, useEffect } from 'react';
// ... imports giữ nguyên (Logic không đổi)
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
import { callGeminiProxy } from './services/apiService';
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

  // ... State logic giữ nguyên ...
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

  // ... UseEffect & Handlers giữ nguyên ...
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

    try {
      // ... Logic Generate giữ nguyên ...
      const promises = criteriaList.map(async (criteria) => {
        const prompt = generatePrompt(criteria, i18n.language);
        const response = await callGeminiProxy(prompt);
        const jsonText = response.text?.replace(/```json|```/g, '').trim();
        if (!jsonText) return [];
        const questions = JSON.parse(jsonText) as GeneratedQuestion[];
        if (!Array.isArray(questions)) return [];
        return questions.map(q => ({ ...q, criteria }));
      });

      const results = await Promise.all(promises);
      const allQuestions = results.flat();
      if (allQuestions.length === 0) throw new Error("No questions generated.");
      setGeneratedQuestions(allQuestions);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error generating questions.");
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language]);

  const handleSimulateExam = useCallback(async (userPrompt: string = "") => {
      setIsLoading(true);
      setError(null);
      setHasGenerated(true);
      setGeneratedQuestions([]);
      setIsQuizMode(false);
      try {
        // ... Logic Simulate giữ nguyên ...
        const langInstruction = i18n.language === 'en' ? " (English)" : "";
        const allQuestions = await simulateExam("dummy-key", userPrompt + langInstruction);
        if (allQuestions.length === 0) throw new Error("Simulation failed.");
        setGeneratedQuestions(allQuestions);
      } catch (err: any) {
          console.error("Simulation Error:", err);
          setError(err.message || "Error simulating exam.");
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

  // --- LAYOUT FIX ---
  return (
    // Container chính cố định chiều cao 100vh, không cuộn body
    <div className={`h-screen w-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col overflow-hidden`}>
      
      {/* Header cố định */}
      <div className="flex-none z-50">
        <Header 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
            user={user} 
            onLogout={handleLogout}
            onShowHistory={() => setShowHistory(true)}
        />
        {!isQuizMode && <BannerAd />}
      </div>
      
      {/* Main Content: Chiếm phần còn lại, có padding nhưng không cuộn chính nó */}
      <main className="flex-1 overflow-hidden relative w-full max-w-[1600px] mx-auto">
        <div className="h-full w-full p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                
                {/* Sidebar: Cố định, có thanh cuộn riêng bên trong */}
                {!isQuizMode && (
                    <div className="lg:col-span-4 h-full overflow-hidden flex flex-col">
                        <CriteriaSelector 
                            onGenerate={handleGenerate} 
                            isLoading={isLoading} 
                            onSimulate={handleSimulateExam} 
                        />
                    </div>
                )}
                
                {/* Main Panel: Cố định, nội dung cuộn bên trong */}
                <div className={`${isQuizMode ? 'lg:col-span-12' : 'lg:col-span-8'} h-full overflow-hidden flex flex-col`}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden relative">
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
        </div>
      </main>

      {/* Footer cố định ở đáy */}
      <div className="flex-none">
        <Footer onOpenDisclaimer={() => setShowDisclaimer(true)} />
      </div>

      {/* Modals */}
      <DisclaimerModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} user={user} />
    </div>
  );
};

export default App;
