
import React from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        
        <div className="p-6 md:p-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                Cảnh báo & Miễn trừ Trách nhiệm
            </h3>
            
            <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                <p>
                    Nền tảng này sử dụng mô hình ngôn ngữ lớn (AI) để cung cấp các gợi ý và phản hồi. Các thông tin do AI tạo ra chỉ mang tính chất tham khảo, hỗ trợ học tập và không thể thay thế cho kiến thức chuyên môn, sự phán đoán của giảng viên hoặc các hướng dẫn học thuật chính thức.
                </p>
                <p>
                    Người biên soạn (Trần Thanh Duy) không chịu trách nhiệm về bất kỳ sự sai lệch, thiếu sót, hoặc hậu quả nào phát sinh từ việc sử dụng các thông tin do AI cung cấp.
                </p>
                <p>
                    Người dùng có trách nhiệm tự kiểm tra, đối chiếu và chịu trách nhiệm cuối cùng cho sản phẩm học thuật (đề cương, bài báo...) của mình. Luôn luôn tham khảo ý kiến của giảng viên hướng dẫn.
                </p>
            </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 flex justify-end">
            <button 
                onClick={onClose}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
                Đã hiểu
            </button>
        </div>
      </div>
    </div>
  );
};
