
import React, { useState } from 'react';
import { extractMetrics } from '../services/geminiService';
import { exportQuestionsToPDF } from '../services/exportService';
import { QuestionData } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { QuestionDisplay } from './QuestionDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useSession } from '../contexts/SessionContext';

export const ExtractorModule: React.FC = () => {
  const { t, language } = useAppContext();
  const { extractor, setExtractor } = useSession();
  
  const { questionText, optionsText, answerKey, customPrompt, results } = extractor;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setLoading(true);
    setError(null);
    setExtractor(prev => ({ ...prev, results: [] }));
    
    try {
      const data = await extractMetrics(questionText, optionsText, answerKey, customPrompt, language);
      
      let newResults: Partial<QuestionData>[] = [];
      if (Array.isArray(data)) {
        newResults = data;
      } else {
        newResults = [{ ...data, Question: questionText, options: optionsText, Answer: answerKey || data.Answer }];
      }
      setExtractor(prev => ({ ...prev, results: newResults }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateExtractor = (field: string, value: string) => {
    setExtractor(prev => ({ ...prev, [field]: value }));
  };

  const textareaClass = "w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors duration-200";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b pb-4 border-slate-100 dark:border-slate-700">
          <span className="text-emerald-600 text-2xl">🔍</span> {t('extractorTitle')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('inputQuestion')}</label>
            <textarea
              required
              rows={6}
              className={textareaClass}
              value={questionText}
              onChange={e => updateExtractor('questionText', e.target.value)}
              placeholder={t('extractorPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('inputOptions')}</label>
              <textarea
                rows={4}
                className={textareaClass}
                value={optionsText}
                onChange={e => updateExtractor('optionsText', e.target.value)}
                placeholder={t('optionsPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('inputKey')}
              </label>
              <textarea
                rows={4}
                className={`${textareaClass} border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/20`}
                value={answerKey}
                onChange={e => updateExtractor('answerKey', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('customPrompt')}
            </label>
            <textarea
              rows={2}
              className={textareaClass}
              value={customPrompt}
              onChange={e => updateExtractor('customPrompt', e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
            >
              {loading ? t('analyzing') : t('analyze')}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {results.length > 0 && (
        <>
          <div className="flex justify-end">
            <button 
              onClick={() => exportQuestionsToPDF(results, "BioMetric_Reverse_Analysis")}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Export PDF
            </button>
          </div>
          <div className="space-y-6">
            {results.map((res, i) => (
              <QuestionDisplay key={i} data={res} title={`Metrics Analysis #${i + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
