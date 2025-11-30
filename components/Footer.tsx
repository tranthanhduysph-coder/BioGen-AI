import React from 'react';

interface FooterProps {
    onOpenDisclaimer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDisclaimer }) => {
    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-2 px-4 flex-none z-50">
            <div className="flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                    <span>© 2025 BioGen Exam System</span>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <span className="hidden md:inline">Dev: <strong>ThS. Trần Thanh Duy</strong> (ttduy@sgu.edu.vn)</span>
                </div>
                
                <div className="flex items-center gap-4 mt-1 md:mt-0">
                    <span className="hidden md:inline opacity-70">Powered by Generative AI</span>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            onOpenDisclaimer();
                        }}
                        className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline transition-colors"
                    >
                        Miễn trừ trách nhiệm
                    </button>
                </div>
            </div>
        </footer>
    );
};
