import React, { useState } from 'react';
import { CHAPTERS_KEYS } from '../constants';
import { useTranslation } from 'react-i18next';
// Import các component select thủ công nếu cần, nhưng tập trung vào Auto trước

interface CriteriaSelectorProps {
  onGenerate: (config: any) => void; // Callback for Manual
  isLoading: boolean;
  onSimulate: (config: any) => void; // Callback for Auto Exam
}

// MultiSelect Component
const MultiSelect: React.FC<{ 
    options: string[], 
    selected: string[], 
    onChange: (sel: string[]) => void, 
    label: string, 
    t: any 
}> = ({ options, selected, onChange, label, t }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (key: string) => {
        if (selected.includes(key)) onChange(selected.filter(k => k !== key));
        else onChange([...selected, key]);
    };

    const toggleAll = () => {
        if (selected.length === options.length) onChange([]);
        else onChange([...options]);
    };

    return (
        <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">{label}</label>
            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center hover:border-indigo-500"
                >
                    <span className="truncate text-slate-700 dark:text-slate-200">
                        {selected.length === 0 ? "Chọn chủ đề..." : t('criteria.selected_count', {count: selected.length})}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
                
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                             <button onClick={toggleAll} className="text-xs font-bold text-indigo-600 hover:underline w-full text-left">
                                 {selected.length === options.length ? t('criteria.clear_all') : t('criteria.select_all')}
                             </button>
                        </div>
                        {options.map(key => (
                            <div key={key} onClick={() => toggleOption(key)} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(key) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {selected.includes(key) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                                </div>
                                <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                                    {t(`constants.chapters.${key}`, { defaultValue: key })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ isLoading, onSimulate }) => {
  const { t } = useTranslation();
  
  // Store selected topics for each part
  const [p1Topics, setP1Topics] = useState<string[]>([]);
  const [p2Topics, setP2Topics] = useState<string[]>([]);
  const [p3Topics, setP3Topics] = useState<string[]>([]);

  const handleAutoGenerate = () => {
      // If no topics selected, use ALL as default (Random mode)
      const config = {
          p1_topics: p1Topics.length > 0 ? p1Topics : CHAPTERS_KEYS,
          p2_topics: p2Topics.length > 0 ? p2Topics : CHAPTERS_KEYS,
          p3_topics: p3Topics.length > 0 ? p3Topics : CHAPTERS_KEYS,
      };
      onSimulate(config);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex-none p-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('criteria.title')}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* PART I */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">{t('criteria.part1')}</h3>
              <p className="text-[10px] text-blue-600 dark:text-blue-300 mb-3">{t('criteria.part1_desc')}</p>
              <MultiSelect 
                  label={t('criteria.select_topics')} 
                  options={CHAPTERS_KEYS} 
                  selected={p1Topics} 
                  onChange={setP1Topics} 
                  t={t}
              />
          </div>

          {/* PART II */}
          <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
              <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-1">{t('criteria.part2')}</h3>
              <p className="text-[10px] text-purple-600 dark:text-purple-300 mb-3">{t('criteria.part2_desc')}</p>
              <MultiSelect 
                  label={t('criteria.select_topics')} 
                  options={CHAPTERS_KEYS} 
                  selected={p2Topics} 
                  onChange={setP2Topics} 
                  t={t}
              />
          </div>

          {/* PART III */}
          <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
              <h3 className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-1">{t('criteria.part3')}</h3>
              <p className="text-[10px] text-orange-600 dark:text-orange-300 mb-3">{t('criteria.part3_desc')}</p>
              <MultiSelect 
                  label={t('criteria.select_topics')} 
                  options={CHAPTERS_KEYS} 
                  selected={p3Topics} 
                  onChange={setP3Topics} 
                  t={t}
              />
          </div>

      </div>

      {/* Footer Button */}
      <div className="flex-none p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleAutoGenerate}
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
             {isLoading ? (
                 <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> {t('criteria.processing')}</>
             ) : t('criteria.start_build')}
          </button>
      </div>
    </div>
  );
};
