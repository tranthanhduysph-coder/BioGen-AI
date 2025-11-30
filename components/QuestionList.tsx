import React, { useState } from 'react';
// ... imports
import type { GeneratedQuestion } from '../types';
import { QuestionDisplay } from './QuestionDisplay';
import { exportToDocx } from '../services/docxService';
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
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // ... Handlers (handleExport, handleShare) giữ nguyên ...
  const handleExport = async () => {
      setIsExporting(true);
      try { await exportToDocx(questions); } 
      catch (e) { alert(t('results.error_export')); }
      finally { setIsExporting(false); }
  };

  const handleShare = async () => {
      // ... logic share ...
      const text = questions.map((q, i) => `Câu ${i+1}: ${q.question}`).join('\n');
      navigator.clipboard.writeText(text);
      alert(t('results.share_success'));
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center text-slate-500 dark:text-slate-400 p-10">
        <div className="max-w-sm">
            <p className="text-lg mb-2 font-medium">{t('results.no_data')}</p>
            <p className="text-sm opacity-80">{t('results.no_data_desc')}</p>
        </div>
      </div>
    );
  }

  if (isQuizMode) {
      return <QuizMode questions={questions} onExit={() => setQuizMode(false)} user={user} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
       {/* Header Cố định */}
       <div className="flex-none p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 w-1.5 h-6 rounded-full"></span>
                {t('results.title')}
              </h2>
              
              <div className="flex items-center gap-2 flex-wrap">
                 <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    {questions.length} {t('results.count_suffix')}
                 </span>
                 
                 <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-lg text-sm font-bold transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                     {t('results.share')}
                 </button>

                 <button onClick={() => setQuizMode(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 14 7.472-4.981a.464.464 0 0 1 .687.56l-2.894 8.268a.464.464 0 0 1-.88 0l-2.894-8.268a.464.464 0 0 1 .687-.56L12 14Zm0 0V3"/></svg>
                    {t('results.start_quiz')}
                 </button>

                 <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-md transition-all disabled:opacity-70">
                    {isExporting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>}
                    {t('results.export_docx')}
                 </button>
              </div>
           </div>
       </div>

       {/* Danh sách cuộn */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
        {questions.map((q, index) => (
            <QuestionDisplay key={index} question={q} index={index + 1} />
        ))}
       </div>
    </div>
  );
};
