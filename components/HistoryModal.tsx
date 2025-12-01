import React, { useEffect, useState } from 'react';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';
import { getExamHistory, clearExamHistory } from '../services/historyService';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { QuizMode } from './QuizMode';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadHistory();
    }
  }, [isOpen, user]);

  const loadHistory = () => {
      setIsLoading(true);
      getExamHistory(user)
        .then(setHistory)
        .catch(err => console.error("History load error", err))
        .finally(() => setIsLoading(false));
  };

  const handleClearHistory = async () => {
      if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử bài thi không? Hành động này không thể hoàn tác.")) {
          setIsLoading(true);
          try {
              await clearExamHistory(user);
              setHistory([]);
          } catch (err) {
              alert("Lỗi khi xóa lịch sử.");
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleSelectExam = (exam: ExamResult) => {
      if (exam.questionsData && exam.questionsData.length > 0) {
          setSelectedExam(exam);
      } else {
          alert("Bài thi này không có dữ liệu chi tiết để xem lại.");
      }
  };

  if (selectedExam && selectedExam.questionsData) {
      return (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 overflow-hidden flex flex-col animate-fade-in">
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 shadow-sm">
                 <button 
                    onClick={() => setSelectedExam(null)}
                    className="text-slate-600 hover:text-sky-600 font-bold flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                     Quay lại
                 </button>
                 <div className="text-center">
                     <h2 className="font-bold text-slate-800 dark:text-white text-lg">Xem lại bài thi</h2>
                     <p className="text-xs text-slate-500">{new Date(selectedExam.timestamp).toLocaleString('vi-VN')}</p>
                 </div>
                 <div className="w-20"></div>
             </div>

             <div className="flex-grow relative">
                <QuizMode 
                    questions={selectedExam.questionsData} 
                    user={user} 
                    onExit={() => setSelectedExam(null)}
                    initialUserAnswers={selectedExam.userAnswers}
                    readOnly={true}
                />
             </div>
        </div>
      );
  }

  if (!isOpen) return null;

  const totalExams = history.length;
  const avgScore = totalExams > 0 
    ? (history.reduce((acc, curr) => acc + curr.score, 0) / totalExams).toFixed(1) 
    : "0";
  const maxScore = totalExams > 0 
    ? Math.max(...history.map(h => h.score)) 
    : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('history.title')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('history.subtitle')}</p>
            </div>
            <div className="flex gap-2">
                {history.length > 0 && (
                    <button 
                        onClick={handleClearHistory}
                        className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                    >
                        Xóa lịch sử
                    </button>
                )}
                <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>
        </div>

        {isLoading ? (
             <div className="p-12 flex justify-center"><LoadingSpinner /></div>
        ) : (
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 text-center">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">{t('history.exams_count')}</p>
                        <p className="text-3xl font-black text-blue-800 dark:text-blue-200">{totalExams}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-center">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{t('history.avg_score')}</p>
                        <p className="text-3xl font-black text-emerald-800 dark:text-emerald-200">{avgScore}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 text-center">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">{t('history.max_score')}</p>
                        <p className="text-3xl font-black text-purple-800 dark:text-purple-200">{maxScore}</p>
                    </div>
                </div>

                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide border-b pb-2 border-slate-100 dark:border-slate-800">
                    {t('history.list_title')}
                </h3>
                
                {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        {t('history.empty')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item, idx) => (
                            <div 
                                key={item.id || idx} 
                                onClick={() => handleSelectExam(item)}
                                className={`flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all ${item.questionsData ? 'cursor-pointer hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/10' : 'opacity-70 cursor-not-allowed bg-slate-50'}`}
                                title={item.questionsData ? "Nhấn để xem lại bài thi" : "Không có dữ liệu chi tiết"}
                            >
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                            {item.chapterSummary || "Bài tập tổng hợp"}
                                        </span>
                                        {item.questionsData ? (
                                            <span className="text-[10px] bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800">Xem lại</span>
                                        ) : (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Không chi tiết</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <span className={`text-lg font-black ${item.score >= 8 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                            {item.score}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">/10</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
