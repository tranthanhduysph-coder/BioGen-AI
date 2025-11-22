
import React, { useState } from 'react';
import type { GeneratedQuestion } from '../types';
import { QuestionType } from '../types';

interface QuestionDisplayProps {
  question: GeneratedQuestion;
  index: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, index }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let text = `Câu ${index}: ${question.question}\n`;
    
    if (question.options && question.options.length > 0) {
         question.options.forEach((opt) => {
             text += `${opt}\n`;
         });
    }
    
    text += `\nĐáp án: ${question.answer}\n`;
    if (question.explanation) {
        text += `Giải thích: ${question.explanation}`;
    }

    try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
  };

  const renderTypeBadge = () => {
    let colorClass = "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
    if (question.type === QuestionType.TrueFalse) colorClass = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    if (question.type === QuestionType.ShortResponse) colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    if (question.type === QuestionType.MultipleChoice) colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";

    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${colorClass}`}>
        {question.type}
      </span>
    );
  };

  const renderOptions = () => {
    if (!question.options || question.options.length === 0) {
        if (question.type === QuestionType.ShortResponse) {
             return (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg border-dashed flex items-center justify-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400 italic">Điền đáp án số (tối đa 4 ký tự)</span>
                </div>
             )
        }
        return null;
    }
    
    if (question.type === QuestionType.TrueFalse) {
      return (
        <div className="grid grid-cols-1 gap-3 mt-4">
          {question.options.map((option, i) => (
            <div key={i} className="flex items-start p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded shadow-sm mr-3 border border-slate-200 dark:border-slate-600">
                  {String.fromCharCode(97 + i)}
              </span>
              <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">{option}</p>
            </div>
          ))}
        </div>
      );
    }
    
    if (question.type === QuestionType.MultipleChoice) {
      return (
        <div className="grid grid-cols-1 gap-3 mt-4">
          {question.options.map((option, i) => (
            <div key={i} className="group flex items-start p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-900/20 border border-transparent hover:border-sky-200 dark:hover:border-sky-800 rounded-xl cursor-pointer transition-all">
               <div className="flex-1">
                 <p className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white text-sm md:text-base font-medium">{option}</p>
               </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 animate-fade-in relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 dark:bg-slate-700 group-hover:bg-sky-500 transition-colors"></div>
      
      <div className="flex justify-between items-start mb-4">
         <div className="flex items-center gap-2">
             <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-400 font-bold text-sm">
                {index}
             </span>
             {renderTypeBadge()}
         </div>
         <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            title="Sao chép câu hỏi"
         >
            {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
         </button>
      </div>

      <p className="font-medium text-lg text-slate-800 dark:text-slate-100 leading-relaxed">
         {question.question}
      </p>
      
      {renderOptions()}

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex items-center text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 transition gap-1.5"
        >
          {showAnswer ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                Ẩn Đáp Án
              </>
          ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Xem Đáp Án & Giải Thích
              </>
          )}
        </button>

        {showAnswer && (
          <div className="mt-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl animate-fade-in">
            <div className="flex flex-col gap-3">
                <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đáp án đúng</span>
                    <p className="text-emerald-800 dark:text-emerald-200 font-bold text-lg mt-1">{question.answer}</p>
                </div>
                {question.explanation && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Giải thích chi tiết</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed text-sm md:text-base">{question.explanation}</p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
