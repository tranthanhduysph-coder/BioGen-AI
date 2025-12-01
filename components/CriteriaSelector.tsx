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
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
        <div className="relative">
          <select
              value={value}
              onChange={onChange}
              disabled={disabled}
              className={`w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 transition shadow-sm ${disabled ? 'opacity-60 bg-slate-100' : ''}`}
          >
              {children}
          </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    </div>
);

const QueueItem: React.FC<{ criteria: Criteria, index: number, onRemove: () => void, t: any }> = ({ criteria, index, onRemove, t }) => (
    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg mb-2 text-xs">
        <div className="flex-1 mr-2 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white bg-slate-400 px-1.5 rounded-full text-[10px]">{index + 1}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                     {t(`constants.chapters.${criteria.chapter}`, { defaultValue: criteria.chapter })}
                </span>
            </div>
            <div className="text-slate-500 truncate">
                {t(`constants.types.${criteria.questionType}`).split('(')[0]} • {criteria.questionCount} câu
            </div>
        </div>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500">✕</button>
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

  const handleChange = (field: keyof Criteria, value: string | number) => {
    setCurrentCriteria(prev => ({ ...prev, [field]: value }));
  };

  const handleAddToQueue = () => setBatchQueue([...batchQueue, { ...currentCriteria }]);
  const handleRemoveFromQueue = (index: number) => setBatchQueue(prev => prev.filter((_, i) => i !== index));
  const handleGenerateAll = () => batchQueue.length > 0 ? onGenerate(batchQueue) : onGenerate([currentCriteria]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            {t('criteria.title')}
        </h2>
      </div>
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: AUTO GENERATE */}
        <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 h-full">
                <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    </span>
                    <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wide">{t('criteria.section_auto')}</h3>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                    {t('criteria.quick_exam_desc')}
                </p>

                <textarea
                    value={simulationPrompt}
                    onChange={(e) => setSimulationPrompt(e.target.value)}
                    placeholder={t('criteria.quick_exam_placeholder')}
                    rows={3}
                    className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 mb-4 resize-none"
                />
                
                <button 
                    onClick={() => onSimulate(simulationPrompt)} 
                    disabled={isLoading} 
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all text-sm flex items-center justify-center gap-2"
                >
                    {isLoading ? t('criteria.generating') : t('criteria.quick_exam_btn')}
                </button>
            </div>
        </div>

        {/* RIGHT COLUMN: MANUAL CONFIG */}
        <div className="flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-8">
            <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </span>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{t('criteria.section_manual')}</h3>
            </div>

            <div className="space-y-3">
                <SelectField label={t('criteria.label_chapter')} value={currentCriteria.chapter} onChange={e => handleChange('chapter', e.target.value)}>
                    {CHAPTERS_KEYS.map(key => <option key={key} value={key}>{t(`constants.chapters.${key}`)}</option>)}
                </SelectField>

                <div className="grid grid-cols-2 gap-3">
                    <SelectField label={t('criteria.label_type')} value={currentCriteria.questionType} onChange={e => handleChange('questionType', e.target.value)}>
                        {QUESTION_TYPES_KEYS.map(key => <option key={key} value={key}>{t(`constants.types.${key}`)}</option>)}
                    </SelectField>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('criteria.label_quantity')}</label>
                        <input type="number" min="1" max="40" value={currentCriteria.questionCount} onChange={e => handleChange('questionCount', parseInt(e.target.value) || 1)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                     <SelectField label={t('criteria.label_context')} value={currentCriteria.setting} onChange={e => handleChange('setting', e.target.value)}>
                        {SETTINGS_KEYS.map(key => <option key={key} value={key}>{t(`constants.settings.${key}`)}</option>)}
                    </SelectField>
                    <SelectField label={t('criteria.label_difficulty')} value={currentCriteria.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
                        {DIFFICULTIES_KEYS.map(key => <option key={key} value={key}>{t(`constants.difficulties.${key}`)}</option>)}
                    </SelectField>
                </div>
                
                <SelectField label={t('criteria.label_competency')} value={currentCriteria.competency} onChange={e => handleChange('competency', e.target.value)}>
                    {COMPETENCIES_KEYS.map(key => <option key={key} value={key}>{t(`constants.competencies.${key}`)}</option>)}
                </SelectField>

                <button onClick={handleAddToQueue} className="w-full py-2.5 mt-2 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:border-sky-500 hover:text-sky-600 transition-colors flex items-center justify-center gap-2">
                    <span>+</span> {t('criteria.add_queue')}
                </button>
            </div>

            {/* Queue List */}
            {batchQueue.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">{t('criteria.queue_title')} ({batchQueue.length})</span>
                        <button onClick={() => setBatchQueue([])} className="text-xs text-red-500 hover:underline">{t('criteria.clear_all')}</button>
                    </div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar pr-1">
                        {batchQueue.map((item, idx) => (
                            <QueueItem key={idx} index={idx} criteria={item} onRemove={() => handleRemoveFromQueue(idx)} t={t} />
                        ))}
                    </div>
                </div>
            )}

            <button onClick={handleGenerateAll} disabled={isLoading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-sm">
                {isLoading ? t('criteria.processing') : t('criteria.generate_btn', { count: batchQueue.length > 0 ? batchQueue.reduce((s, i) => s + i.questionCount, 0) : currentCriteria.questionCount })}
            </button>
        </div>

      </div>
    </div>
  );
};
