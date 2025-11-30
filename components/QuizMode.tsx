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
}

interface ScoreDetail {
  totalQuestions: number;
  correctCount: number;
  totalSubParts: number;
  correctSubParts: number;
  score: number;
  rawScore: number;
  maxRawScore: number;
}

// Safe normalization helper
const normalize = (str: string) => {
    if (!str) return "";
    return String(str).trim().toLowerCase().replace(/[.,;]/g, '');
};

export const QuizMode: React.FC<QuizModeProps> = ({ questions, onExit, user }) => {
  const { t } = useTranslation();
  
  // Ensure questions exist before processing
  if (!questions || questions.length === 0) {
      return (
          <div className="p-8 text-center">
              <p className="text-red-500">Không có dữ liệu câu hỏi.</p>
              <button onClick={onExit} className="mt-4 text-blue-500 underline">Quay lại</button>
          </div>
      );
  }

  // Timer logic: 1.5 mins per question
  const initialTime = Math.ceil(questions.length * 1.5 * 60);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isSubmitted) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit(); // Auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (qIndex: number, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleTrueFalseSelect = (qIndex: number, subIndex: number, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qIndex]: {
        ...(prev[qIndex] || {}),
        [subIndex]: value
      }
    }));
  };
  
  const handleShortResponseChange = (qIndex: number, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const calculateScore = (): ScoreDetail => {
    let rawScore = 0;
    let maxRawScore = 0;
    let correctCount = 0;
    let totalSubParts = 0;
    let correctSubParts = 0;

    questions.forEach((q, idx) => {
      const uAns = userAnswers[idx];
      
      if (q.type === QuestionType.MultipleChoice) {
        const weight = 0.25;
        maxRawScore += weight;
        
        const correctLetter = q.answer ? q.answer.split('.')[0].trim().toUpperCase() : ""; 
        const userLetter = uAns ? String(uAns).split('.')[0].trim().toUpperCase() : "";
        
        if (userLetter && userLetter === correctLetter) {
          rawScore += weight;
          correctCount++;
        }
      } else if (q.type === QuestionType.ShortResponse) {
        const weight = 0.25;
        maxRawScore += weight;

        const cleanUser = normalize(uAns);
        const cleanCorrect = normalize(q.answer);
        
        // Flexible numeric check
        const userNum = parseFloat(cleanUser);
        const correctNum = parseFloat(cleanCorrect);

        const isCorrect = (cleanUser === cleanCorrect) || 
                          (!isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.01);

        if (isCorrect) {
          rawScore += weight;
          correctCount++;
        }
      } else if (q.type === QuestionType.TrueFalse) {
        const weight = 1.0;
        maxRawScore += weight;

        const correctMap: Record<number, string> = {};
        const parts = ['a', 'b', 'c', 'd'];
        
        parts.forEach((p, pIdx) => {
            // Robust parsing for answers like "a) Đúng, b) Sai..." or "a) True..."
            const regex = new RegExp(`${p}[).:]\\s*(Đúng|Sai|Đ|S|True|False)`, 'i');
            const match = q.answer.match(regex);
            if (match) {
                let val = match[1].toLowerCase();
                if (val.startsWith('đ') || val === 'true') correctMap[pIdx] = 'Đúng';
                else correctMap[pIdx] = 'Sai';
            } else {
                 // Fallback simple split if regex fails
                 correctMap[pIdx] = 'N/A'; 
            }
        });

        let qCorrectSub = 0;
        parts.forEach((_, pIdx) => {
            totalSubParts++;
            const uSub = uAns?.[pIdx]; 
            const cSub = correctMap[pIdx];
            
            // Normalizing user input map to standard 'Đúng'/'Sai'
            let normalizedUser = '';
            if (uSub === 'Đúng' || uSub === 'True') normalizedUser = 'Đúng';
            if (uSub === 'Sai' || uSub === 'False') normalizedUser = 'Sai';

            if (normalizedUser && cSub && normalizedUser === cSub) {
                qCorrectSub++;
                correctSubParts++;
            }
        });

        // 2025 Grading Rule
        if (qCorrectSub === 1) rawScore += 0.1;
        else if (qCorrectSub === 2) rawScore += 0.25;
        else if (qCorrectSub === 3) rawScore += 0.5;
        else if (qCorrectSub === 4) rawScore += 1.0;
      }
    });

    const normalizedScore = maxRawScore > 0 ? (rawScore / maxRawScore) * 10 : 0;

    return {
        totalQuestions: questions.length,
        correctCount,
        totalSubParts,
        correctSubParts,
        score: parseFloat(normalizedScore.toFixed(2)),
        rawScore: parseFloat(rawScore.toFixed(2)),
        maxRawScore: parseFloat(maxRawScore.toFixed(2))
    };
  };

  // Handlers
  const handleSaveResult = async () => {
      if (isSaving) return;
      setIsSaving(true);
      const results = calculateScore();
      const chapterSummary = questions[0]?.criteria?.chapter 
        ? t(`constants.chapters.${questions[0].criteria.chapter}`, { defaultValue: questions[0].criteria.chapter }) 
        : "Mixed Exam";
      
      try {
          await saveExamResult(user, {
              timestamp: Date.now(),
              score: results.score,
              totalQuestions: results.totalQuestions,
              correctCount: results.correctCount,
              chapterSummary: chapterSummary
          });
          alert(t('quiz.saved_success', 'Đã lưu kết quả!'));
      } catch (error) {
          console.error("Save failed", error);
      } finally {
          setIsSaving(false);
      }
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitted(true);
    // Auto save on submit is optional, but let's do it for UX
    handleSaveResult();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const results = isSubmitted ? calculateScore() : null;

  return (
    <div className="h-full flex flex-col relative bg-white dark:bg-slate-900 quiz-mode-container">
      
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-4">
            <button onClick={onExit} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 text-sm font-bold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                {t('quiz.exit')}
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white hidden md:block">
                {isSubmitted ? t('quiz.title_result') : t('quiz.title_working')}
            </h2>
        </div>

        {!isSubmitted ? (
             <div className="flex items-center gap-4">
                 <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-lg border shadow-sm transition-all ${timeLeft < 60 ? 'text-red-500 border-red-200 bg-red-50 animate-pulse' : 'text-sky-600 border-sky-200 bg-sky-50 dark:bg-slate-800 dark:border-sky-900'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {formatTime(timeLeft)}
                </div>
                <button 
                    onClick={handleSubmit}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-sky-500/20 transition-colors"
                >
                    {t('quiz.submit')}
                </button>
             </div>
        ) : (
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleSaveResult}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-70 text-sm font-bold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    {isSaving ? t('quiz.saving') : t('quiz.save')}
                </button>
                
                <div className="text-right mr-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('quiz.score')}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-emerald-600 leading-none">{results?.score}</span>
                        <span className="text-xs font-bold text-slate-400">/10</span>
                    </div>
                </div>
                
                <button 
                    onClick={handlePrint}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                    title={t('quiz.save_pdf')}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                </button>
            </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar pb-20 print:p-0 print:pb-0 print:overflow-visible">
        
        {/* Print Header */}
        <div className="hidden print-only mb-6 text-center border-b pb-4">
            <h1 className="text-2xl font-bold uppercase mb-2">{t('quiz.header_print')}</h1>
            <div className="flex justify-center gap-8 text-sm">
                <p>{t('quiz.date')}: {new Date().toLocaleDateString('vi-VN')}</p>
                <p>{t('quiz.score')}: <span className="font-bold text-xl">{results?.score}/10</span></p>
            </div>
        </div>

        {/* Results Summary */}
        {isSubmitted && results && (
             <div className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-center animate-fade-in no-print">
                 <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-6">{t('quiz.summary_title')}</h3>
                 <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-700">
                        <span className="block text-xs text-emerald-600/80 dark:text-emerald-400/80 uppercase font-bold tracking-wide mb-1">{t('quiz.total_score')}</span>
                        <span className="block text-3xl font-black text-emerald-600 dark:text-emerald-400">{results.score}</span>
                        <span className="text-xs text-slate-400">{t('quiz.scale_10')}</span>
                    </div>
                     <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-700">
                        <span className="block text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">{t('quiz.correct_qs')}</span>
                        <span className="block text-xl font-bold text-slate-700 dark:text-slate-200">{results.correctCount}</span>
                        <span className="text-xs text-slate-400">{t('quiz.mcq_short')}</span>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-700">
                        <span className="block text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">{t('quiz.correct_sub')}</span>
                        <span className="block text-xl font-bold text-slate-700 dark:text-slate-200">{results.correctSubParts}/{results.totalSubParts}</span>
                        <span className="text-xs text-slate-400">{t('quiz.in_tf')}</span>
                    </div>
                 </div>
             </div>
        )}

        {/* Questions List */}
        <div className="space-y-8 max-w-4xl mx-auto print:max-w-full print:space-y-4">
            {questions.map((q, idx) => (
                <div key={idx} className="question-block p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden print:border-gray-300 print:shadow-none print:p-2">
                    <div className={`absolute top-0 left-0 w-1 h-full no-print ${isSubmitted ? 'bg-slate-200 dark:bg-slate-700' : 'bg-sky-500'}`}></div>

                    <div className="flex justify-between items-start mb-4 pl-2 print:pl-0">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex gap-2 items-center">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm text-sm print:border print:bg-transparent print:text-black">{t('quiz.q_label')} {idx + 1}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border print:hidden ${
                                q.type === QuestionType.MultipleChoice ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                q.type === QuestionType.TrueFalse ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                            }`}>
                                {t(`constants.types.${q.type === QuestionType.MultipleChoice ? 'type_mcq' : q.type === QuestionType.TrueFalse ? 'type_tf' : 'type_short'}`).split('(')[0]}
                            </span>
                        </h3>
                    </div>
                    
                    <div className="mb-6 text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium pl-2 print:pl-0 print:text-black print:text-sm">
                        {q.question}
                    </div>

                    {/* Answer Options */}
                    <div className="pl-2 print:pl-0">
                        
                        {/* MCQ */}
                        {q.type === QuestionType.MultipleChoice && (
                            <div className="space-y-3 print:space-y-1">
                                {q.options.map((opt, oIdx) => {
                                    const isSelected = userAnswers[idx] === opt;
                                    return (
                                        <label key={oIdx} className={`flex items-start p-3.5 rounded-xl cursor-pointer border transition-all group print:p-1 print:border-none ${
                                            isSelected 
                                            ? 'bg-sky-50 border-sky-300 dark:bg-sky-900/20 dark:border-sky-700 ring-1 ring-sky-200 dark:ring-sky-800 print:bg-transparent print:ring-0' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 print:border-none'
                                        }`}>
                                            <div className="flex items-center h-5">
                                                <input 
                                                    type="radio" 
                                                    name={`q-${idx}`} 
                                                    value={opt} 
                                                    checked={isSelected}
                                                    disabled={isSubmitted}
                                                    onChange={() => handleOptionSelect(idx, opt)}
                                                    className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-gray-300 dark:border-slate-600 dark:bg-slate-700 print:text-black"
                                                />
                                            </div>
                                            <span className={`ml-3 text-sm md:text-base print:text-sm ${isSelected ? 'text-sky-900 dark:text-sky-100 font-medium print:font-bold print:text-black' : 'text-slate-700 dark:text-slate-300 print:text-black'}`}>
                                                {opt}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        )}

                        {/* True/False */}
                        {q.type === QuestionType.TrueFalse && (
                             <div className="grid grid-cols-1 gap-4 print:gap-2">
                                 {q.options.map((opt, oIdx) => {
                                     const subVal = userAnswers[idx]?.[oIdx];
                                     return (
                                         <div key={oIdx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 print:p-1 print:bg-transparent print:border-0">
                                             <div className="flex gap-3 mb-3 md:mb-0 print:mb-0">
                                                <span className="shrink-0 font-bold text-slate-500 bg-white dark:bg-slate-700 w-6 h-6 flex items-center justify-center rounded text-xs shadow-sm border border-slate-200 dark:border-slate-600 uppercase print:border-gray-400 print:text-black print:bg-transparent">{String.fromCharCode(97 + oIdx)}</span>
                                                <span className="text-slate-700 dark:text-slate-300 text-sm md:text-base print:text-black">{opt}</span>
                                             </div>
                                             <div className="flex gap-2 shrink-0 ml-9 md:ml-0 print:ml-4">
                                                 {['Đúng', 'Sai'].map((val) => (
                                                     <label key={val} className={`cursor-pointer px-4 py-1.5 rounded-lg border text-sm font-bold transition-all shadow-sm print:shadow-none print:px-2 print:py-0 ${
                                                         subVal === val 
                                                         ? (val === 'Đúng' ? 'bg-green-100 text-green-700 border-green-300 ring-1 ring-green-300' : 'bg-red-100 text-red-700 border-red-300 ring-1 ring-red-300') 
                                                         : 'bg-white dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                                                     }`}>
                                                         <input 
                                                            type="radio" 
                                                            name={`q-${idx}-sub-${oIdx}`}
                                                            disabled={isSubmitted}
                                                            checked={subVal === val}
                                                            onChange={() => handleTrueFalseSelect(idx, oIdx, val)}
                                                            className="hidden"
                                                         />
                                                         {val}
                                                     </label>
                                                 ))}
                                             </div>
                                         </div>
                                     )
                                 })}
                             </div>
                        )}

                        {/* Short Response */}
                        {q.type === QuestionType.ShortResponse && (
                            <div className="max-w-xs print:max-w-full">
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-2 print:text-black">{t('quiz.label_short_yours')}</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder={t('quiz.placeholder_short')}
                                        maxLength={10}
                                        disabled={isSubmitted}
                                        value={userAnswers[idx] || ''}
                                        onChange={(e) => handleShortResponseChange(idx, e.target.value)}
                                        className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all font-mono text-lg shadow-sm print:border-black print:text-black print:shadow-none print:p-1"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FEEDBACK SECTION (Submitted) */}
                    {isSubmitted && (
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in print:mt-2 print:pt-2 print:border-gray-300">
                             {q.type === QuestionType.MultipleChoice && (
                                 <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 print:border print:bg-white print:text-black">
                                    <div className="flex flex-wrap gap-4 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">{t('quiz.your_answer')}</span>
                                            <span className={`${(userAnswers[idx] && userAnswers[idx].split('.')[0].trim().toUpperCase() === q.answer.split('.')[0].trim().toUpperCase()) ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' : 'text-red-500 bg-red-100 dark:bg-red-900/30'} px-2 py-0.5 rounded font-bold print:bg-transparent print:border`}>
                                                {userAnswers[idx] ? userAnswers[idx].split('.')[0].trim().toUpperCase() : "Trống"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">{t('quiz.correct_answer')}</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 print:bg-transparent print:border print:text-black">{q.answer}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-500 uppercase">{t('quiz.explanation_short')}</span>
                                        <p className="text-slate-700 dark:text-slate-300 mt-1 italic">{q.explanation || t('quiz.no_explanation')}</p>
                                    </div>
                                </div>
                             )}
                             {/* ... (Similar feedback for Short & TF) ... */}
                             {q.type === QuestionType.TrueFalse && (
                                 <div className="mt-3">
                                     <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm print:bg-white print:border">
                                         <span className="text-xs font-bold text-slate-500 uppercase">{t('quiz.explanation_short')}</span>
                                         <p className="text-slate-700 dark:text-slate-300 mt-1 italic print:text-black">{q.explanation}</p>
                                    </div>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
