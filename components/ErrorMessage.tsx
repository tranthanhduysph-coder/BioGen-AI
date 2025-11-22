
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-4">
         <AlertTriangleIcon className="w-10 h-10 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Đã xảy ra lỗi</h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">{message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition"
      >
        Tải lại trang
      </button>
    </div>
  );
};