import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedQuestion } from '../types';
import { QuestionType } from '../types';
import { saveExamResult } from '../services/historyService';
import type { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

interface QuizModeProps {
  questions: GeneratedQuestion[];
  onExit: () => void;
  user: User;
  initialUserAnswers?: Record<number, any>;
  readOnly?: boolean;
}

// ... Score Detail Interface & Normalize Helper (Same as before) ...
interface ScoreDetail {
  totalQuestions: number;
  correctCount: number;
  totalSubParts: number;
  correctSubParts: number;
  score: number;
  rawScore: number;
  maxRawScore: number;
}

const normalize = (str: string) => {
    if (!str) return "";
    return String(str).trim().toLowerCase().replace(/[.,;]/g, '');
};

export const QuizMode: React.FC<QuizModeProps> = ({ questions, onExit, user, initialUserAnswers, readOnly = false }) => {
  const { t } = useTranslation();

  // SAFEGUARD: Prevent crash if questions is null/empty
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <p className="text-red-500 font-bold mb-4">Lỗi: Không có dữ liệu câu hỏi để hiển thị.</p>
              <button onClick={onExit} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Quay lại</button>
          </div>
      );
  }

  const initialTime = Math.ceil(questions.length * 1.5 * 60);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isSubmitted, setIsSubmitted] = useState(readOnly);
  const [isSaving, setIsSaving] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>(initialUserAnswers || {});
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isSubmitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit(); return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ... Answer Handlers (Same as before) ...
  const handleOptionSelect = (qIndex: number, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: value }));
  };
  const handleTrueFalseSelect = (qIndex: number, subIndex: number, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: { ...(prev[qIndex] || {}), [subIndex]: value } }));
  };
  const handleShortResponseChange = (qIndex: number, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  // ... Score Calculation (Same as before) ...
  const calculateScore = (): ScoreDetail => {
    let rawScore = 0; let maxRawScore = 0; let correctCount = 0; let totalSubParts = 0; let correctSubParts = 0;
    questions.forEach((q, idx) => {
      const uAns = userAnswers[idx];
      if (q.type === QuestionType.MultipleChoice) {
        const weight = 0.25; maxRawScore += weight;
        const correctLetter = q.answer ? q.answer.split('.')[0].trim().toUpperCase() : ""; 
        const userLetter = uAns ? String(uAns).split('.')[0].trim().toUpperCase() : "";
        if (userLetter && userLetter === correctLetter) { rawScore += weight; correctCount++; }
      } else if (q.type === QuestionType.ShortResponse) {
        const weight = 0.25; maxRawScore += weight;
        const cleanUser = normalize(uAns); const cleanCorrect = normalize(q.answer);
        const userNum = parseFloat(cleanUser); const correctNum = parseFloat(cleanCorrect);
        const isCorrect = (cleanUser === cleanCorrect) || (!isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.01);
        if (isCorrect) { rawScore += weight; correctCount++; }
      } else if (q.type === QuestionType.TrueFalse) {
        const weight = 1.0; maxRawScore += weight;
        const correctMap: Record<number, string> = {}; const parts = ['a', 'b', 'c', 'd'];
        parts.forEach((p, pIdx) => {
            const regex = new RegExp(`${p}[).:]\\s*(Đúng|Sai|Đ|S|True|False)`, 'i');
            const match = q.answer.match(regex);
            if (match) { let val = match[1].toLowerCase(); if (val.startsWith('đ') || val === 'true') correctMap[pIdx] = 'Đúng'; else correctMap[pIdx] = 'Sai'; } else { correctMap[pIdx] = 'N/A'; }
        });
        let qCorrectSub = 0;
        parts.forEach((_, pIdx) => {
            totalSubParts++; const uSub = uAns?.[pIdx]; const cSub = correctMap[pIdx];
            let normalizedUser = ''; if (uSub === 'Đúng' || uSub === 'True') normalizedUser = 'Đúng'; if (uSub === 'Sai' || uSub === 'False') normalizedUser = 'Sai';
            if (normalizedUser && cSub && normalizedUser === cSub) { qCorrectSub++; correctSubParts++; }
        });
        if (qCorrectSub === 1) rawScore += 0.1; else if (qCorrectSub === 2) rawScore += 0.25; else if (qCorrectSub === 3) rawScore += 0.5; else if (qCorrectSub === 4) rawScore += 1.0;
      }
    });
    const normalizedScore = maxRawScore > 0 ? (rawScore / maxRawScore) * 10 : 0;
    return { totalQuestions: questions.length, correctCount, totalSubParts, correctSubParts, score: parseFloat(normalizedScore.toFixed(2)), rawScore: parseFloat(rawScore.toFixed(2)), maxRawScore: parseFloat(maxRawScore.toFixed(2)) };
  };

  // ... Save Handlers (Same as before) ...
  const handleSaveResult = async () => {
      if (isSaving || readOnly) return;
      setIsSaving(true);
      const results = calculateScore();
      const chapterSummary = questions[0]?.criteria?.chapter ? t(`constants.chapters.${questions[0].criteria.chapter}`, { defaultValue: questions[0].criteria.chapter }) : "Exam";
      try {
          await saveExamResult(user, {
              timestamp: Date.now(), score: results.score, totalQuestions: results.totalQuestions, correctCount: results.correctCount, chapterSummary: chapterSummary,
              questionsData: questions, userAnswers: userAnswers
          });
          alert(t('quiz.saved_success', 'Đã lưu kết quả!'));
      } catch (error) { console.error("Save failed", error); } finally { setIsSaving(false); }
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitted(true);
    if (!readOnly) handleSaveResult(); // Auto-save on submit
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };
  const handlePrint = () => window.print();
  const results = isSubmitted ? calculateScore() : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm z-10">
         <div className="flex items-center gap-4">
            <button onClick={onExit} className="text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                {t('quiz.exit')}
            </button>
            <h2 className="text-lg font-bold hidden sm:block">{isSubmitted ? (readOnly ? "Xem Lại Bài" : t('quiz.title_result')) : t('quiz.title_working')}</h2>
         </div>

         {!isSubmitted ? (
             <div className="flex items-center gap-3">
                 <div className={`font-mono text-lg font-bold px-3 py-1 rounded border ${timeLeft < 60 ? 'text-red-500 border-red-200 bg-red-50 animate-pulse' : 'text-indigo-600 border-indigo-200 bg-indigo-50'}`}>
                    {formatTime(timeLeft)}
                </div>
                <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition">
                    {t('quiz.submit')}
                </button>
             </div>
         ) : (
             <div className="flex items-center gap-3">
                 {!readOnly && (
                    <button onClick={handleSaveResult} disabled={isSaving} className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold text-sm shadow hover:bg-emerald-700 disabled:opacity-70 flex gap-1">
                         {isSaving ? "..." : t('quiz.save')}
                    </button>
                 )}
                 <div className="text-right mr-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Điểm</p>
                    <span className="text-xl font-black text-emerald-600">{results?.score}</span>
                 </div>
                 <button onClick={handlePrint} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg></button>
             </div>
         )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
         <div className="max-w-4xl mx-auto space-y-6 pb-20">
            
            {/* Result Summary Box */}
            {isSubmitted && results && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-emerald-100 dark:border-emerald-900 mb-6 text-center">
                    <h3 className="text-2xl font-bold text-emerald-600 mb-4">{t('quiz.summary_title')}</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase font-bold">Tổng điểm</div>
                            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{results.score}</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase font-bold">Số câu đúng</div>
                            <div className="text-xl font-bold">{results.correctCount}</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase font-bold">Ý đúng/sai</div>
                            <div className="text-xl font-bold">{results.correctSubParts}/{results.totalSubParts}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Questions */}
            {questions.map((q, idx) => {
                const isMCQ = q.type === QuestionType.MultipleChoice;
                const isTF = q.type === QuestionType.TrueFalse;
                const isShort = q.type === QuestionType.ShortResponse;
                
                return (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm font-bold text-slate-700 dark:text-slate-300">Câu {idx + 1}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 border border-slate-200 px-2 rounded">{q.type}</span>
                        </div>
                        
                        <div className="mb-6 text-base md:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                            {q.question}
                        </div>

                        <div className="space-y-3">
                            {/* Render Options based on Type - Similar to QuestionDisplay but interactive */}
                            {isMCQ && q.options.map((opt, oIdx) => (
                                <label key={oIdx} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${userAnswers[idx] === opt ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input type="radio" name={`q-${idx}`} checked={userAnswers[idx] === opt} onChange={() => handleOptionSelect(idx, opt)} disabled={isSubmitted} className="mt-1 mr-3" />
                                    <span className="text-sm md:text-base">{opt}</span>
                                </label>
                            ))}

                            {isTF && (
                                <div className="grid gap-3">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                                            <span className="mb-2 sm:mb-0 text-sm md:text-base font-medium flex-1 mr-4">{opt}</span>
                                            <div className="flex gap-2 shrink-0">
                                                {['Đúng', 'Sai'].map(val => (
                                                    <label key={val} className={`cursor-pointer px-3 py-1 rounded border text-sm font-bold transition-all ${userAnswers[idx]?.[oIdx] === val ? (val === 'Đúng' ? 'bg-green-100 text-green-700 border-green-500' : 'bg-red-100 text-red-700 border-red-500') : 'bg-white border-slate-300 text-slate-500'}`}>
                                                        <input type="radio" name={`q-${idx}-sub-${oIdx}`} checked={userAnswers[idx]?.[oIdx] === val} onChange={() => handleTrueFalseSelect(idx, oIdx, val)} disabled={isSubmitted} className="hidden" />
                                                        {val}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isShort && (
                                <div className="max-w-xs">
                                    <input type="text" placeholder="Nhập số..." maxLength={10} value={userAnswers[idx] || ''} onChange={(e) => handleShortResponseChange(idx, e.target.value)} disabled={isSubmitted} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            )}
                        </div>

                        {/* Feedback Section */}
                        {isSubmitted && (
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 animate-fade-in">
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm">
                                    <p className="font-bold text-emerald-600 mb-1">Đáp án đúng: {q.answer}</p>
                                    <p className="text-slate-600 dark:text-slate-300 italic">{q.explanation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};
