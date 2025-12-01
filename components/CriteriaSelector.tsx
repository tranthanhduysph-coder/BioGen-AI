import React, { useState } from 'react';
import type { Criteria } from '../types';
import { CHAPTERS_KEYS, DIFFICULTIES_KEYS, COMPETENCIES_KEYS, SETTINGS_KEYS, QUESTION_TYPES_KEYS } from '../constants';
import { useTranslation } from 'react-i18next';

interface CriteriaSelectorProps {
  onGenerate: (criteriaList: Criteria[]) => void;
  isLoading: boolean;
  onSimulate: (customPrompt: string) => void;
}

const SelectField: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean, children: React.ReactNode }> = ({ label, value, onChange, disabled, children }) => (
    <div className="w-full group">
        <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider group-focus-within:text-indigo-600 transition-colors">
            {label}
        </label>
        <div className="relative">
          <select
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={`w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-sm ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'hover:border-slate-300'}`}
          >
              {children}
          </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);

const QueueItem: React.FC<{ criteria: Criteria, index: number, onRemove: () => void, t: any }> = ({ criteria, index, onRemove, t }) => (
    <div className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 group animate-fade-in mb-2 hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
        <div className="flex-1 mr-2 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
                <span className="flex-shrink-0 text-[10px] font-bold text-white bg-slate-400 px-1.5 py-0.5 rounded-full">#{index + 1}</span>
                {/* FIX: Translate Chapter Key to Text */}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate block w-full">
                     {t(`constants.chapters.${criteria.chapter}`, { defaultValue: criteria.chapter })}
                </span>
            </div>
            <div className="text-[10px] text-slate-500 flex flex-wrap gap-1.5">
                {/* FIX: Translate Setting Key */}
                <span className="bg-white dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-600">
                    {t(`constants.settings.${criteria.setting}`, { defaultValue: criteria.setting })}
                </span>
                {/* FIX: Translate Type Key */}
                <span className="bg-white dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-600 text-sky-600 font-medium">
                     {t(`constants.types.${criteria.questionType}`, { defaultValue: criteria.questionType }).split('(')[0]}
                </span>
                <span className="font-bold text-indigo-600">{criteria.questionCount} câu</span>
            </div>
        </div>
        <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    </div>
)

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ onGenerate, isLoading, onSimulate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  
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

  const handleAddToQueue = () => setBatchQueue([...batchQueue, { ...currentCriteria }]);
  const handleRemoveFromQueue = (index: number) => setBatchQueue(prev => prev.filter((_, i) => i !== index));
  const handleGenerateAll = () => batchQueue.length > 0 ? onGenerate(batchQueue) : onGenerate([currentCriteria]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      
      <div className="flex-none border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="p-4 pb-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                {t('criteria.title')}
            </h2>
            <div className="flex gap-1">
                <button 
                    onClick={() => setActiveTab('auto')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'auto' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    {t('criteria.tab_auto')}
                </button>
                <button 
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'manual' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    {t('criteria.tab_manual')}
                </button>
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* TAB 1: AUTO EXAM */}
        {activeTab === 'auto' && (
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700/50 shadow-sm animate-fade-in">
                <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                    {t('criteria.quick_exam_title')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {t('criteria.quick_exam_desc')}
                </p>
                <div className="mb-4">
                    <textarea
                        value={simulationPrompt}
                        onChange={(e) => setSimulationPrompt(e.target.value)}
                        placeholder={t('criteria.quick_exam_placeholder')}
                        rows={3}
                        className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-600/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none placeholder:text-slate-400/70"
                    />
                </div>
                <button 
                    onClick={() => onSimulate(simulationPrompt)} 
                    disabled={isLoading} 
                    className="w-full py-3 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md text-sm flex items-center justify-center transition-all active:scale-[0.98]"
                >
                    {isLoading ? t('criteria.generating') : t('criteria.quick_exam_btn')}
                </button>
            </div>
        )}

        {/* TAB 2: MANUAL CONFIG (FIXED DISPLAY) */}
        {activeTab === 'manual' && (
            <div className="animate-fade-in space-y-4">
                <SelectField label={t('criteria.label_chapter')} value={currentCriteria.chapter} onChange={e => handleChange('chapter', e.target.value)}>
                    {CHAPTERS_KEYS.map(key => (
                        <option key={key} value={key}>
                            {/* FIX: Use t() to display translated text */}
                            {t(`constants.chapters.${key}`, { defaultValue: key })}
                        </option>
                    ))}
                </SelectField>
                
                <div className="grid grid-cols-2 gap-3">
                    <SelectField label={t('criteria.label_context')} value={currentCriteria.setting} onChange={e => handleChange('setting', e.target.value)}>
                        {SETTINGS_KEYS.map(key => (
                            <option key={key} value={key}>
                                {t(`constants.settings.${key}`, { defaultValue: key })}
                            </option>
                        ))}
                    </SelectField>
                    <SelectField label={t('criteria.label_type')} value={currentCriteria.questionType} onChange={e => handleChange('questionType', e.target.value)}>
                        {QUESTION_TYPES_KEYS.map(key => (
                            <option key={key} value={key}>
                                {t(`constants.types.${key}`, { defaultValue: key })}
                            </option>
                        ))}
                    </SelectField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <SelectField label={t('criteria.label_difficulty')} value={currentCriteria.difficulty} onChange={e => handleChange('difficulty', e.target.value)} disabled={isNT1Selected}>
                        {DIFFICULTIES_KEYS.map(key => (
                            <option key={key} value={key}>
                                {t(`constants.difficulties.${key}`, { defaultValue: key })}
                            </option>
                        ))}
                    </SelectField>
                    <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">{t('criteria.label_quantity')}</label>
                        <input type="number" min="1" max="40" value={currentCriteria.questionCount} onChange={e => handleChange('questionCount', parseInt(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 transition-shadow" />
                    </div>
                </div>

                <SelectField label={t('criteria.label_competency')} value={currentCriteria.competency} onChange={e => handleChange('competency', e.target.value)}>
                    {COMPETENCIES_KEYS.map(key => (
                        <option key={key} value={key}>
                            {t(`constants.competencies.${key}`, { defaultValue: key })}
                        </option>
                    ))}
                </SelectField>

                <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">{t('criteria.label_extra')}</label>
                    <textarea value={currentCriteria.customPrompt} onChange={e => handleChange('customPrompt', e.target.value)} placeholder={t('criteria.placeholder_extra')} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                </div>

                <button type="button" onClick={handleAddToQueue} className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    {t('criteria.add_queue')}
                </button>

                {batchQueue.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {t('criteria.queue_title')} <span className="ml-1 bg-slate-200 px-1.5 rounded text-slate-700">{batchQueue.length}</span>
                            <button onClick={() => setBatchQueue([])} className="text-red-500 hover:underline">{t('criteria.clear_all')}</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {batchQueue.map((item, idx) => (
                                <QueueItem key={idx} index={idx} criteria={item} onRemove={() => handleRemoveFromQueue(idx)} t={t} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
      
      {/* Footer Button (Only for Manual Mode) */}
      {activeTab === 'manual' && (
          <div className="flex-none p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl backdrop-blur-sm">
            <button onClick={handleGenerateAll} disabled={isLoading} className="w-full bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-70 transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.99]">
                 {isLoading ? t('criteria.processing') : t('criteria.generate_btn', { count: batchQueue.length > 0 ? totalQuestions : currentCriteria.questionCount })}
            </button>
          </div>
      )}
    </div>
  );
};
