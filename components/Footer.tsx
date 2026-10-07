import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  onOpenDisclaimer: () => void;
}

type InfoModal = 'guide' | 'about' | 'copyright' | null;

export const Footer: React.FC<FooterProps> = ({ onOpenDisclaimer }) => {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';
  const [activeModal, setActiveModal] = useState<InfoModal>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className="flex-none border-t border-slate-200 bg-white/95 px-4 py-2.5 text-[11.5px] leading-snug text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-400 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span>
              © 2026 <strong className="font-bold text-slate-700 dark:text-slate-200">BioGen AI</strong>
            </span>
            <span>· Trần Thanh Duy</span>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold"
            aria-label={isEnglish ? 'BioGen AI information' : 'Thông tin BioGen AI'}
          >
            <button
              type="button"
              onClick={() => setActiveModal('guide')}
              className="p-0 text-sky-600 transition-colors hover:underline dark:text-sky-400"
            >
              {isEnglish ? 'Guide' : 'Hướng dẫn'}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className="p-0 text-sky-600 transition-colors hover:underline dark:text-sky-400"
            >
              {isEnglish ? 'About' : 'Giới thiệu'}
            </button>
            <button
              type="button"
              onClick={onOpenDisclaimer}
              className="p-0 text-sky-600 transition-colors hover:underline dark:text-sky-400"
            >
              {isEnglish ? 'Terms' : 'Điều khoản'}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('copyright')}
              className="p-0 text-sky-600 transition-colors hover:underline dark:text-sky-400"
            >
              {isEnglish ? 'Copyright' : 'Bản quyền'}
            </button>
            <a
              href="mailto:ttduy@sgu.edu.vn"
              className="text-sky-600 transition-colors hover:underline dark:text-sky-400"
            >
              {isEnglish ? 'Contact' : 'Liên hệ'}
            </a>
          </nav>
        </div>
      </footer>

      {activeModal && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={closeModal}
        >
          <section
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="biogen-info-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
                  BioGen AI
                </p>
                <h2 id="biogen-info-title" className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                  {activeModal === 'guide'
                    ? isEnglish
                      ? 'User guide'
                      : 'Hướng dẫn sử dụng'
                    : activeModal === 'about'
                      ? isEnglish
                        ? 'About'
                        : 'Giới thiệu'
                      : isEnglish
                        ? 'Copyright & open-source notices'
                        : 'Bản quyền & mã nguồn mở'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-slate-200 bg-slate-50 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label={isEnglish ? 'Close' : 'Đóng'}
              >
                ×
              </button>
            </div>

            {activeModal === 'guide' && (
              <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  {isEnglish
                    ? 'BioGen AI helps create, review and practise Biology questions with AI. You can sign in to save your history or use guest mode for a quick trial.'
                    : 'BioGen AI hỗ trợ tạo, rà soát và luyện tập câu hỏi Sinh học bằng AI. Bạn có thể đăng nhập để lưu lịch sử hoặc dùng chế độ khách để trải nghiệm nhanh.'}
                </p>
                <div className="grid gap-3">
                  {[
                    isEnglish
                      ? ['1. Choose criteria', 'Select topic, difficulty, competency, context, question type and number of questions.']
                      : ['1. Chọn tiêu chí', 'Chọn chủ đề, mức độ, năng lực, bối cảnh, dạng câu hỏi và số lượng câu.'],
                    isEnglish
                      ? ['2. Generate questions', 'Use manual generation for a controlled question set or the quick-exam feature for a broader exam-style set.']
                      : ['2. Tạo câu hỏi', 'Dùng chế độ thủ công để kiểm soát tiêu chí hoặc chế độ đề nhanh để tạo bộ câu hỏi theo phong cách đề thi.'],
                    isEnglish
                      ? ['3. Review before use', 'Check the scientific accuracy, wording, answer key and explanation before using any AI-generated item.']
                      : ['3. Kiểm tra trước khi sử dụng', 'Luôn kiểm tra độ chính xác khoa học, cách diễn đạt, đáp án và lời giải trước khi dùng câu hỏi do AI tạo.'],
                    isEnglish
                      ? ['4. Practise or export', 'You can switch to quiz mode, review saved history and export suitable question sets to DOCX.']
                      : ['4. Luyện tập hoặc xuất file', 'Bạn có thể chuyển sang chế độ làm bài, xem lại lịch sử và xuất bộ câu hỏi phù hợp sang DOCX.'],
                  ].map(([title, body]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70"
                    >
                      <strong className="block text-slate-800 dark:text-slate-100">{title}</strong>
                      <span>{body}</span>
                    </div>
                  ))}
                </div>
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-200">
                  {isEnglish
                    ? 'AI can make mistakes. Verify generated Biology content against textbooks, official materials and reliable scientific sources.'
                    : 'AI có thể tạo nội dung sai. Hãy đối chiếu câu hỏi Sinh học với SGK, tài liệu chính thức và nguồn khoa học đáng tin cậy.'}
                </p>
              </div>
            )}

            {activeModal === 'about' && (
              <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  {isEnglish
                    ? 'BioGen AI is an AI-assisted Biology question-generation and assessment tool designed to support teachers and learners in building, practising and reviewing Biology questions.'
                    : 'BioGen AI là công cụ hỗ trợ bằng AI cho việc tạo câu hỏi, luyện tập và đánh giá Sinh học, hướng đến hỗ trợ giáo viên và người học xây dựng cũng như rà soát ngân hàng câu hỏi.'}
                </p>
                <p>
                  {isEnglish
                    ? 'The system supports multiple-choice, true/false and numeric short-answer formats, together with configurable topics, difficulty, competency and learning contexts.'
                    : 'Hệ thống hỗ trợ câu hỏi trắc nghiệm nhiều lựa chọn, đúng/sai và trả lời ngắn bằng số, đồng thời cho phép cấu hình chủ đề, mức độ, năng lực và bối cảnh học tập.'}
                </p>
                <div className="grid gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                  <strong className="text-slate-800 dark:text-slate-100">
                    {isEnglish ? 'Author & contact' : 'Tác giả & liên hệ'}
                  </strong>
                  <span>ThS. Trần Thanh Duy · Saigon University</span>
                  <a
                    href="mailto:ttduy@sgu.edu.vn"
                    className="w-fit font-semibold text-sky-600 hover:underline dark:text-sky-400"
                  >
                    ttduy@sgu.edu.vn
                  </a>
                </div>
              </div>
            )}

            {activeModal === 'copyright' && (
              <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <strong className="text-slate-800 dark:text-slate-100">
                    {isEnglish ? 'BioGen AI copyright.' : 'Bản quyền BioGen AI.'}
                  </strong>{' '}
                  {isEnglish
                    ? '© 2026 Trần Thanh Duy. All rights reserved. Unless expressly stated otherwise, original source code, interface design, prompts, documentation and original educational materials created for BioGen AI are protected by copyright.'
                    : '© 2026 Trần Thanh Duy. All rights reserved. Trừ khi được ghi rõ khác đi, mã nguồn gốc, thiết kế giao diện, prompt, tài liệu và học liệu do BioGen AI tự xây dựng được bảo hộ bản quyền.'}
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-100">
                    {isEnglish ? 'Public source is not automatically open source.' : 'Mã nguồn công khai không tự động đồng nghĩa mã nguồn mở.'}
                  </strong>{' '}
                  {isEnglish
                    ? 'A publicly visible repository does not by itself grant permission to copy, modify, redistribute, resell or operate a derivative commercial service. Rights are granted only where an applicable license expressly provides them.'
                    : 'Việc repository hiển thị công khai không tự động cấp quyền sao chép, sửa đổi, phân phối, bán lại hoặc vận hành dịch vụ thương mại phái sinh. Người dùng chỉ có các quyền được một giấy phép áp dụng cấp rõ ràng.'}
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-100">
                    {isEnglish ? 'Open-source dependencies.' : 'Thư viện mã nguồn mở.'}
                  </strong>{' '}
                  {isEnglish
                    ? 'BioGen AI uses third-party and open-source packages. Each dependency remains governed by its own license; those licenses do not automatically license BioGen AI code, content or branding.'
                    : 'BioGen AI sử dụng các gói phần mềm của bên thứ ba và thư viện mã nguồn mở. Mỗi dependency tiếp tục chịu giấy phép riêng của nó; các giấy phép đó không tự động cấp quyền đối với mã, nội dung hoặc thương hiệu BioGen AI.'}
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-100">
                    {isEnglish ? 'Educational content and AI output.' : 'Học liệu và nội dung do AI tạo.'}
                  </strong>{' '}
                  {isEnglish
                    ? 'Textbooks, publisher figures and other third-party learning resources retain their original copyright. AI-generated questions may contain errors and should be verified before classroom or assessment use.'
                    : 'SGK, hình của nhà xuất bản và các học liệu bên thứ ba vẫn thuộc bản quyền của chủ sở hữu tương ứng. Câu hỏi do AI tạo có thể có sai sót và cần được kiểm tra trước khi dùng trong dạy học hoặc đánh giá.'}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};
