import React, { useState, useEffect } from 'react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void; 
  isLimitReached?: boolean; 
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose, onConfirmPayment, isLimitReached }) => {
  const [transferCode, setTransferCode] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  // Create random transfer content code on open
  useEffect(() => {
      if (isOpen) {
          const randomCode = "BG" + Math.floor(1000 + Math.random() * 9000);
          setTransferCode(randomCode);
          setConfirmStep(false);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- CONFIGURATION ---
  // FIX: Must be a string literal (in quotes)
  const BANK_ID = "TCB"; // Techcombank
  const ACCOUNT_NO = "84907276901"; // Example TCB Account
  const ACCOUNT_NAME = "TRAN THANH DUY"; 
  const MIN_AMOUNT = 20000;
  
  // VietQR Link Generator
  const QR_URL = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${MIN_AMOUNT}&addInfo=${transferCode}`;

  const handleConfirm = () => {
      onConfirmPayment();
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-slate-200 dark:border-slate-700 transform transition-all scale-100">
        
        {/* Close button (only if not force blocked) */}
        {!isLimitReached && (
            <button 
                onClick={onClose}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition z-10 bg-slate-100 dark:bg-slate-800 rounded-full p-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        )}

        <div className="p-5 text-center">
            {isLimitReached ? (
                 <div className="mb-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">Hết lượt miễn phí!</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Vui lòng Donate để mở khóa tính năng không giới hạn vĩnh viễn.
                    </p>
                </div>
            ) : (
                <div className="mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Cảm ơn bạn! 🌟</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        Hãy ủng hộ để chúng tôi duy trì server miễn phí nhé.
                    </p>
                </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 relative">
                {/* QR Image */}
                <img 
                    src={QR_URL} 
                    alt="QR Code Donate" 
                    className="w-full h-auto rounded-lg mb-2 mix-blend-multiply dark:mix-blend-normal border border-white dark:border-slate-600"
                />
                
                {/* Info Details */}
                <div className="text-left text-xs space-y-1.5 border-t border-slate-200 dark:border-slate-700 pt-3 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                        <span>Ngân hàng:</span>
                        <span className="font-bold text-slate-800 dark:text-white">{BANK_ID}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Số tài khoản:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-700 px-1.5 rounded">{ACCOUNT_NO}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Chủ tài khoản:</span>
                        <span className="font-bold text-slate-800 dark:text-white uppercase">{ACCOUNT_NAME}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Nội dung:</span>
                        <span className="font-bold text-pink-600 bg-pink-50 px-1.5 rounded border border-pink-100">{transferCode}</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                {!confirmStep ? (
                    <button 
                        onClick={() => setConfirmStep(true)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold rounded-lg shadow-md text-sm hover:opacity-90 transition-opacity"
                    >
                        Đã chuyển khoản
                    </button>
                ) : (
                    <button 
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg shadow-md text-sm hover:bg-emerald-700 transition-colors"
                    >
                        Xác nhận mở khóa
                    </button>
                )}
                
                {!isLimitReached && (
                    <button 
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
                    >
                        Để sau
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
