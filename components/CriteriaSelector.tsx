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

// Helper component for Queue Item
const QueueItem: React.FC<{ criteria: Criteria, index: number, onRemove: () => void, t: any }> = ({ criteria, index, onRemove, t }) => (
    <div className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 group animate-fade-in">
        <div className="flex-1 mr-2">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white bg-slate-400 dark:bg-slate-600 px-1.5 rounded">#{index + 1}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                    {/* Try to translate if it's a key, else show raw text */}
                    {t(`constants.chapters.${criteria.chapter}`, { defaultValue: criteria.chapter })}
                </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1">
                <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{t(`constants.settings.${criteria.setting}`)}</span>
                <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                    {t(`constants.types.${criteria.questionType}`).split('(')[0]}
                </span>
                <span className="text-sky-600 dark:text-sky-400 font-medium">{criteria.questionCount}</span>
            </div>
        </div>
        <button onClick={onRemove} className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
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

  const isNT1Selected = currentCriteria.competency.startsWith("comp_nt1");

  const handleChange = (field: keyof Criteria, value: string | number) => {
    setCurrentCriteria(prev => {
        const newData = { ...prev, [field]: value };
        if (field === 'competency' && String(value).startsWith('comp_nt1')) {
            newData.difficulty = "diff_recall"; // Force Recall
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col h-full max-h-[calc(100vh-6rem)] transition-colors duration-300">
      
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            {t('criteria.title')}
        </h2>
      </div>
      
      <div className="p-5 overflow-y-auto custom-scrollbar flex-grow">
        
        {/* Quick Exam Box */}
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-2 uppercase tracking-wide flex items-center gap-1">
                {t('criteria.quick_exam_title')}
            </h3>
            <p className="text-xs text-purple-600 dark:text-purple-300 mb-3">
                {t('criteria.quick_exam_desc')}
            </p>
             <div className="mb-3">
                 <textarea
                    value={simulationPrompt}
                    onChange={(e) => setSimulationPrompt(e.target.value)}
                    placeholder={t('criteria.quick_exam_placeholder')}
                    rows={2}
                    className="w-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
                />
            </div>
            <button
                onClick={() => onSimulate(simulationPrompt)}
                disabled={isLoading}
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm disabled:opacity-70 flex items-center justify-center"
            >
                {isLoading ? t('criteria.generating') : t('criteria.quick_exam_btn')}
            </button>
        </div>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase">{t('criteria.manual_opt')}</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        <div className="space-y-4 mt-2">
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
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">{t('criteria.label_quantity')}</label>
                    <input 
                        type="number" min="1" max="40"
                        value={currentCriteria.questionCount}
                        onChange={e => handleChange('questionCount', parseInt(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            <SelectField label={t('criteria.label_competency')} value={currentCriteria.competency} onChange={e => handleChange('competency', e.target.value)}>
                {COMPETENCIES_KEYS.map(key => <option key={key} value={key}>{t(`constants.competencies.${key}`)}</option>)}
            </SelectField>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">{t('criteria.label_extra')}</label>
                <textarea
                    value={currentCriteria.customPrompt}
                    onChange={e => handleChange('customPrompt', e.target.value)}
                    placeholder={t('criteria.placeholder_extra')}
                    rows={2}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
            </div>

            <button type="button" onClick={handleAddToQueue} className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                {t('criteria.add_queue')}
            </button>
        </div>

        {batchQueue.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('criteria.queue_title')} ({batchQueue.length})</h3>
                    <button onClick={() => setBatchQueue([])} className="text-xs text-red-500 hover:text-red-600 hover:underline">{t('criteria.clear_all')}</button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {batchQueue.map((item, idx) => (
                        <QueueItem key={idx} index={idx} criteria={item} onRemove={() => handleRemoveFromQueue(idx)} t={t} />
                    ))}
                </div>
            </div>
        )}
      </div>
      
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
        <button
          onClick={handleGenerateAll}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-blue-500/50 disabled:opacity-70 transition-all duration-300 flex items-center justify-center gap-2"
        >
             {isLoading ? t('criteria.processing') : t('criteria.generate_btn', { count: batchQueue.length > 0 ? batchQueue.length * 5 : currentCriteria.questionCount })}
        </button>
      </div>
    </div>
  );
};
