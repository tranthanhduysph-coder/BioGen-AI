import React, { useState } from 'react';
import type { Criteria } from '../types';
import { CRITERIA_DATA, SETTINGS, QUESTION_TYPES } from '../constants';
import { useTranslation } from 'react-i18next';

interface CriteriaSelectorProps {
  onGenerate: (criteriaList: Criteria[]) => void;
  isLoading: boolean;
  onSimulate: (customPrompt: string) => void;
}

const SelectField: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean, children: React.ReactNode }> = ({ label, value, onChange, disabled, children }) => (
    <div className="w-full group">
        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 group-focus-within:text-indigo-600 transition-colors">{label}</label>
        <div className="relative">
          <select
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={`w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-sm ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'hover:border-slate-300'}`}
          >
              {children}
          </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);

const QueueItem: React.FC<{ criteria: Criteria, index: number, onRemove: () => void }> = ({ criteria, index, onRemove }) => (
    <div className="flex items-start justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 mb-2 text-xs">
        <div className="flex-1 mr-2 overflow-hidden">
            <div className="font-bold text-slate-700 dark:text-slate-200 truncate">{criteria.chapter}</div>
            <div className="text-slate-500">{criteria.questionType} • {criteria.questionCount} câu</div>
        </div>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500">✕</button>
    </div>
)

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ onGenerate, isLoading, onSimulate }) => {
  const { t } = useTranslation();
  
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

  const isNT1Selected = currentCriteria.competency.startsWith("NT1");

  const handleChange = (field: keyof Criteria, value: string | number) => {
    setCurrentCriteria(prev => {
        const newData = { ...prev, [field]: value };
        if (field === 'competency' && String(value).startsWith('NT1')) {
            newData.difficulty = "Nhận biết";
        }
        return newData;
    });
  };

  const handleAddToQueue = () => setBatchQueue([...batchQueue, { ...currentCriteria }]);
  const handleRemoveFromQueue = (index: number) => setBatchQueue(prev => prev.filter((_, i) => i !== index));
  
  const handleManualGenerate = () => {
    if (batchQueue.length > 0) onGenerate(batchQueue);
    else onGenerate([currentCriteria]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            Cấu hình đề thi
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
            
            {/* COLUMN 1: AUTO EXAM (2025 Structure) */}
            <div className="flex flex-col h-full">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        </span>
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wide">Tạo đề tự động (2025)</h3>
                    </div>
                    
                    <div className="text-xs text-slate-600 dark:text-slate-300 mb-4 space-y-2 bg-white/50 dark:bg-slate-800/50 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <p className="font-semibold">Cấu trúc mặc định:</p>
                        <ul className="list-disc list-inside pl-1 space-y-1 opacity-80">
                            <li>18 câu Trắc nghiệm (Part I)</li>
                            <li>4 câu Đúng/Sai chùm (Part II)</li>
                            <li>6 câu Trả lời ngắn (Part III)</li>
                        </ul>
                    </div>

                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Chủ đề / Yêu cầu cụ thể</label>
                        <textarea
                            value={simulationPrompt}
                            onChange={(e) => setSimulationPrompt(e.target.value)}
                            placeholder="VD: Tập trung vào Di truyền học người, mức độ Vận dụng cao..."
                            className="w-full h-24 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 mb-4 resize-none"
                        />
                    </div>
                    
                    <button 
                        onClick={() => onSimulate(simulationPrompt)} 
                        disabled={isLoading} 
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 mt-auto"
                    >
                        {isLoading ? (
                             <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Đang xử lý...</>
                        ) : "Tạo đề thi ngay"}
                    </button>
                </div>
            </div>

            {/* COLUMN 2: MANUAL CONFIG */}
            <div className="flex flex-col h-full border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-6 xl:pt-0 xl:pl-8">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </span>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Tùy chỉnh thủ công</h3>
                </div>

                <div className="space-y-4 flex-1">
                    <SelectField label="Chương / Chủ đề" value={currentCriteria.chapter} onChange={e => handleChange('chapter', e.target.value)}>
                        {CRITERIA_DATA.chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </SelectField>

                    <div className="grid grid-cols-2 gap-3">
                        <SelectField label="Loại câu hỏi" value={currentCriteria.questionType} onChange={e => handleChange('questionType', e.target.value)}>
                            {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </SelectField>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Số lượng</label>
                            <input type="number" min="1" max="40" value={currentCriteria.questionCount} onChange={e => handleChange('questionCount', parseInt(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <SelectField label="Bối cảnh" value={currentCriteria.setting} onChange={e => handleChange('setting', e.target.value)}>
                            {SETTINGS.map(s => <option key={s} value={s}>{s}</option>)}
                        </SelectField>
                        <SelectField label="Mức độ" value={currentCriteria.difficulty} onChange={e => handleChange('difficulty', e.target.value)} disabled={isNT1Selected}>
                            {CRITERIA_DATA.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                        </SelectField>
                    </div>
                    
                    <SelectField label="Năng lực cốt lõi" value={currentCriteria.competency} onChange={e => handleChange('competency', e.target.value)}>
                        {CRITERIA_DATA.competencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </SelectField>

                    <button onClick={handleAddToQueue} className="w-full py-2 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 font-bold rounded-lg hover:border-indigo-500 hover:text-indigo-500 transition-colors text-xs uppercase tracking-wide">
                        + Thêm vào danh sách
                    </button>

                    {batchQueue.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between mb-2 text-xs font-bold text-slate-400 uppercase">Danh sách ({batchQueue.length}) <button onClick={() => setBatchQueue([])} className="text-red-500 hover:underline">Xóa hết</button></div>
                            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                {batchQueue.map((item, idx) => (
                                    <QueueItem key={idx} index={idx} criteria={item} onRemove={() => handleRemoveFromQueue(idx)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={handleManualGenerate} disabled={isLoading} className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-sm">
                    {isLoading ? "Đang xử lý..." : `Tạo ${batchQueue.length > 0 ? batchQueue.reduce((s, i) => s + i.questionCount, 0) : currentCriteria.questionCount} câu hỏi (Thủ công)`}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};
