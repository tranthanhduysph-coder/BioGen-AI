import React from 'react';

interface FooterProps {
    onOpenDisclaimer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDisclaimer }) => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-6 flex-none">
            <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-4">
                    <span className="font-semibold">© 2025 BioGen Exam System</span>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <span className="hidden md:inline">Phát triển bởi: <strong>ThS. Trần Thanh Duy</strong></span>
                </div>
                
                <div className="flex items-center gap-4">
                    <a href="mailto:ttduy@sgu.edu.vn" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        ttduy@sgu.edu.vn
                    </a>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            onOpenDisclaimer();
                        }}
                        className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                    >
                        Điều khoản & Miễn trừ trách nhiệm
                    </button>
                </div>
            </div>
        </footer>
    );
};
