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
    <div className="w-full">
        <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">{label}</label>
        <div className="relative">
          <select
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={`w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
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
    <div className="flex items-start justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm mb-2 group hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
        <div className="flex-1 mr-2 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
                <span className="flex-shrink-0 text-[10px] font-bold text-white bg-slate-400 px-1.5 py-0.5 rounded-full">{index + 1}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate block w-full" title={t(`constants.chapters.${criteria.chapter}`)}>
                     {t(`constants.chapters.${criteria.chapter}`, { defaultValue: criteria.chapter })}
                </span>
            </div>
            <div className="text-[10px] text-slate-500 flex flex-wrap gap-1">
                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{t(`constants.settings.${criteria.setting}`)}</span>
                <span className="text-sky-600 font-bold">{criteria.questionCount} câu</span>
            </div>
        </div>
        <button onClick={onRemove} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    </div>
)

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ onGenerate, isLoading, onSimulate }) => {
  const { t } = useTranslation();
  
  // ... (Keep existing state and handlers: defaultCriteria, handleChange, etc.)
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
  const totalQuestions = batchQueue.reduce((sum, item) => sum + item.questionCount, 0) + (batchQueue.length === 0 ? currentCriteria.questionCount : 0);

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex-none p-5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </span>
            {t('criteria.title')}
        </h2>
      </div>
      
      {/* Scrollable Inputs */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        
        {/* Quick Exam Card */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-purple-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
                <svg className="text-purple-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                <h3 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">{t('criteria.quick_exam_title')}</h3>
            </div>
            
             <textarea
                value={simulationPrompt}
                onChange={(e) => setSimulationPrompt(e.target.value)}
                placeholder={t('criteria.quick_exam_placeholder')}
                rows={2}
                className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-600/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none mb-3"
            />
            <button onClick={() => onSimulate(simulationPrompt)} disabled={isLoading} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm text-sm transition-all">
                {isLoading ? t('criteria.generating') : t('criteria.quick_exam_btn')}
            </button>
        </div>

        <div className="flex items-center">
            <div className="flex-grow h-px bg-slate-200 dark:bg-slate-800"></div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('criteria.manual_opt')}</span>
            <div className="flex-grow h-px bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="space-y-4">
            <SelectField label={t('criteria.label_chapter')} value={currentCriteria.chapter} onChange={e => handleChange('chapter', e.target.value)}>
                {CHAPTERS_KEYS.map(key => <option key={key} value={key}>{t(`constants.chapters.${key}`)}</option>)}
            </SelectField>
            
            <div className="grid grid-cols-2 gap-3">
                <SelectField label={t('criteria.label_context')} value={currentCriteria.setting} onChange={e => handleChange('setting', e.target.value)}>
                    {SETTINGS_KEYS.map(key => <option key={key} value={key}>{t(`constants.settings.${key}`)}</option>)}
                </SelectField>
                <SelectField label={t('criteria.label_type')} value={currentCriteria.questionType} onChange={e => handleChange('questionType', e.target.value)}>
                    {QUESTION_TYPES_KEYS.map(key => <option key={key} value={key}>{t(`constants.types.${key}`)}</option>)}
                </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <SelectField label={t('criteria.label_difficulty')} value={currentCriteria.difficulty} onChange={e => handleChange('difficulty', e.target.value)} disabled={isNT1Selected}>
                     {DIFFICULTIES_KEYS.map(key => <option key={key} value={key}>{t(`constants.difficulties.${key}`)}</option>)}
                </SelectField>
                <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">{t('criteria.label_quantity')}</label>
                    <input type="number" min="1" max="40" value={currentCriteria.questionCount} onChange={e => handleChange('questionCount', parseInt(e.target.value) || 1)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-sky-500" />
                </div>
            </div>

            <SelectField label={t('criteria.label_competency')} value={currentCriteria.competency} onChange={e => handleChange('competency', e.target.value)}>
                {COMPETENCIES_KEYS.map(key => <option key={key} value={key}>{t(`constants.competencies.${key}`)}</option>)}
            </SelectField>

            <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1 tracking-wider">{t('criteria.label_extra')}</label>
                <textarea value={currentCriteria.customPrompt} onChange={e => handleChange('customPrompt', e.target.value)} placeholder={t('criteria.placeholder_extra')} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 resize-none" />
            </div>

            <button type="button" onClick={handleAddToQueue} className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                {t('criteria.add_queue')}
            </button>
        </div>

        {/* Batch Queue */}
        {batchQueue.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('criteria.queue_title')} ({batchQueue.length})</h3>
                    <button onClick={() => setBatchQueue([])} className="text-xs text-red-500 hover:underline">{t('criteria.clear_all')}</button>
                </div>
                <div className="space-y-2">
                    {batchQueue.map((item, idx) => (
                        <QueueItem key={idx} index={idx} criteria={item} onRemove={() => handleRemoveFromQueue(idx)} t={t} />
                    ))}
                </div>
            </div>
        )}
      </div>
      
      {/* Footer Button */}
      <div className="flex-none p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
        <button onClick={handleGenerateAll} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-70 transition-all flex items-center justify-center gap-2">
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
