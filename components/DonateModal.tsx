import React, { useState } from 'react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [confirmStep, setConfirmStep] = useState(false);

  // CẤU HÌNH THÔNG TIN TÀI KHOẢN CỦA BẠN TẠI ĐÂY
  const BANK_ID = "TCB"; 
  const ACCOUNT_NO = "84907276901"; 
  const ACCOUNT_NAME = "TRAN THANH DUY"; 
  const MIN_AMOUNT = 20000;
  const QR_URL = `https://img.vietqr.io/image/${TCB}-${84907276901}-compact2.png?amount=${20000}&addInfo=Ung ho BioGen AI`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-200 dark:border-slate-700">
        
        {/* Nút đóng góc trên */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition z-10 bg-slate-100 dark:bg-slate-800 rounded-full p-1"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <div className="p-6 text-center">
            <div className="mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Bạn đang làm rất tốt! 🌟</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    BioGen AI là dự án cộng đồng phi lợi nhuận. Để duy trì hệ thống AI đắt đỏ, chúng tôi rất cần sự chung tay của bạn.
                </p>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                    Mời tác giả một ly cà phê (20k) nhé?
                </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
                <img 
                    src={QR_URL} 
                    alt="QR Code Donate" 
                    className="w-full h-auto rounded-lg mb-3 mix-blend-multiply dark:mix-blend-normal border border-white dark:border-slate-600 shadow-sm"
                />
                <div className="text-left text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between"><span>Ngân hàng:</span><span className="font-bold text-slate-800 dark:text-slate-200">{BANK_ID}</span></div>
                    <div className="flex justify-between"><span>STK:</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-1 rounded">{ACCOUNT_NO}</span></div>
                    <div className="flex justify-between"><span>Tên:</span><span className="font-bold text-slate-800 dark:text-slate-200">{ACCOUNT_NAME}</span></div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {!confirmStep ? (
                    <button 
                        onClick={() => setConfirmStep(true)}
                        className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        Đã chuyển khoản ❤️
                    </button>
                ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-xl text-sm font-medium animate-fade-in">
                        Cảm ơn tấm lòng vàng của bạn! Chúc bạn một ngày tốt lành.
                    </div>
                )}
                
                <button 
                    onClick={onClose}
                    className="w-full py-2.5 text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    Để sau
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
