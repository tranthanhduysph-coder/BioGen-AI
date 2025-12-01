import React, { useState } from 'react';
import { CRITERIA_DATA, SETTINGS, QUESTION_TYPES } from '../constants';
import { useTranslation } from 'react-i18next';
import type { Criteria } from '../types';

interface CriteriaSelectorProps {
  onGenerate: (config: any) => void; // Callback for Manual
  isLoading: boolean;
  onSimulate: (config: any) => void; // Callback for Auto Exam
}

// ... MultiSelect Component (Keep as is from previous update) ...
const MultiSelect: React.FC<{ 
    options: string[], 
    selected: string[], 
    onChange: (sel: string[]) => void, 
    label: string, 
    t: any 
}> = ({ options, selected, onChange, label, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleOption = (key: string) => selected.includes(key) ? onChange(selected.filter(k => k !== key)) : onChange([...selected, key]);
    const toggleAll = () => selected.length === options.length ? onChange([]) : onChange([...options]);

    return (
        <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">{label}</label>
            <div className="relative">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center hover:border-indigo-500">
                    <span className="truncate text-slate-700 dark:text-slate-200">{selected.length === 0 ? "Chọn chủ đề..." : `${selected.length} chủ đề`}</span>
                    <svg className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                             <button onClick={toggleAll} className="text-xs font-bold text-indigo-600 w-full text-left">{selected.length === options.length ? t('criteria.clear_all') : t('criteria.select_all')}</button>
                        </div>
                        {options.map(key => (
                            <div key={key} onClick={() => toggleOption(key)} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(key) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {selected.includes(key) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                                </div>
                                <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{key}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Re-introduce SelectField for Manual Mode
const SelectField: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, disabled?: boolean, children: React.ReactNode }> = ({ label, value, onChange, disabled, children }) => (
    <div className="w-full group">
        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 group-focus-within:text-indigo-600 transition-colors">{label}</label>
        <div className="relative">
          <select value={value} onChange={onChange} disabled={disabled} className={`w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition shadow-sm ${disabled ? 'opacity-60 bg-slate-100' : ''}`}>
              {children}
          </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
        </div>
    </div>
);

// Queue Item for Manual Mode
const QueueItem: React.FC<{ criteria: Criteria, index: number, onRemove: () => void }> = ({ criteria, index, onRemove }) => (
    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded mb-2 text-xs">
        <div className="flex-1 mr-2 overflow-hidden">
            <div className="font-bold text-slate-700 dark:text-slate-200 truncate">{criteria.chapter}</div>
            <div className="text-slate-500">{criteria.questionType.split('(')[0]} • {criteria.questionCount} câu</div>
        </div>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500">✕</button>
    </div>
)

export const CriteriaSelector: React.FC<CriteriaSelectorProps> = ({ isLoading, onSimulate, onGenerate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto'); // Tab state

  // --- AUTO MODE STATES ---
  const [p1Topics, setP1Topics] = useState<string[]>([]);
  const [p2Topics, setP2Topics] = useState<string[]>([]);
  const [p3Topics, setP3Topics] = useState<string[]>([]);

  // --- MANUAL MODE STATES ---
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
  const [manualQueue, setManualQueue] = useState<Criteria[]>([]);

  const handleManualChange = (field: keyof Criteria, value: string | number) => {
      setCurrentCriteria(prev => ({ ...prev, [field]: value }));
  };
  const addToManualQueue = () => setManualQueue([...manualQueue, { ...currentCriteria }]);
  const removeFromManualQueue = (idx: number) => setManualQueue(manualQueue.filter((_, i) => i !== idx));
  
  // Handlers
  const handleAutoBuild = () => {
      onSimulate({
          p1_topics: p1Topics.length > 0 ? p1Topics : CRITERIA_DATA.chapters,
          p2_topics: p2Topics.length > 0 ? p2Topics : CRITERIA_DATA.chapters,
          p3_topics: p3Topics.length > 0 ? p3Topics : CRITERIA_DATA.chapters,
      });
  };

  const handleManualGenerate = () => {
      if (manualQueue.length > 0) onGenerate(manualQueue);
      else onGenerate([currentCriteria]);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      
      {/* Header & Tabs */}
      <div className="flex-none border-b border-slate-100 dark:border-slate-800">
        <div className="p-4 pb-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                {t('criteria.title')}
            </h2>
            <div className="flex gap-1">
                <button 
                    onClick={() => setActiveTab('auto')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'auto' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    {t('criteria.tab_auto')}
                </button>
                <button 
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'manual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    {t('criteria.tab_manual')}
                </button>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* TAB 1: AUTO EXAM 2025 */}
          {activeTab === 'auto' && (
              <div className="space-y-4 animate-fade-in">
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                      <div className="flex justify-between mb-2"><span className="text-xs font-bold text-blue-800 dark:text-blue-200 bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded">PHẦN I (18 Câu)</span></div>
                      <MultiSelect label={t('criteria.select_topics')} options={CRITERIA_DATA.chapters} selected={p1Topics} onChange={setP1Topics} t={t} />
                  </div>
                  <div className="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
                      <div className="flex justify-between mb-2"><span className="text-xs font-bold text-purple-800 dark:text-purple-200 bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded">PHẦN II (4 Câu Chùm)</span></div>
                      <MultiSelect label={t('criteria.select_topics')} options={CRITERIA_DATA.chapters} selected={p2Topics} onChange={setP2Topics} t={t} />
                  </div>
                  <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                      <div className="flex justify-between mb-2"><span className="text-xs font-bold text-orange-800 dark:text-orange-200 bg-orange-200 dark:bg-orange-800 px-2 py-0.5 rounded">PHẦN III (6 Câu Ngắn)</span></div>
                      <MultiSelect label={t('criteria.select_topics')} options={CRITERIA_DATA.chapters} selected={p3Topics} onChange={setP3Topics} t={t} />
                  </div>
              </div>
          )}

          {/* TAB 2: MANUAL CONFIG */}
          {activeTab === 'manual' && (
              <div className="space-y-4 animate-fade-in">
                  <SelectField label={t('criteria.label_chapter')} value={currentCriteria.chapter} onChange={e => handleManualChange('chapter', e.target.value)}>
                      {CRITERIA_DATA.chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </SelectField>
                  
                  <div className="grid grid-cols-2 gap-3">
                      <SelectField label={t('criteria.label_type')} value={currentCriteria.questionType} onChange={e => handleManualChange('questionType', e.target.value)}>
                          {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </SelectField>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">{t('criteria.label_quantity')}</label>
                          <input type="number" min="1" max="40" value={currentCriteria.questionCount} onChange={e => handleManualChange('questionCount', parseInt(e.target.value) || 1)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500" />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                       <SelectField label={t('criteria.label_context')} value={currentCriteria.setting} onChange={e => handleManualChange('setting', e.target.value)}>
                          {SETTINGS.map(s => <option key={s} value={s}>{s}</option>)}
                      </SelectField>
                      <SelectField label={t('criteria.label_difficulty')} value={currentCriteria.difficulty} onChange={e => handleManualChange('difficulty', e.target.value)}>
                          {CRITERIA_DATA.difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                      </SelectField>
                  </div>
                  
                  <SelectField label={t('criteria.label_competency')} value={currentCriteria.competency} onChange={e => handleManualChange('competency', e.target.value)}>
                      {CRITERIA_DATA.competencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </SelectField>

                  <button onClick={addToManualQueue} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
                      <span>+</span> {t('criteria.add_queue')}
                  </button>

                  {manualQueue.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between mb-2 text-xs font-bold text-slate-400 uppercase">{t('criteria.queue_title')} ({manualQueue.length}) <button onClick={() => setManualQueue([])} className="text-red-500 hover:underline">{t('criteria.clear_all')}</button></div>
                          <div className="max-h-40 overflow-y-auto custom-scrollbar">
                              {manualQueue.map((item, idx) => (
                                  <QueueItem key={idx} index={idx} criteria={item} onRemove={() => removeFromManualQueue(idx)} />
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

      </div>

      {/* Footer Button */}
      <div className="flex-none p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button 
            onClick={activeTab === 'auto' ? handleAutoBuild : handleManualGenerate}
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
             {isLoading ? (
                 <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> {t('criteria.processing')}</>
             ) : (
                 activeTab === 'auto' ? t('criteria.start_build') : t('criteria.generate_btn', {count: manualQueue.length > 0 ? manualQueue.reduce((s, i) => s + i.questionCount, 0) : currentCriteria.questionCount})
             )}
        </button>
      </div>
    </div>
  );
};
