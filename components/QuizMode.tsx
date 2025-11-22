
import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedQuestion } from '../types';
import { QuestionType } from '../types';

interface QuizModeProps {
  questions: GeneratedQuestion[];
  onExit: () => void;
}

interface ScoreDetail {
  totalQuestions: number;
  correctCount: number;
  totalSubParts: number;
  correctSubParts: number;
  score: number;
  maxScore: number;
}

const normalize = (str: string) => str.trim().toLowerCase().replace(/[.,;]/g, '');

export const QuizMode: React.FC<QuizModeProps> = ({ questions, onExit }) => {
  // Time rule: 1.5 minutes per question
  const initialTime = questions.length > 0 ? Math.ceil(questions.length * 1.5 * 60) : 0;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  
  // Using 'any' for the timer ref to avoid TypeScript environment conflicts (Node vs Browser)
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isSubmitted || initialTime === 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, initialTime]);

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
    let score = 0;
    let correctCount = 0;
    let totalSubParts = 0;
    let correctSubParts = 0;
    let calculatedMaxScore = 0;

    questions.forEach((q, idx) => {
      const uAns = userAnswers[idx];
      
      if (q.type === QuestionType.MultipleChoice) {
        calculatedMaxScore += 0.25;
        const correctLetter = q.answer.split('.')[0].trim().toUpperCase(); 
        const userLetter = uAns ? uAns.split('.')[0].trim().toUpperCase() : "";
        
        if (userLetter === correctLetter) {
          score += 0.25;
          correctCount++;
        }
      } else if (q.type === QuestionType.ShortResponse) {
        calculatedMaxScore += 0.25;
        const cleanUser = normalize(uAns || "");
        const cleanCorrect = normalize(q.answer);
        
        const userNum = parseFloat(cleanUser);
        const correctNum = parseFloat(cleanCorrect);

        if (cleanUser === cleanCorrect || (!isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum)) {
          score += 0.25;
          correctCount++;
        }
      } else if (q.type === QuestionType.TrueFalse) {
        calculatedMaxScore += 1.0;
        const correctMap: Record<number, string> = {};
        const parts = ['a', 'b', 'c', 'd'];
        
        parts.forEach((p, pIdx) => {
            const regex = new RegExp(`${p}[).:]\\s*(Đúng|Sai|Đ|S|True|False)`, 'i');
            const match = q.answer.match(regex);
            if (match) {
                let val = match[1].toLowerCase();
                if (val.startsWith('đ') || val === 'true') correctMap[pIdx] = 'Đúng';
                else correctMap[pIdx] = 'Sai';
            } else {
                const simpleSplit = q.answer.split(/[,;]/).map(s => s.trim());
                if (simpleSplit[pIdx]) {
                     const s = simpleSplit[pIdx].toLowerCase();
                     correctMap[pIdx] = (s.startsWith('đ') || s === 'true') ? 'Đúng' : 'Sai';
                }
            }
        });

        let qCorrectSub = 0;
        parts.forEach((_, pIdx) => {
            totalSubParts++;
            const uSub = uAns?.[pIdx]; 
            const cSub = correctMap[pIdx];
            if (uSub && cSub && uSub === cSub) {
                qCorrectSub++;
                correctSubParts++;
            }
        });

        if (qCorrectSub === 1) score += 0.1;
        else if (qCorrectSub === 2) score += 0.25;
        else if (qCorrectSub === 3) score += 0.5;
        else if (qCorrectSub === 4) score += 1.0;
      }
    });

    return {
        totalQuestions: questions.length,
        correctCount,
        totalSubParts,
        correctSubParts,
        score: parseFloat(score.toFixed(2)),
        maxScore: parseFloat(calculatedMaxScore.toFixed(2))
    };
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitted(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const results = isSubmitted ? calculateScore() : null;

  if (!questions || questions.length === 0) return null;

  return (
    <div className="h-full flex flex-col relative bg-white dark:bg-slate-900 quiz-mode-container">
      {/* --- Header: Timer & Actions --- */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-4">
            <button onClick={onExit} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 text-sm font-bold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Thoát
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white hidden md:block">
                {isSubmitted ? "Kết Quả Bài Thi" : "Đang Làm Bài..."}
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
                    Nộp Bài
                </button>
             </div>
        ) : (
            <div className="flex items-center gap-3">
                <div className="text-right mr-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Điểm số</p>
                    <p className="text-2xl font-extrabold text-emerald-600 leading-none">{results?.score}</p>
                </div>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition shadow-lg"
                    title="Lưu PDF / In kết quả"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                    <span className="hidden sm:inline font-medium">Lưu PDF</span>
                </button>
            </div>
        )}
      </div>

      {/* --- Question Body --- */}
      <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar pb-20 print:p-0 print:pb-0 print:overflow-visible">
        
        <div className="hidden print-only mb-6 text-center border-b pb-4">
            <h1 className="text-2xl font-bold uppercase mb-2">Kết quả bài thi trắc nghiệm</h1>
            <div className="flex justify-center gap-8 text-sm">
                <p>Ngày thi: {new Date().toLocaleDateString('vi-VN')}</p>
                <p>Điểm số: <span className="font-bold text-xl">{results?.score}/{results?.maxScore}</span></p>
            </div>
        </div>

        {isSubmitted && (
             <div className="mb-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-center animate-fade-in no-print">
                 <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-6">Tổng Kết Bài Thi</h3>
                 <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-700">
                        <span className="block text-xs text-emerald-600/80 dark:text-emerald-400/80 uppercase font-bold tracking-wide mb-1">Điểm Tổng</span>
                        <span className="block text-3xl font-black text-emerald-600 dark:text-emerald-400">{results?.score}</span>
                        <span className="text-xs text-slate-400">trên thang {results?.maxScore}</span>
                    </div>
                     <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-700">
                        <span className="block text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Số câu đúng</span>
                        <span className="block text-xl font-bold text-slate-700 dark:text-slate-200">{results?.correctCount}</span>
                        <span className="text-xs text-slate-400">MCQ & Short Response</span>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-emerald-100 dark:border-slate-700">
                        <span className="block text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">Ý đúng/sai</span>
                        <span className="block text-xl font-bold text-slate-700 dark:text-slate-200">{results?.correctSubParts}/{results?.totalSubParts}</span>
                        <span className="text-xs text-slate-400">Trong phần True/False</span>
                    </div>
                 </div>
             </div>
        )}

        <div className="space-y-8 max-w-4xl mx-auto print:max-w-full print:space-y-4">
            {questions.map((q, idx) => (
                <div key={idx} className="question-block p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden print:border-gray-300 print:shadow-none print:p-2">
                    <div className={`absolute top-0 left-0 w-1 h-full no-print ${isSubmitted ? 'bg-slate-200 dark:bg-slate-700' : 'bg-sky-500'}`}></div>

                    <div className="flex justify-between items-start mb-4 pl-2 print:pl-0">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex gap-2 items-center">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm text-sm print:border print:bg-transparent print:text-black">Câu {idx + 1}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border print:hidden ${
                                q.type === QuestionType.MultipleChoice ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                                q.type === QuestionType.TrueFalse ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                            }`}>
                                {q.type}
                            </span>
                        </h3>
                    </div>
                    
                    <div className="mb-6 text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium pl-2 print:pl-0 print:text-black print:text-sm">
                        {q.question}
                    </div>

                    <div className="pl-2 print:pl-0">
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
                                                         ? (val === 'Đúng' ? 'bg-green-100 text-green-700 border-green-300 ring-1 ring-green-300 print:text-black print:bg-transparent print:border-black' : 'bg-red-100 text-red-700 border-red-300 ring-1 ring-red-300 print:text-black print:bg-transparent print:border-black') 
                                                         : 'bg-white dark:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 print:bg-transparent print:text-gray-400 print:border-gray-300'
                                                     }`}>
                                                         <input 
                                                            type="radio" 
                                                            name={`q-${idx}-sub-${oIdx}`}
                                                            disabled={isSubmitted}
                                                            checked={subVal === val}
                                                            onChange={() => handleTrueFalseSelect(idx, oIdx, val)}
                                                            className="hidden print:inline-block print:mr-1"
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

                        {q.type === QuestionType.ShortResponse && (
                            <div className="max-w-xs print:max-w-full">
                                <label className="block text-sm font-bold text-slate-500 uppercase mb-2 print:text-black">Câu trả lời của bạn</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Nhập số..."
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

                    {isSubmitted && (
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in print:mt-2 print:pt-2 print:border-gray-300">
                             {q.type === QuestionType.MultipleChoice && (
                                 <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 print:border print:bg-white print:text-black">
                                    <div className="flex flex-wrap gap-4 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">Bạn chọn:</span>
                                            <span className={`${(userAnswers[idx] && userAnswers[idx].split('.')[0].trim().toUpperCase() === q.answer.split('.')[0].trim().toUpperCase()) ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' : 'text-red-500 bg-red-100 dark:bg-red-900/30'} px-2 py-0.5 rounded font-bold print:bg-transparent print:border`}>
                                                {userAnswers[idx] ? userAnswers[idx].split('.')[0].trim().toUpperCase() : "Trống"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">Đáp án đúng:</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 print:bg-transparent print:border print:text-black">{q.answer}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Giải thích:</span>
                                        <p className="text-slate-700 dark:text-slate-300 mt-1 italic">{q.explanation || "Không có giải thích chi tiết."}</p>
                                    </div>
                                </div>
                             )}
                             {q.type === QuestionType.ShortResponse && (
                                 <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 print:border print:bg-white">
                                    <div className="flex flex-wrap gap-4 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">Bạn điền:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">
                                                {userAnswers[idx] || "Trống"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-600 dark:text-slate-400">Đáp án đúng:</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold print:text-black">{q.answer}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Giải thích:</span>
                                        <p className="text-slate-700 dark:text-slate-300 mt-1 italic">{q.explanation}</p>
                                    </div>
                                </div>
                             )}
                             {q.type === QuestionType.TrueFalse && (
                                 <div className="mt-3">
                                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 print:border">
                                        <table className="min-w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 print:bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2 print:border print:text-black">Mệnh đề</th>
                                                    <th className="px-4 py-2 print:border print:text-black">Bạn chọn</th>
                                                    <th className="px-4 py-2 print:border print:text-black">Đáp án</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {['a', 'b', 'c', 'd'].map((p, pIdx) => {
                                                    const uChoice = userAnswers[idx]?.[pIdx];
                                                    // Re-calculate correct choice for display logic simplified here for brevity in JSX
                                                    let cChoice = 'N/A';
                                                    const match = q.answer.match(new RegExp(`${p}[).:]\\s*(Đúng|Sai|Đ|S|True|False)`, 'i'));
                                                    if (match) cChoice = (match[1].toLowerCase().startsWith('đ') || match[1].toLowerCase() === 'true') ? 'Đúng' : 'Sai';
                                                    
                                                    const isCorrect = uChoice === cChoice;
                                                    return (
                                                        <tr key={pIdx} className="border-b border-slate-100 dark:border-slate-700 last:border-0 print:border-gray-300">
                                                            <td className="px-4 py-2 font-bold print:border">{p}</td>
                                                            <td className="px-4 py-2 print:border">
                                                                <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'} print:text-black`}>
                                                                    {uChoice || "-"} {isCorrect ? '✓' : (uChoice ? '✗' : '')}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 font-bold text-emerald-600 print:border print:text-black">{cChoice}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                     <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm print:bg-white print:border">
                                         <span className="text-xs font-bold text-slate-500 uppercase">Giải thích:</span>
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
