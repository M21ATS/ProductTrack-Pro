import React, { useState } from 'react';
import { Sparkles, Lightbulb, ChevronRight, ChevronDown, RefreshCcw } from 'lucide-react';
import { ProductRow, AnalysisResult } from '../types';
import { analyzeProductData } from '../services/ai';
import { clsx } from 'clsx';

interface AnalysisPanelProps {
  data: ProductRow[];
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!data || data.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeProductData(data);
      setResult(analysis);
      setIsOpen(true);
    } catch (e) {
      setError("Failed to generate insights. Please check your API key or try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/30 rounded-xl overflow-hidden mb-6 shadow-sm transition-colors duration-300">
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-800 border-b border-indigo-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Smart Insights</h3>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {isAnalyzing ? (
            <>
              <RefreshCcw className="animate-spin" size={16} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Lightbulb size={16} />
              <span>{result ? 'Regenerate Insights' : 'Analyze Data'}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && isOpen && (
        <div className="p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="mb-4">
            <h4 className="text-sm uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-2">Summary</h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{result.summary || "No summary available."}</p>
          </div>
          
          {result.recommendations && Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};