
import React, { useState } from 'react';
import { AppMode } from './types';
import { GeneratorModule } from './components/GeneratorModule';
import { ExtractorModule } from './components/ExtractorModule';
import { IRTModule } from './components/IRTModule';
import { Footer } from './components/Footer';
import { Login } from './components/Login';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';

const MainApp: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATOR);
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const { user, logout, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><LoadingSpinner /></div>;
  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t('appTitle')}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{t('appDesc')}</p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <button 
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="px-3 py-1 text-xs font-bold rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {theme === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                )}
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">{user.email?.[0].toUpperCase()}</div>
                )}
                <button onClick={() => logout()} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex space-x-1 rounded-xl bg-slate-200 dark:bg-slate-700 p-1 mb-8 max-w-lg mx-auto">
          <button onClick={() => setMode(AppMode.GENERATOR)} className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${mode === AppMode.GENERATOR ? 'bg-white dark:bg-slate-600 text-indigo-700 dark:text-indigo-300 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-white/[0.5] dark:hover:bg-slate-600'}`}>{t('tabGenerator')}</button>
          <button onClick={() => setMode(AppMode.EXTRACTOR)} className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${mode === AppMode.EXTRACTOR ? 'bg-white dark:bg-slate-600 text-emerald-700 dark:text-emerald-300 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-white/[0.5] dark:hover:bg-slate-600'}`}>{t('tabExtractor')}</button>
          <button onClick={() => setMode(AppMode.IRT)} className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${mode === AppMode.IRT ? 'bg-white dark:bg-slate-600 text-pink-700 dark:text-pink-300 shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-white/[0.5] dark:hover:bg-slate-600'}`}>{t('tabIRT')}</button>
        </div>

        <div className="transition-opacity duration-300">
          {mode === AppMode.GENERATOR && <GeneratorModule />}
          {mode === AppMode.EXTRACTOR && <ExtractorModule />}
          {mode === AppMode.IRT && <IRTModule />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AuthProvider>
      <SessionProvider>
        <MainApp />
      </SessionProvider>
    </AuthProvider>
  </AppProvider>
);

export default App;
