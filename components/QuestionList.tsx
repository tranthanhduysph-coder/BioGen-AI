
import React, { useState } from 'react';
import type { GeneratedQuestion } from '../types';
import { QuestionDisplay } from './QuestionDisplay';
import { exportToDocx } from '../services/docxService';
import { QuizMode } from './QuizMode';

interface QuestionListProps {
  questions: GeneratedQuestion[];
  isQuizMode: boolean;
  setQuizMode: (mode: boolean) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({ questions, isQuizMode, setQuizMode }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
        setIsExporting(true);
        await exportToDocx(questions);
    } catch (error) {
        console.error("Failed to export docx", error);
        alert("Có lỗi khi tạo file Word. Vui lòng thử lại.");
    } finally {
        setIsExporting(false);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 flex-grow flex items-center justify-center p-10">
        <div className="max-w-sm">
            <p className="text-lg mb-2">Chưa có dữ liệu</p>
            <p className="text-sm opacity-80">Hãy thêm cấu hình vào danh sách và nhấn "Tạo" để bắt đầu.</p>
        </div>
      </div>
    );
  }

  // If Quiz Mode is active, render it fully
  if (isQuizMode) {
      return <QuizMode questions={questions} onExit={() => setQuizMode(false)} />;
  }

  return (
    <div className="h-full flex flex-col">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 px-1 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-sky-500 to-blue-600 w-1.5 h-6 rounded-full"></span>
            Đề thi đã tạo
          </h2>
          
          <div className="flex items-center gap-3 flex-wrap">
             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                {questions.length} câu
             </span>
             
             <button 
                onClick={() => setQuizMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
                title="Chuyển sang chế độ làm bài thi"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 7.472-4.981a.464.464 0 0 1 .687.56l-2.894 8.268a.464.464 0 0 1-.88 0l-2.894-8.268a.464.464 0 0 1 .687-.56L12 14Zm0 0V3"/></svg>
                Làm bài thi
             </button>

             <button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-md shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                title="Tải file Word (.docx)"
             >
                {isExporting ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                )}
                Tải DOCX
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
