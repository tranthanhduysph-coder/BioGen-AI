import React, { useState } from 'react';
import type { GeneratedQuestion } from '../types';
import { QuestionDisplay } from './QuestionDisplay';
import { QuizMode } from './QuizMode';
import type { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

interface QuestionListProps {
  questions: GeneratedQuestion[];
  isQuizMode: boolean;
  setQuizMode: (mode: boolean) => void;
  user: User;
}

export const QuestionList: React.FC<QuestionListProps> = ({ questions, isQuizMode, setQuizMode, user }) => {
  const { t } = useTranslation();

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 flex-grow flex items-center justify-center p-10">
        <div className="max-w-sm">
            <p className="text-lg mb-2">{t('results.no_data')}</p>
            <p className="text-sm opacity-80">{t('results.no_data_desc')}</p>
        </div>
      </div>
    );
  }

  if (isQuizMode) {
      return <QuizMode questions={questions} onExit={() => setQuizMode(false)} user={user} />;
  }

  return (
    <div className="h-full flex flex-col">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 px-1 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 w-1.5 h-6 rounded-full"></span>
            {t('results.title')}
          </h2>
          
          <div className="flex items-center gap-3 flex-wrap">
             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                {questions.length} {t('results.count_suffix')}
             </span>
             
             {/* REMOVED: Share and Export Buttons */}

             <button 
                onClick={() => setQuizMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 7.472-4.981a.464.464 0 0 1 .687.56l-2.894 8.268a.464.464 0 0 1-.88 0l-2.894-8.268a.464.464 0 0 1 .687-.56L12 14Zm0 0V3"/></svg>
                {t('results.start_quiz')}
             </button>
          </div>
       </div>

       <div className="space-y-6 overflow-y-auto pr-2 pb-4 flex-grow custom-scrollbar">
        {questions.map((q, index) => (
            <QuestionDisplay key={index} question={q} index={index + 1} />
        ))}
       </div>
    </div>
  );
};
