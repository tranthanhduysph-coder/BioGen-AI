import React, { useState } from 'react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [confirmStep, setConfirmStep] = useState(false);

  // CẤU HÌNH THÔNG TIN TÀI KHOẢN
  const BANK_ID = "Techcombank"; 
  const ACCOUNT_NO = "84907276901"; 
  const ACCOUNT_NAME = "TRAN THANH DUY"; 
  const MIN_AMOUNT = 20000;
  const QR_URL = `https://img.vietqr.io/image/${Techcombank}-${84907276901}-compact2.png?amount=${20000}&addInfo=Ung ho BioGen AI`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Modal Container: Nhỏ gọn (max-w-sm), Bo tròn, Bóng đổ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-slate-200 dark:border-slate-700 transform transition-all scale-100">
        
        <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition z-10 bg-slate-100 dark:bg-slate-800 rounded-full p-1"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <div className="p-5 text-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Cảm ơn bạn! 🌟</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Hãy ủng hộ để chúng tôi duy trì server miễn phí nhé.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                <img 
                    src={QR_URL} 
                    alt="QR Code Donate" 
                    className="w-full h-auto rounded-lg mb-2 mix-blend-multiply dark:mix-blend-normal"
                />
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Momo/Bank: {ACCOUNT_NO}</p>
            </div>

            <div className="flex gap-2">
                {!confirmStep ? (
                    <button 
                        onClick={() => setConfirmStep(true)}
                        className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-lg shadow-md text-sm hover:opacity-90 transition-opacity"
                    >
                        Đã chuyển khoản ❤️
                    </button>
                ) : (
                    <div className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">
                        Cảm ơn tấm lòng của bạn!
                    </div>
                )}
                
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                >
                    Để sau
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
