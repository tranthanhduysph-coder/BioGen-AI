
import React from 'react';

interface FooterProps {
    onOpenDisclaimer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDisclaimer }) => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <p className="text-slate-600 dark:text-slate-400 font-medium mb-3 text-sm md:text-base">
                    Phát triển bởi <span className="font-bold text-slate-800 dark:text-slate-200">ThS. Trần Thanh Duy</span>
                    <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                    Email: <a href="mailto:ttduy@sgu.edu.vn" className="text-sky-600 dark:text-sky-400 hover:underline transition-colors">ttduy@sgu.edu.vn</a>
                </p>
                <div className="flex justify-center items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                    <span>Trang web này sử dụng AI tạo sinh.</span>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            onOpenDisclaimer();
                        }}
                        className="text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 hover:underline font-medium ml-1 focus:outline-none transition-colors"
                    >
                        Xem Cảnh báo & Miễn trừ trách nhiệm
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest opacity-70">
                    © 2025 BioGen Exam System
                </p>
            </div>
        </footer>
    );
};
