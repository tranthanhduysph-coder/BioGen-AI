import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedQuestion } from '../types';
import { QuestionType } from '../types';
import { saveExamResult } from '../services/historyService';
import type { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

// ... (Keep imports and interface definitions same as before)

export const QuizMode: React.FC<QuizModeProps> = ({ questions, onExit, user }) => {
  const { t } = useTranslation();
  // ... (Keep state: timeLeft, isSubmitted, isSaving, userAnswers)
  // ... (Keep useEffect timer logic)

  // ... (Keep formatTime, handleOptionSelect, handleTrueFalseSelect, handleShortResponseChange, calculateScore functions)
  
  // NEW: Explicit Save Function called by button
  const handleSaveResult = async () => {
      if (isSaving) return;
      setIsSaving(true);
      const results = calculateScore();
      const chapterSummary = questions[0]?.criteria?.chapter ? t(`constants.chapters.${questions[0].criteria.chapter}`, { defaultValue: questions[0].criteria.chapter }) : "Mixed Exam";
      
      try {
          await saveExamResult(user, {
              timestamp: Date.now(),
              score: results.score,
              totalQuestions: results.totalQuestions,
              correctCount: results.correctCount,
              chapterSummary: chapterSummary
          });
          alert(t('quiz.saved_success'));
      } catch (error) {
          console.error("Save failed", error);
      } finally {
          setIsSaving(false);
      }
  };

  // ... (Keep handleSubmit - make sure it calls saveExamResult too if auto-save desired)

  return (
    <div className="h-full flex flex-col relative bg-white dark:bg-slate-900 quiz-mode-container">
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm no-print">
        {/* ... (Left side: Exit & Title) ... */}
        
        {!isSubmitted ? (
             <div className="flex items-center gap-4">
                {/* ... (Timer) ... */}
                <button onClick={handleSubmit} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-sky-500/20 transition-colors">
                    {t('quiz.submit')}
                </button>
             </div>
        ) : (
            <div className="flex items-center gap-3">
                {/* NEW SAVE BUTTON */}
                <button 
                    onClick={handleSaveResult}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-70"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    {isSaving ? t('quiz.saving') : t('quiz.save')}
                </button>

                <div className="text-right mr-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('quiz.score')}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-emerald-600 leading-none">{results?.score}</span>
                        <span className="text-xs font-bold text-slate-400">/10</span>
                    </div>
                </div>
                {/* ... (Print Button) ... */}
            </div>
        )}
      </div>
      {/* ... (Rest of Quiz Body) ... */}
    </div>
  );
};
