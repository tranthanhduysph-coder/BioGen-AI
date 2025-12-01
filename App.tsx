// ... Imports ...
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

// ... Demo User & State Logic (Keep same) ...
const DEMO_USER = { uid: 'demo', displayName: 'Khách', email: 'guest@biogen.ai', photoURL: null, emailVerified: true, isAnonymous: true } as unknown as User;

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
  const [showDonate, setShowDonate] = useState<boolean>(false);
  const [isLimitReached, setIsLimitReached] = useState<boolean>(false);
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [usageCount, setUsageCount] = useState<number>(0);

  useEffect(() => {
    setUsageCount(parseInt(localStorage.getItem('biogen_usage_count') || '0', 10));
    if (isConfigured && auth) {
      onAuthStateChanged(auth, (u) => { setUser(u); setIsAuthLoading(false); });
    } else { setIsAuthLoading(false); }
  }, []);

  const handleLogout = async () => {
      if (auth) await signOut(auth);
      setUser(null);
  };

  const incrementUsage = () => {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('biogen_usage_count', String(newCount));
      if (newCount > 0 && newCount % 3 === 0) {
          setIsLimitReached(false); setShowDonate(true);
      }
  };

  // ... Generators (handleGenerate, handleSimulateExam) - Keep same logic ...
  const handleGenerate = useCallback(async (criteriaList: Criteria[]) => {
      // ... (Copy logic from previous)
      if (criteriaList.length === 0) return;
      setIsLoading(true); setError(null); setHasGenerated(true); setGeneratedQuestions([]); setIsQuizMode(false);
      try {
        if (!process.env.API_KEY) throw new Error("API_KEY missing.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const promises = criteriaList.map(async (criteria) => {
            const prompt = generatePrompt(criteria, i18n.language);
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
            const questions = JSON.parse(response.text?.replace(/```json|```/g, '').trim() || "[]");
            return questions.map((q: any) => ({ ...q, criteria }));
        });
        const results = await Promise.all(promises);
        setGeneratedQuestions(results.flat());
        incrementUsage();
      } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
  }, [i18n.language]);

  const handleSimulateExam = useCallback(async (prompt: string) => {
      // ... (Copy logic from previous)
      setIsLoading(true); setError(null); setHasGenerated(true); setGeneratedQuestions([]); setIsQuizMode(false);
      try {
          if (!process.env.API_KEY) throw new Error("API_KEY missing.");
          const lang = i18n.language === 'en' ? " (English)" : "";
          const questions = await simulateExam(process.env.API_KEY, prompt + lang);
          setGeneratedQuestions(questions);
          incrementUsage();
      } catch (e: any) { setError(e.message); } finally { setIsLoading(false); }
  }, [i18n.language]);


  if (isAuthLoading) return <LoadingSpinner />;
  if (!user) return <LoginScreen onDemoLogin={() => setUser(DEMO_USER)} />;

  return (
    <div className={`min-h-screen w-full font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col`}>
      <Header isDarkMode={isDarkMode} toggleTheme={() => { setIsDarkMode(!isDarkMode); document.documentElement.classList.toggle('dark'); }} user={user} onLogout={handleLogout} onShowHistory={() => setShowHistory(true)} />
      
      {!isQuizMode && <div className="container mx-auto px-4 pt-4"><BannerAd onDonateClick={() => setShowDonate(true)} /></div>}

      <main className="container mx-auto p-4 md:p-6 flex-grow flex flex-col gap-6">
          {/* Top Section: Config (2 Columns inside) */}
          {!isQuizMode && (
              <section>
                  <CriteriaSelector onGenerate={handleGenerate} isLoading={isLoading} onSimulate={handleSimulateExam} />
              </section>
          )}

          {/* Bottom Section: Results */}
          <section className="flex-grow">
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 md:p-6 min-h-[600px] flex flex-col relative">
                  {isLoading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : hasGenerated ? 
                    <QuestionList questions={generatedQuestions} isQuizMode={isQuizMode} setQuizMode={setIsQuizMode} user={user} /> 
                  : <WelcomeScreen />}
             </div>
          </section>
      </main>

      <Footer onOpenDisclaimer={() => setShowDisclaimer(true)} />
      <DisclaimerModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} user={user} />
      <DonateModal isOpen={showDonate} onClose={() => setShowDonate(false)} onConfirmPayment={() => setShowDonate(false)} isLimitReached={isLimitReached} />
    </div>
  );
};

export default App;
