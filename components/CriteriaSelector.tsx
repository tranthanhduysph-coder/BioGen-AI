import React, { useState } from 'react';
import { CRITERIA_DATA } from '../constants';
import { useTranslation } from 'react-i18next';

interface CriteriaSelectorProps {
  onGenerate: (config: any) => void; // Changed to accept generic config object
  isLoading: boolean;
  onSimulate: (config: any) => void; // Changed signature
}

// Custom Multi-Select Component
const MultiSelectChapter: React.FC<{ 
    selected: string[], 
    onChange: (selected: string[]) => void,
    t: any 
}> = ({ selected, onChange, t }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChapter = (chapterKey: string) => {
        if (selected.includes(chapterKey)) {
            onChange(selected.filter(k => k !== chapterKey));
        } else {
            onChange([...selected, chapterKey]);
        }
    };

    const handleSelectAll = () => {
        if (selected.length === CRITERIA_DATA.chapters.length) {
            onChange([]);
        } else {
            onChange([...CRITERIA_DATA.chapters]);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm flex justify-between items-center hover:border-indigo-500 transition-colors"
            >
                <span className="truncate text-slate-700 dark:text-slate-200">
                    {selected.length === 0 
                        ? "Chọn chủ đề..." 
                        : `${selected.length} chủ đề đã chọn`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                        <label className="flex items-center gap-2 text-xs font-bold text-indigo-600 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={selected.length === CRITERIA_DATA.chapters.length}
                                onChange={handleSelectAll}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            Chọn tất cả
                        </label>
                    </div>
                    {CRITERIA_DATA.chapters.map((key) => (
                        <label key={key} className="flex items-start gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                            <input 
                                type="checkbox" 
                                checked={selected.includes(key)}
                                onChange={() => toggleChapter(key)}
                                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                                {t(`constants.chapters.${key}`, { defaultValue: key })}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ isLoading, onSimulate }) => {
  const { t } = useTranslation();
  
  // State for 3 parts
  const [configP1, setConfigP1] = useState<string[]>([]); // MCQ
  const [configP2, setConfigP2] = useState<string[]>([]); // TF
  const [configP3, setConfigP3] = useState<string[]>([]); // SR

  // Auto-select all logic for quick start
  const handleQuickSelect = (part: 'p1'|'p2'|'p3') => {
      if (part === 'p1') setConfigP1(configP1.length > 0 ? [] : [...CRITERIA_DATA.chapters]);
      if (part === 'p2') setConfigP2(configP2.length > 0 ? [] : [...CRITERIA_DATA.chapters]);
      if (part === 'p3') setConfigP3(configP3.length > 0 ? [] : [...CRITERIA_DATA.chapters]);
  };

  const handleBuildExam = () => {
      // Validate
      if (configP1.length === 0 && configP2.length === 0 && configP3.length === 0) {
          alert("Vui lòng chọn ít nhất 1 chủ đề cho một phần thi!");
          return;
      }

      // Send structured config to App -> Service
      onSimulate({
          p1_topics: configP1.length > 0 ? configP1 : CRITERIA_DATA.chapters, // Default to all if empty but other parts selected? No, strict.
          p2_topics: configP2.length > 0 ? configP2 : CRITERIA_DATA.chapters,
          p3_topics: configP3.length > 0 ? configP3 : CRITERIA_DATA.chapters,
          // If user leaves empty, we assume they want RANDOM from ALL chapters, 
          // OR we can force them to select. Let's assume Random All if empty for better UX.
          mode: 'strict_2025'
      });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-none p-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            Cấu hình Đề thi 2025
        </h2>
        <p className="text-xs text-slate-500 mt-1">Chọn chủ đề cho từng phần để tránh AI bị quá tải.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* PART I */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PHẦN I</span>
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-100">18 Câu Trắc nghiệm</span>
                </div>
                <button onClick={() => handleQuickSelect('p1')} className="text-[10px] text-blue-600 hover:underline">
                    {configP1.length > 0 ? "Bỏ chọn" : "Chọn hết"}
                </button>
            </div>
            <MultiSelectChapter selected={configP1} onChange={setConfigP1} t={t} />
            <div className="mt-2 text-[10px] text-slate-500">
                Chọn các chương bạn muốn xuất hiện trong 18 câu hỏi trắc nghiệm 4 lựa chọn.
            </div>
        </div>

        {/* PART II */}
        <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PHẦN II</span>
                    <span className="text-sm font-bold text-purple-900 dark:text-purple-100">4 Câu Đúng/Sai</span>
                </div>
                <button onClick={() => handleQuickSelect('p2')} className="text-[10px] text-purple-600 hover:underline">
                    {configP2.length > 0 ? "Bỏ chọn" : "Chọn hết"}
                </button>
            </div>
            <MultiSelectChapter selected={configP2} onChange={setConfigP2} t={t} />
            <div className="mt-2 text-[10px] text-slate-500">
                Mỗi câu là một bài toán tổng hợp gồm 4 ý nhận định (a, b, c, d).
            </div>
        </div>

        {/* PART III */}
        <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PHẦN III</span>
                    <span className="text-sm font-bold text-orange-900 dark:text-orange-100">6 Câu Trả lời ngắn</span>
                </div>
                <button onClick={() => handleQuickSelect('p3')} className="text-[10px] text-orange-600 hover:underline">
                    {configP3.length > 0 ? "Bỏ chọn" : "Chọn hết"}
                </button>
            </div>
            <MultiSelectChapter selected={configP3} onChange={setConfigP3} t={t} />
            <div className="mt-2 text-[10px] text-slate-500">
                Câu hỏi yêu cầu tính toán hoặc điền số liệu cụ thể.
            </div>
        </div>

      </div>
      
      <div className="flex-none p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button 
            onClick={handleBuildExam}
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
             {isLoading ? (
                 <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Đang khởi tạo...
                 </>
             ) : (
                 <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                    TẠO ĐỀ THI 2025
                 </>
             )}
        </button>
      </div>
    </div>
  );
};
