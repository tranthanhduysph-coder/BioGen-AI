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

// ... Score Detail Interface & Normalize Helper ...
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

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return (
          <div className="p-8 text-center">
              <p className="text-red-500">Không có dữ liệu câu hỏi.</p>
              <button onClick={onExit} className="mt-4 text-blue-500 underline">Quay lại</button>
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

  // ... Answer Handlers ...
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

  // ... Score Calculation ...
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
    if (!readOnly) handleSaveResult();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handlePrint = () => window.print();
  const results = isSubmitted ? calculateScore() : null;

  // --- Full Screen Overlay for Quiz ---
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] overflow-auto flex flex-col">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm no-print">
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
                 <div className="text-right mr-1 hidden sm:block">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Điểm</p>
                    <span className="text-xl font-black text-emerald-600">{results?.score}</span>
                 </div>
                 <button onClick={handlePrint} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg></button>
             </div>
         )}
      </div>

      {/* Quiz Content */}
      <div className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
         {/* Summary if submitted */}
         {isSubmitted && results && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-emerald-100 dark:border-emerald-900 mb-8 text-center no-print">
                <h3 className="text-2xl font-bold text-emerald-600 mb-4">{t('quiz.summary_title')}</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <span className="text-xs font-bold uppercase text-slate-500">Tổng điểm</span>
                        <div className="text-3xl font-black text-emerald-700">{results.score}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-xs font-bold uppercase text-slate-500">Số câu đúng</span>
                        <div className="text-xl font-bold text-slate-700">{results.correctCount}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <span className="text-xs font-bold uppercase text-slate-500">Ý đúng/sai</span>
                        <div className="text-xl font-bold text-slate-700">{results.correctSubParts}/{results.totalSubParts}</div>
                    </div>
                </div>
            </div>
         )}

         {/* Question List */}
         <div className="space-y-8 pb-20">
            {questions.map((q, idx) => (
                <div key={idx} className="question-block bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative
