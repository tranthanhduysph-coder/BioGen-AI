
import React, { useState } from 'react';
import { performIRTAnalysis } from '../services/irtService';
import { generateIRTInsight } from '../services/geminiService';
import { exportIRTToCSV } from '../services/exportService';
import { IRTAnalysisResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { useAppContext } from '../contexts/AppContext';
import { useSession } from '../contexts/SessionContext';

export const IRTModule: React.FC = () => {
  const { t, language } = useAppContext();
  const { irt, setIrt } = useSession();
  const { resultsCsv, metadataCsv, analysis, aiReport } = irt;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setIrt(prev => ({ ...prev, analysis: null, aiReport: "" }));

    try {
      const result = performIRTAnalysis(resultsCsv, metadataCsv);
      // Intermediate update
      setIrt(prev => ({ ...prev, analysis: result }));
      
      const insight = await generateIRTInsight(result, language);
      setIrt(prev => ({ ...prev, analysis: result, aiReport: insight }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const updateIrt = (field: string, value: string) => {
    setIrt(prev => ({ ...prev, [field]: value }));
  };

  const textareaClass = "w-full h-40 rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-xs font-mono p-2 border bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200";

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-pink-600 text-2xl">📊</span> {t('irtTitle')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('resultsCsv')}
            </label>
            <textarea
              className={textareaClass}
              value={resultsCsv}
              onChange={e => updateIrt('resultsCsv', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('metaCsv')}
            </label>
            <textarea
              className={textareaClass}
              value={metadataCsv}
              onChange={e => updateIrt('metadataCsv', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
          >
            {loading ? t('calculating') : t('analyzeData')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700">
             <div>
               <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Reliability (Cronbach's α)</div>
               <div className={`text-2xl font-bold ${analysis.reliability > 0.7 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                 {analysis.reliability}
               </div>
             </div>
             <button 
               onClick={() => exportIRTToCSV(analysis)}
               className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow font-medium transition-colors flex items-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               Export CSV
             </button>
          </div>

          {aiReport && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6">
              <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                {t('aiReport')}
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {aiReport}
              </div>
            </div>
          )}

          {/* Item Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900">Item Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">ID</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Difficulty (P)</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">Discrimination (D)</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-500">IRT (b)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {analysis.items.map((item) => (
                    <tr key={item.itemId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-slate-900 dark:text-white">{item.itemId}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.pVal}</td>
                      <td className={`px-4 py-3 font-bold ${item.pBis < 0.2 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{item.pBis}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
