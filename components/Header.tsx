
import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

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

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <BrainIcon className="text-white h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">
              BioGen AI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block">Hệ thống tạo câu hỏi trắc nghiệm thông minh</p>
          </div>
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-sky-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
};