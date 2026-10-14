import React, { useState, useCallback, useEffect } from 'react';
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
import { generateManualQuestions, resumeManualQuestions } from './services/manualGenerationService';
import { getCreditAccount } from './services/creditService';
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
  const [manualRefresh, setManualRefresh] = useState(0);
  const [lastManualAction, setLastManualAction] = useState<{ criteria: Criteria[]; resume: boolean } | null>(null);

  useEffect(() => {
    if (user && user.uid !== DEMO_USER.uid) {
      // The server grants one-time trials and preserves blocked accounts.
      void getCreditAccount().catch(() => { /* Backend errors are shown on generation. */ });
    }
  }, [user?.uid]);

  useEffect(() => {
    const isBlueprintPreview = window.location.hostname === 'biogenai-blueprint-preview.onrender.com';
    if (isConfigured && auth) {
      let initialAuthState = true;
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser || (initialAuthState && isBlueprintPreview ? DEMO_USER : null));
        initialAuthState = false;
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      if (isBlueprintPreview) setUser(DEMO_USER);
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

  const handleGenerate = useCallback(async (criteriaList: Criteria[], resume = false, confirmedLast = false) => {
    if (!resume && criteriaList.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const before = await getCreditAccount();
      if (before.enabled && before.manualBalance === 1 && !before.activeManualRunId && !confirmedLast) {
        setLastManualAction({ criteria: criteriaList, resume });
        return;
      }
      setHasGenerated(true);
      setGeneratedQuestions([]);
      setIsQuizMode(false);
      const allQuestions = resume ? await resumeManualQuestions() : await generateManualQuestions(criteriaList, i18n.language);

      if (allQuestions.length === 0) {
        throw new Error(t('results.no_data'));
      }

      setGeneratedQuestions(allQuestions);
      void getCreditAccount().then(account => {
        if (account.enabled && account.manualBalance === 0) setShowDonate(true);
      }).catch(() => { /* Keep successfully generated questions on a balance-refresh error. */ });
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || t('error.title'));
      if (err.code === 'manual_credits_required') setShowDonate(true);
    } finally {
      setIsLoading(false);
      setManualRefresh(v => v + 1);
    }
  }, [i18n.language, t]);

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
             <BannerAd />
         </div>
      )}

      <main className="container mx-auto p-4 md:p-6 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            
            {/* SIDEBAR (Left - 4 cols) */}
            {!isQuizMode && (
                <div className="lg:col-span-4 h-full">
                    <CriteriaSelector 
                        manualRefreshToken={manualRefresh}
                        onResumeManual={() => void handleGenerate([], true)}
                        onBuyManual={() => setShowDonate(true)}
                        onGenerate={handleGenerate} 
                        isLoading={isLoading} 
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
      {lastManualAction && <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4">
        <section role="dialog" aria-label="Cảnh báo lượt câu hỏi lẻ cuối cùng" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-800 shadow-xl dark:bg-slate-900 dark:text-white">
          <h3 className="font-bold text-amber-700">Đây là lượt câu hỏi lẻ cuối cùng</h3>
          <p className="mt-2 text-sm">Sau lượt này, anh/chị cần mua gói 20.000đ / 3 lượt để tiếp tục. Credit tạo đề được tính riêng.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white" onClick={() => {
              const pending = lastManualAction; setLastManualAction(null); void handleGenerate(pending.criteria, pending.resume, true);
            }}>Dùng lượt cuối</button>
            <button className="rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => { setLastManualAction(null); setShowDonate(true); }}>Mua thêm 3 lượt</button>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setLastManualAction(null)}>Để sau</button>
          </div>
        </section>
      </div>}
    </div>
  );
};

export default App;
