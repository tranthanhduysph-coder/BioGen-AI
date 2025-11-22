
import React from 'react';

const BulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7.5a6 6 0 0 0-12 0c0 1.5.3 2.7 1.5 3.9.8.8 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
);

export const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 dark:text-slate-400 p-6">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-full mb-6 animate-bounce-slow">
          <BulbIcon className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">Chào mừng bạn đến với BioGen AI</h2>
      <p className="max-w-md leading-relaxed text-slate-600 dark:text-slate-400">
        Công cụ hỗ trợ giáo viên và học sinh tạo đề trắc nghiệm Sinh học tự động.
        <br/><br/>
        Hãy chọn <strong>Chương</strong>, <strong>Mức độ</strong>, và <strong>Năng lực</strong> ở bảng bên trái để bắt đầu.
      </p>
    </div>
  );
};