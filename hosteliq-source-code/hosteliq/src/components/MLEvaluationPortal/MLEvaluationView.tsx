import React, { useState } from 'react';
import { MLEvaluation } from '../../types';
import { testClassifyText } from '../../lib/api';
import { BookOpen, Sparkles, CheckCircle, ArrowRight, Download, BarChart2, Layers, Cpu } from 'lucide-react';

interface MLEvaluationViewProps {
  evaluation: MLEvaluation | null;
}

export const MLEvaluationView: React.FC<MLEvaluationViewProps> = ({ evaluation }) => {
  const [testText, setTestText] = useState('AC in room 304 stopped cooling and compressor is making loud rattling noise');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!evaluation) {
    return <div className="p-12 text-center text-slate-500">Loading ML evaluation data...</div>;
  }

  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testText.trim()) return;
    setIsTesting(true);
    try {
      const res = await testClassifyText(testText.trim());
      setTestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadDataset = () => {
    const headers = 'id,text,category,severity,block,room,resolution_minutes\n';
    const rows = evaluation.datasetSamples
      .map((s) => `${s.id},"${s.text}",${s.category},${s.severity},${s.block},${s.room},${s.resolution_minutes}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hosteliq_training_dataset.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Title & Academic Context */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Academic Research & Model Defense (PRD Section 17 & 22)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          HostelIQ Machine Learning Evaluation Workbench
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Baseline-first quantitative evaluation. Demonstrates measurable classification precision, duplicate similarity retrieval @ K, and resolution time regression metrics over held-out student hostel records.
        </p>
      </div>

      {/* Model Record Card (PRD AI Rule: Model record, version, limitations) */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs text-indigo-400 font-mono font-medium">MODEL SPECIFICATION</span>
            <h2 className="text-lg font-bold text-white tracking-tight">{evaluation.modelCard.name}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-mono rounded-lg border border-indigo-500/30">
              {evaluation.modelCard.version}
            </span>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-mono rounded-lg border border-emerald-500/30">
              Dataset: {evaluation.modelCard.datasetSize} Records
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Classification F1:</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {(evaluation.modelCard.f1Score * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Duplicate Precision @ 3:</span>
            <span className="text-2xl font-bold font-mono text-indigo-400">
              {(evaluation.modelCard.duplicatePrecisionAt3 * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Regression MAE:</span>
            <span className="text-2xl font-bold font-mono text-amber-400">
              {evaluation.modelCard.resolutionMAE} mins
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Regression R²:</span>
            <span className="text-2xl font-bold font-mono text-purple-400">
              {evaluation.modelCard.resolutionR2}
            </span>
          </div>
        </div>
      </div>

      {/* Baseline vs Improved Model Comparison Table (PRD Section 17 & 22) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Baseline vs Proposed AI/ML Comparative Study</h3>
            <p className="text-xs text-slate-500">
              Quantifiable empirical gains across classification, semantic retrieval, and SLA estimation.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Task</th>
                <th className="py-2.5 px-3">Baseline Architecture</th>
                <th className="py-2.5 px-3">Proposed Model</th>
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3">Baseline</th>
                <th className="py-2.5 px-3">Proposed</th>
                <th className="py-2.5 px-3 text-emerald-600">Improvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluation.comparisonTable.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.task}</td>
                  <td className="py-2.5 px-3 text-slate-600">{row.baselineModel}</td>
                  <td className="py-2.5 px-3 font-medium text-indigo-700">{row.improvedModel}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{row.primaryMetric}</td>
                  <td className="py-2.5 px-3 font-mono">{row.baselineScore}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.improvedScore}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{row.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Classification Breakdown & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Precision / Recall / F1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Per-Category Classification Breakdown</h3>
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Precision</th>
                <th className="py-2 px-3">Recall</th>
                <th className="py-2 px-3">F1-Score</th>
                <th className="py-2 px-3 text-right">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluation.classificationMetrics.map((m) => (
                <tr key={m.category}>
                  <td className="py-2 px-3 font-semibold text-slate-900">{m.category}</td>
                  <td className="py-2 px-3 font-mono">{(m.precision * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 font-mono">{(m.recall * 100).toFixed(1)}%</td>
                  <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                    {(m.f1 * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 font-mono text-right text-slate-500">{m.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Held-Out Test Confusion Matrix</h3>
          <p className="text-xs text-slate-500">Predicted label (columns) vs True label (rows).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr>
                  <th className="p-1.5 text-slate-400 font-normal">True \ Pred</th>
                  {evaluation.confusionMatrix.labels.map((l) => (
                    <th key={l} className="p-1.5 font-bold text-slate-800">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluation.confusionMatrix.matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-1.5 font-bold text-slate-800 text-left">
                      {evaluation.confusionMatrix.labels[rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className={`p-1.5 font-mono text-xs ${
                            isDiagonal
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : val > 0
                              ? 'bg-amber-50 text-amber-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Interactive Model Inference Sandbox */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Live Inference Sandbox & Feature Testing</h3>
        </div>
        <p className="text-xs text-slate-500">
          Input any arbitrary student complaint string to test the feature extractor and classification confidence vectors.
        </p>

        <form onSubmit={handleRunInference} className="space-y-3">
          <textarea
            rows={2}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            placeholder="Type a sample complaint..."
          />
          <button
            type="submit"
            disabled={isTesting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
          >
            {isTesting ? 'Evaluating...' : 'Run Real-Time ML Inference'}
          </button>
        </form>

        {testResult && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Predicted Class:</span>
              <span className="font-bold text-indigo-700 text-sm">
                {testResult.predictedCategory} ({Math.round(testResult.confidence * 100)}% Confidence)
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block mb-1">Class Probability / Weight Distribution:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Object.entries(testResult.scores || {}).map(([cat, score]: [string, any]) => (
                  <div key={cat} className="p-2 bg-white rounded border border-slate-200 text-center">
                    <span className="block font-semibold text-slate-800 text-[11px]">{cat}</span>
                    <span className="font-mono text-[10px] text-slate-500">{Number(score).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Explorer & Export (PRD Section 16) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dataset Explorer & Training Samples (PRD Section 16)</h3>
            <p className="text-xs text-slate-500">
              Curated hostel problem corpus with normalized labels, severity factors, and resolution minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadDataset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Dataset (CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Complaint Text</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Location</th>
                <th className="py-2 px-3 text-right">Resolution Mins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluation.datasetSamples.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 px-3 font-mono text-slate-500">#{row.id}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">{row.text}</td>
                  <td className="py-2 px-3">{row.category}</td>
                  <td className="py-2 px-3 uppercase text-[10px] font-semibold">{row.severity}</td>
                  <td className="py-2 px-3 text-slate-500">Block {row.block} · {row.room}</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                    {row.resolution_minutes}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
