import React, { useState } from 'react';
import type { Criteria } from '../types';
import { CHAPTERS_KEYS, DIFFICULTIES_KEYS, COMPETENCIES_KEYS, SETTINGS_KEYS, QUESTION_TYPES_KEYS } from '../constants';
import { useTranslation } from 'react-i18next';

interface CriteriaSelectorProps {
  onGenerate: (criteriaList: Criteria[]) => void;
  isLoading: boolean;
  onSimulate: (customPrompt: string) => void;
}

// Reusable Select Component
const SelectField: React.FC<{ 
    label: string, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, 
    disabled?: boolean, 
    children: React.ReactNode 
}> = ({ label, value, onChange, disabled, children }) => (
    <div className="w-full">
        <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">
            {label}
        </label>
        <div className="relative">
          <select
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={`w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${disabled ? 'bg-slate-100 dark:bg-slate-800/50' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
          >
              {children}
          </select>
          {!disabled && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          )}
        </div>
    </div>
);

// Queue Item Component
const QueueItem: React.FC<{ criteria: Criteria, index: number, onRemove: () => void, t: any }> = ({ criteria, index, onRemove, t }) => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm mb-2 hover:shadow-md transition-shadow group">
        <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                {index + 1}
            </span>
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {t(`constants.chapters.${criteria.chapter}`, { defaultValue: criteria.chapter })}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{t(`constants.types.${criteria.questionType}`).split('(')[0]}</span>
                    <span>•</span>
                    <span>{criteria.questionCount} câu</span>
                </div>
            </div>
        </div>
        <button 
            onClick={onRemove} 
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Xóa"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    </div>
)

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ onGenerate, isLoading, onSimulate }) => {
  const { t } = useTranslation();
  
  const defaultCriteria: Criteria = {
    chapter: CHAPTERS_KEYS[0],
    difficulty: DIFFICULTIES_KEYS[0],
    competency: COMPETENCIES_KEYS[0],
    setting: SETTINGS_KEYS[0],
    questionType: QUESTION_TYPES_KEYS[0],
    questionCount: 5,
    customPrompt: "",
  };

  const [currentCriteria, setCurrentCriteria] = useState<Criteria>(defaultCriteria);
  const [batchQueue, setBatchQueue] = useState<Criteria[]>([]);
  const [simulationPrompt, setSimulationPrompt] = useState("");

  const isNT1Selected = currentCriteria.competency.startsWith("nt1");

  const handleChange = (field: keyof Criteria, value: string | number) => {
    setCurrentCriteria(prev => {
        const newData = { ...prev, [field]: value };
        if (field === 'competency' && String(value).startsWith('nt1')) {
            newData.difficulty = "diff_1"; 
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-full max-h-[calc(100vh-6rem)] overflow-hidden transition-colors duration-300">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </span>
            {t('criteria.title')}
        </h2>
      </div>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-8">
            
            {/* Section 1: Quick Generate */}
            <section>
                <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border border-purple-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="p-1 bg-purple-100 dark:bg-purple-900/50 rounded text-purple-600 dark:text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">{t('criteria.quick_exam_title')}</h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                        {t('criteria.quick_exam_desc')}
                    </p>
                    
                    <div className="space-y-3">
                        <textarea
                            value={simulationPrompt}
                            onChange={(e) => setSimulationPrompt(e.target.value)}
                            placeholder={t('criteria.quick_exam_placeholder')}
                            rows={2}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition shadow-sm resize-none placeholder:text-slate-400"
                        />
                        <button
                            onClick={() => onSimulate(simulationPrompt)}
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md shadow-purple-500/20 transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> {t('criteria.processing')}</span>
                            ) : (
                                <span>{t('criteria.quick_exam_btn')}</span>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('criteria.manual_opt')}</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>

            {/* Section 2: Manual Config */}
            <section className="space-y-5">
                <SelectField label={t('criteria.label_chapter')} value={currentCriteria.chapter} onChange={e => handleChange('chapter', e.target.value)}>
                    {CHAPTERS_KEYS.map(key => <option key={key} value={key}>{t(`constants.chapters.${key}`)}</option>)}
                </SelectField>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectField label={t('criteria.label_context')} value={currentCriteria.setting} onChange={e => handleChange('setting', e.target.value)}>
                        {SETTINGS_KEYS.map(key => <option key={key} value={key}>{t(`constants.settings.${key}`)}</option>)}
                    </SelectField>
                    <SelectField label={t('criteria.label_type')} value={currentCriteria.questionType} onChange={e => handleChange('questionType', e.target.value)}>
                        {QUESTION_TYPES_KEYS.map(key => <option key={key} value={key}>{t(`constants.types.${key}`)}</option>)}
                    </SelectField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SelectField label={t('criteria.label_difficulty')} value={currentCriteria.difficulty} onChange={e => handleChange('difficulty', e.target.value)} disabled={isNT1Selected}>
                        {DIFFICULTIES_KEYS.map(key => <option key={key} value={key}>{t(`constants.difficulties.${key}`)}</option>)}
                    </SelectField>
                    
                    <div className="w-full">
                        <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">{t('criteria.label_quantity')}</label>
                        <input 
                            type="number" min="1" max="40"
                            value={currentCriteria.questionCount}
                            onChange={e => handleChange('questionCount', parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                        />
                    </div>
                </div>

                <SelectField label={t('criteria.label_competency')} value={currentCriteria.competency} onChange={e => handleChange('competency', e.target.value)}>
                    {COMPETENCIES_KEYS.map(key => <option key={key} value={key}>{t(`constants.competencies.${key}`)}</option>)}
                </SelectField>

                <div className="w-full">
                    <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">{t('criteria.label_extra')}</label>
                    <textarea
                        value={currentCriteria.customPrompt}
                        onChange={e => handleChange('customPrompt', e.target.value)}
                        placeholder={t('criteria.placeholder_extra')}
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none placeholder:text-slate-400"
                    />
                </div>

                <button 
                    type="button" 
                    onClick={handleAddToQueue} 
                    className="w-full py-3 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    {t('criteria.add_queue')}
                </button>
            </section>

            {/* Queue List */}
            {batchQueue.length > 0 && (
                <section className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('criteria.queue_title')} <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 rounded ml-1">{batchQueue.length}</span></h3>
                        <button onClick={() => setBatchQueue([])} className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                            {t('criteria.clear_all')}
                        </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {batchQueue.map((item, idx) => (
                            <QueueItem key={idx} index={idx} criteria={item} onRemove={() => handleRemoveFromQueue(idx)} t={t} />
                        ))}
                    </div>
                </section>
            )}
        </div>
      </div>
      
      {/* Footer Action */}
      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-10">
        <button
          onClick={handleGenerateAll}
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 text-base transform active:scale-[0.98]"
        >
             {isLoading ? (
                 <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> {t('criteria.processing')}</>
             ) : (
                 <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                    {t('criteria.generate_btn', { count: batchQueue.length > 0 ? totalQuestions : currentCriteria.questionCount })}
                 </>
             )}
        </button>
      </div>
    </div>
  );
};
