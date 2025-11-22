
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-600 dark:text-slate-300 font-bold text-lg animate-pulse">AI đang suy nghĩ...</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Đang phân tích dữ liệu và tạo câu hỏi</p>
    </div>
  );
};