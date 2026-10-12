import React, { useState } from 'react';

export const BannerAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="container mx-auto px-4 mt-6 mb-2 print:hidden">
      <div className="relative w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-[2px] shadow-md group">
        
        <button 
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-500 hover:text-white transition shadow-sm z-10"
            title="Đóng quảng cáo"
        >
            ✕
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-[10px] overflow-hidden flex flex-col items-center justify-center py-4 px-6 min-h-[100px] relative">
            
            <span className="absolute top-1 left-2 text-[9px] text-slate-400 uppercase tracking-widest border border-slate-100 dark:border-slate-800 px-1 rounded">
                Sponsor
            </span>

            <div className="text-center cursor-pointer">
                <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 text-lg">
                    🚀 Ủng hộ BioGen AI phát triển!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Thiết kế ma trận, tạo câu hỏi Sinh học, duyệt đề và xuất Word.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
