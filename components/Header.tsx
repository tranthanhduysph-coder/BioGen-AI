import React from 'react';
import { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  user?: User | null;
  onLogout: () => void;
  onShowHistory: () => void;
}

// ... Icons (BrainIcon, SunIcon, MoonIcon, LogoutIcon) giữ nguyên ...
const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5a3.5 3.5 0 0 0-3.5 3.5c0 2.25 1 4.31 2.5 5.5"/>
    <path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 2.25-1 4.31-2.5 5.5"/>
    <path d="M12 14v2.5"/>
    <path d="M12 14c-1.5 1.19-2.5 3.25-2.5 5.5"/>
    <path d="M12 14c1.5 1.19 2.5 3.25 2.5 5.5"/>
    <path d="M15.5 12.5a2.5 2.5 0 0 1-5 0"/>
    <path d="M19.5 12.5c0 3.28-2.5 6.5-7.5 6.5s-7.5-3.22-7.5-6.5"/>
    <path d="M4.5 12.5c0-3.28 2.5-6.5 7.5-6.5s7.5 3.22 7.5 6.5"/>
  </svg>
);

const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const LogoutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, user, onLogout, onShowHistory }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <BrainIcon className="text-white h-7 w-7" />
          </div>
          <div>
            {/* Fix: Dùng fallback text để tránh hiển thị key khi load chậm */}
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
              {t('app.name') || "BioGen AI"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                {t('app.subtitle') || "Hệ thống tạo câu hỏi trắc nghiệm thông minh"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
            {user && (
                <>
                     {/* History Button */}
                     <button
                        onClick={onShowHistory}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                        title={t('header.history')}
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        <span className="hidden md:inline">{t('header.history')}</span>
                     </button>
                    
                    <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    {/* User Info */}
                    <div className="hidden lg:flex items-center gap-3 mr-1">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('header.hello')},</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">{user.displayName || "User"}</p>
                        </div>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                                {user.email?.charAt(0).toUpperCase() || "U"}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* LANGUAGE TOGGLE BUTTON */}
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-all shadow-sm"
              title="Chuyển đổi ngôn ngữ / Switch Language"
            >
              {i18n.language === 'vi' ? 'EN' : 'VI'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-sky-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none border border-slate-200 dark:border-slate-700"
              aria-label={t('header.theme')}
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Logout */}
            {user && (
                 <button
                    onClick={onLogout}
                    className="p-2.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 focus:outline-none border border-red-100 dark:border-red-900/50"
                    title={t('header.logout')}
                 >
                    <LogoutIcon />
                 </button>
            )}
        </div>
      </div>
    </header>
  );
};
