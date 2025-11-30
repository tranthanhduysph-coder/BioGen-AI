import React from 'react';

interface FooterProps {
    onOpenDisclaimer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDisclaimer }) => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-6 flex-none">
            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">© 2025 BioGen Exam System</span>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <span className="hidden md:inline">Phát triển bởi: <strong className="text-slate-800 dark:text-slate-200">ThS. Trần Thanh Duy</strong></span>
                </div>
                
                <div className="flex items-center gap-6">
                    <a href="mailto:ttduy@sgu.edu.vn" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">
                        ttduy@sgu.edu.vn
                    </a>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            onOpenDisclaimer();
                        }}
                        className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold underline decoration-dotted underline-offset-4"
                    >
                        Điều khoản & Miễn trừ trách nhiệm
                    </button>
                </div>
            </div>
        </footer>
    );
};
