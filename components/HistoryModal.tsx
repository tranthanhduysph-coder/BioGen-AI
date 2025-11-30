import React, { useEffect, useState } from 'react';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';
import { getExamHistory } from '../services/historyService';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getExamHistory(user)
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to load history", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Calculate Statistics
  const totalExams = history.length;
  const avgScore = totalExams > 0 
    ? (history.reduce((acc, curr) => acc + curr.score, 0) / totalExams).toFixed(1) 
    : "0";
  const maxScore = totalExams > 0 
    ? Math.max(...history.map(h => h.score)) 
    : 0;

  // Generate simple SVG chart data
  const chartData = history.slice(0, 10).reverse(); // Show last 10 exams chronologically
  const chartHeight = 60;
  const chartWidth = 200;
  const points = chartData.map((h, i) => {
      const x = (i / (Math.max(chartData.length - 1, 1))) * chartWidth;
      const y = chartHeight - (h.score / 10) * chartHeight;
      return `${x},${y}`;
  }).join(' ');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('history.title')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('history.subtitle')}</p>
            </div>
            <button 
                onClick={onClose}
                className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>

        {isLoading ? (
             <div className="p-12"><LoadingSpinner /></div>
        ) : (
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800/50">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">{t('history.exams_count')}</p>
                        <p className="text-3xl font-black text-blue-800 dark:text-blue-200">{totalExams}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{t('history.avg_score')}</p>
                        <p className="text-3xl font-black text-emerald-800 dark:text-emerald-200">{avgScore}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 relative overflow-hidden">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">{t('history.max_score')}</p>
                        <p className="text-3xl font-black text-purple-800 dark:text-purple-200">{maxScore}</p>
                        
                        {chartData.length > 1 && (
                            <svg className="absolute bottom-0 right-0 opacity-30 w-24 h-12 text-purple-600" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                                <polyline fill="none" stroke="currentColor" strokeWidth="4" points={points} />
                            </svg>
                        )}
                    </div>
                </div>

                {/* History List */}
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                    {t('history.list_title')}
                </h3>
                
                {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        {t('history.empty')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item, idx) => (
                            <div key={item.id || idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.chapterSummary}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(item.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className={`text-lg font-black ${item.score >= 8 ? 'text-emerald-600' : (item.score >= 5 ? 'text-sky-600' : 'text-red-500')}`}>
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
