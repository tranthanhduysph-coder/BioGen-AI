import React from 'react';
import { useTranslation } from 'react-i18next';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="biogen-terms-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label={isEnglish ? 'Close' : 'Đóng'}
        >
          ×
        </button>

        <div className="p-6 md:p-7">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            BioGen AI
          </p>
          <h2 id="biogen-terms-title" className="mb-4 pr-12 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
            {isEnglish ? 'Terms & disclaimer' : 'Điều khoản & Miễn trừ trách nhiệm'}
          </h2>

          <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              {isEnglish
                ? 'BioGen AI uses artificial intelligence to generate questions, explanations and assessment-support content. AI output may contain factual, conceptual, wording or answer-key errors and should not be treated as an authoritative source.'
                : 'BioGen AI sử dụng trí tuệ nhân tạo để tạo câu hỏi, lời giải thích và nội dung hỗ trợ đánh giá. Nội dung AI có thể có sai sót về kiến thức, khái niệm, cách diễn đạt hoặc đáp án và không nên được xem là nguồn thông tin có thẩm quyền tuyệt đối.'}
            </p>
            <p>
              {isEnglish
                ? 'Teachers and learners should verify generated content against textbooks, official curriculum materials and reliable scientific sources before using it for teaching, practice, testing or grading.'
                : 'Giáo viên và người học cần đối chiếu nội dung được tạo với SGK, tài liệu chương trình chính thức và các nguồn khoa học đáng tin cậy trước khi sử dụng trong dạy học, luyện tập, kiểm tra hoặc chấm điểm.'}
            </p>
            <p>
              {isEnglish
                ? 'BioGen AI supports educational work but does not replace professional judgement by teachers, subject specialists or assessment designers. Users remain responsible for the final selection, editing and use of generated materials.'
                : 'BioGen AI là công cụ hỗ trợ giáo dục và không thay thế phán đoán chuyên môn của giáo viên, chuyên gia môn học hoặc người thiết kế đánh giá. Người dùng chịu trách nhiệm cuối cùng đối với việc lựa chọn, biên tập và sử dụng tài liệu được tạo.'}
            </p>
            <p>
              {isEnglish
                ? 'Do not submit passwords, API keys, confidential student information or other sensitive personal data in prompts or generated-content workflows.'
                : 'Không đưa mật khẩu, API key, thông tin học sinh mang tính bảo mật hoặc dữ liệu cá nhân nhạy cảm vào prompt hay quy trình tạo nội dung.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/70">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-sky-600 px-5 py-2 font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            {isEnglish ? 'Understood' : 'Đã hiểu'}
          </button>
        </div>
      </section>
    </div>
  );
};
