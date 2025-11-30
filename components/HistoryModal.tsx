import React, { useEffect, useState } from 'react';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';
import { getExamHistory } from '../services/historyService';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { QuizMode } from './QuizMode'; // Import to reuse UI

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
      setIsLoading(true);
      getExamHistory(user)
        .then(setHistory)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // If an exam is selected, show Review Mode
  if (selectedExam && selectedExam.questionsData) {
      return (
          <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 overflow-hidden">
              <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <button onClick={() => setSelectedExam(null)} className="text-slate-500 hover:text-sky-600 font-bold flex items-center gap-1">
                          ← Quay lại danh sách
                      </button>
                      <h2 className="font-bold text-slate-800 dark:text-white">Xem lại bài thi</h2>
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
          </div>
      );
  }

  // Normal History List View
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('history.title')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('history.subtitle')}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>

        {isLoading ? (
             <div className="p-12 flex justify-center"><LoadingSpinner /></div>
        ) : (
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                {/* ... Stats Cards (Keep existing code) ... */}
                
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-sm uppercase tracking-wide border-b pb-2 border-slate-100 dark:border-slate-800">
                    {t('history.list_title')}
                </h3>
                
                {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">{t('history.empty')}</div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item, idx) => (
                            <div key={item.id || idx} 
                                 onClick={() => item.questionsData && setSelectedExam(item)}
                                 className={`flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-shadow ${item.questionsData ? 'cursor-pointer hover:shadow-md hover:border-sky-300' : ''}`}
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                            {item.chapterSummary || "Bài tập"}
                                        </span>
                                        {item.questionsData && <span className="text-[10px] bg-sky-100 text-sky-600 px-1.5 rounded">Xem lại</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
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
