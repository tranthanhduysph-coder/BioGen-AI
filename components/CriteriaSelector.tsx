
import React, { useState } from 'react';
import type { Criteria } from '../types';
import { CRITERIA_DATA, SETTINGS, QUESTION_TYPES } from '../constants';

interface CriteriaSelectorProps {
  onGenerate: (criteriaList: Criteria[]) => void;
  isLoading: boolean;
  onSimulate: (customPrompt: string) => void;
}

const SelectField: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean, children: React.ReactNode }> = ({ label, value, onChange, disabled, children }) => (
    <div className="group">
        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 group-focus-within:text-sky-600 dark:group-focus-within:text-sky-400 transition-colors">{label}</label>
        <div className="relative">
          <select
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={`w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-sm hover:border-slate-400 dark:hover:border-slate-600 ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50' : ''}`}
          >
              {children}
          </select>
          {!disabled && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
                <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          )}
        </div>
    </div>
);

const QueueItem: React.FC<{ criteria: Criteria, index: number, onRemove: () => void }> = ({ criteria, index, onRemove }) => (
    <div className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 group animate-fade-in">
        <div className="flex-1 mr-2">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white bg-slate-400 dark:bg-slate-600 px-1.5 rounded">#{index + 1}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{criteria.chapter}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1">
                <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{criteria.setting}</span>
                <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{criteria.questionType.includes("(") ? criteria.questionType.split("(")[0].trim() : criteria.questionType}</span>
                <span className="text-sky-600 dark:text-sky-400 font-medium">{criteria.questionCount} câu</span>
            </div>
        </div>
        <button 
            onClick={onRemove}
            className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Xóa nhóm này"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    </div>
)

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ onGenerate, isLoading, onSimulate }) => {
  const defaultCriteria: Criteria = {
    chapter: CRITERIA_DATA.chapters[0],
    difficulty: CRITERIA_DATA.difficulties[0],
    competency: CRITERIA_DATA.competencies[0],
    setting: SETTINGS[0],
    questionType: QUESTION_TYPES[0],
    questionCount: 5,
    customPrompt: "",
  };

  const [currentCriteria, setCurrentCriteria] = useState<Criteria>(defaultCriteria);
  const [batchQueue, setBatchQueue] = useState<Criteria[]>([]);
  const [simulationPrompt, setSimulationPrompt] = useState("");

  // Check constraints for rendering
  const isNT1Selected = currentCriteria.competency.startsWith("NT1");
  const isHighLevelSelected = ["TH4", "TH5", "VD1", "VD2"].some(code => currentCriteria.competency.startsWith(code));

  const handleChange = (field: keyof Criteria, value: string | number) => {
    setCurrentCriteria(prev => {
        const newData = { ...prev, [field]: value };
        
        // CONSTRAINT: NT1 -> "Nhận biết"
        if (field === 'competency' && String(value).startsWith('NT1')) {
            newData.difficulty = "Nhận biết";
        }
        
        // CONSTRAINT: TH4, TH5, VD1, VD2 -> "Vận dụng" or "Vận dụng cao"
        // If current difficulty is low, bump it up to "Vận dụng"
        if (field === 'competency' && ["TH4", "TH5", "VD1", "VD2"].some(code => String(value).startsWith(code))) {
            if (newData.difficulty === "Nhận biết" || newData.difficulty === "Thông hiểu") {
                newData.difficulty = "Vận dụng";
            }
        }
        return newData;
    });
  };

  const handleAddToQueue = () => {
      setBatchQueue([...batchQueue, { ...currentCriteria }]);
  };

  const handleRemoveFromQueue = (index: number) => {
      setBatchQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateAll = () => {
    if (batchQueue.length > 0) {
        onGenerate(batchQueue);
    } else {
        onGenerate([currentCriteria]);
    }
  };

  const totalQuestions = batchQueue.reduce((sum, item) => sum + item.questionCount, 0) + (batchQueue.length === 0 ? currentCriteria.questionCount : 0);
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-full max-h-[calc(100vh-6rem)] transition-colors duration-300">
      
      {/* Form Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            Cấu hình câu hỏi
        </h2>
      </div>
      
      {/* Scrollable Form Area */}
      <div className="p-5 overflow-y-auto custom-scrollbar flex-grow">
        
        {/* Auto Exam Simulation Button */}
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-2 uppercase tracking-wide flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                Tạo đề tự động (Nhanh)
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-300 mb-3">
                Tạo ngẫu nhiên đề thi hoàn chỉnh theo cấu trúc 2025 (18 câu trắc nghiệm, 4 câu Đ/S, 6 câu trả lời ngắn) với ma trận ngẫu nhiên.
            </p>
            
             {/* Simulation Prompt Input */}
             <div className="mb-3">
                 <textarea
                    value={simulationPrompt}
                    onChange={(e) => setSimulationPrompt(e.target.value)}
                    placeholder="VD: Tập trung vào di truyền, hạn chế câu hỏi lớp 10..."
                    rows={2}
                    className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition shadow-sm resize-none hover:border-purple-300 dark:hover:border-purple-600 placeholder-purple-300 dark:placeholder-purple-700/50"
                />
            </div>

            <button
                onClick={() => onSimulate(simulationPrompt)}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md shadow-purple-500/20 transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tạo đề...
                    </>
                ) : "Tạo đề thi mẫu 2025 ngay"}
            </button>
        </div>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase">Hoặc tùy chỉnh thủ công</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        <div className="space-y-4 mt-2">
            <SelectField label="Chương / Chủ đề" value={currentCriteria.chapter} onChange={e => handleChange('chapter', e.target.value)}>
                {CRITERIA_DATA.chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </SelectField>
            
            <div className="grid grid-cols-2 gap-3">
                <SelectField label="Bối cảnh" value={currentCriteria.setting} onChange={e => handleChange('setting', e.target.value)}>
                    {SETTINGS.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectField>
                <SelectField label="Loại câu hỏi" value={currentCriteria.questionType} onChange={e => handleChange('questionType', e.target.value)}>
                    {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="group">
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 group-focus-within:text-sky-600 dark:group-focus-within:text-sky-400 transition-colors">Mức Độ</label>
                    <div className="relative">
                      <select
                          value={currentCriteria.difficulty}
                          onChange={e => handleChange('difficulty', e.target.value)}
                          disabled={isNT1Selected} // Lock for NT1
                          className={`w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-sm hover:border-slate-400 dark:hover:border-slate-600 ${isNT1Selected ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                      >
                          {CRITERIA_DATA.difficulties.map(d => {
                              // If High Level Competency is selected, only show "Vận dụng" and "Vận dụng cao"
                              if (isHighLevelSelected && !["Vận dụng", "Vận dụng cao"].includes(d)) return null;
                              // If NT1 is selected, it's handled by disabled state/value forcing, but we can also filter here
                              if (isNT1Selected && d !== "Nhận biết") return null;
                              return <option key={d} value={d}>{d}</option>;
                          })}
                      </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Số lượng (1-40)</label>
                    <input 
                        type="number" 
                        min="1" 
                        max="40"
                        value={currentCriteria.questionCount}
                        onChange={e => handleChange('questionCount', parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-sm hover:border-slate-400 dark:hover:border-slate-600"
                    />
                </div>
            </div>

            <SelectField label="Năng Lực Cốt Lõi" value={currentCriteria.competency} onChange={e => handleChange('competency', e.target.value)}>
                {CRITERIA_DATA.competencies.map(c => <option key={c} value={c}>{c}</option>)}
            </SelectField>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Yêu cầu thêm</label>
                <textarea
                    value={currentCriteria.customPrompt}
                    onChange={e => handleChange('customPrompt', e.target.value)}
                    placeholder="VD: Tập trung vào bài tập di truyền phả hệ..."
                    rows={2}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-sm resize-none hover:border-slate-400 dark:hover:border-slate-600"
                />
            </div>

            <button
                type="button"
                onClick={handleAddToQueue}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Thêm vào danh sách
            </button>
        </div>

        {/* Queue List Area */}
        {batchQueue.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Danh sách tạo ({batchQueue.length})</h3>
                    <button 
                        onClick={() => setBatchQueue([])}
                        className="text-xs text-red-500 hover:text-red-600 hover:underline"
                    >
                        Xóa hết
                    </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {batchQueue.map((item, idx) => (
                        <QueueItem key={idx} index={idx} criteria={item} onRemove={() => handleRemoveFromQueue(idx)} />
                    ))}
                </div>
            </div>
        )}
      </div>
      
      {/* Action Footer */}
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        <button
          onClick={handleGenerateAll}
          disabled={isLoading}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
             {isLoading ? (
                 <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                 </>
             ) : (
                 <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Tạo {batchQueue.length > 0 ? totalQuestions : currentCriteria.questionCount} câu hỏi (Thủ công)
                 </>
             )}
          </span>
        </button>
      </div>
    </div>
  );
};
