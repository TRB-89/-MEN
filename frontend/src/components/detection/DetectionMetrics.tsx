import React from 'react';
import { DetectionMetricsResponse } from '../../types';
import { OmenPanel } from '../ui';

export interface DetectionMetricsProps {
  metricsData: DetectionMetricsResponse | null;
  className?: string;
}

export const DetectionMetrics: React.FC<DetectionMetricsProps> = ({
  metricsData,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <OmenPanel className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-2">
          <div>
            <h3 className="font-heading text-base font-bold text-primary uppercase tracking-wide">
              BENCHMARK EVALUATION COMPARISON
            </h3>
            <p className="font-sans text-xs text-secondary mt-1">
              Empirical metrics evaluated against the official UNSW-NB15 holdout test dataset. Zero fabricated numbers.
            </p>
          </div>
          <span className="font-mono text-xs px-3 py-1 bg-surface-elevated border border-border text-muted">
            EVALUATION DATASET: {metricsData?.evaluation_dataset || 'UNSW-NB15 (82,332 records)'}
          </span>
        </div>

        {/* Performance Comparison Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left font-mono text-xs border border-border">
            <thead>
              <tr className="bg-surface-elevated border-b border-border text-muted uppercase text-[11px]">
                <th className="p-3">MODEL ARCHITECTURE</th>
                <th className="p-3">TYPE</th>
                <th className="p-3">ACCURACY</th>
                <th className="p-3">PRECISION</th>
                <th className="p-3">RECALL</th>
                <th className="p-3">F1-SCORE</th>
                <th className="p-3">ROC-AUC</th>
                <th className="p-3">HOLDOUT SAMPLES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {/* Random Forest Row */}
              <tr className="hover:bg-zinc-900/50">
                <td className="p-3 text-chrome font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-success" />
                  RANDOM FOREST
                </td>
                <td className="p-3 text-muted">Supervised Ensemble (60 trees)</td>
                <td className="p-3 text-chrome font-bold">
                  {metricsData?.models?.random_forest ? `${(metricsData.models.random_forest.accuracy * 100).toFixed(2)}%` : 'Model Not Trained'}
                </td>
                <td className="p-3 text-chrome">
                  {metricsData?.models?.random_forest ? `${(metricsData.models.random_forest.precision * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-chrome font-bold">
                  {metricsData?.models?.random_forest ? `${(metricsData.models.random_forest.recall * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-crimson font-bold">
                  {metricsData?.models?.random_forest ? `${(metricsData.models.random_forest.f1_score * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-chrome">
                  {metricsData?.models?.random_forest ? metricsData.models.random_forest.roc_auc.toFixed(4) : '—'}
                </td>
                <td className="p-3 text-muted">
                  {metricsData?.models?.random_forest ? metricsData.models.random_forest.test_samples.toLocaleString() : '—'}
                </td>
              </tr>

              {/* PyTorch MLP Row */}
              <tr className="hover:bg-zinc-900/50">
                <td className="p-3 text-chrome font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-crimson" />
                  PYTORCH MLP
                </td>
                <td className="p-3 text-muted">Deep Neural Net (191→128→64→1)</td>
                <td className="p-3 text-chrome font-bold">
                  {metricsData?.models?.mlp_neural_network ? `${(metricsData.models.mlp_neural_network.accuracy * 100).toFixed(2)}%` : 'Model Not Trained'}
                </td>
                <td className="p-3 text-chrome">
                  {metricsData?.models?.mlp_neural_network ? `${(metricsData.models.mlp_neural_network.precision * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-crimson font-bold">
                  {metricsData?.models?.mlp_neural_network ? `${(metricsData.models.mlp_neural_network.recall * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-chrome font-bold">
                  {metricsData?.models?.mlp_neural_network ? `${(metricsData.models.mlp_neural_network.f1_score * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-chrome">
                  {metricsData?.models?.mlp_neural_network ? metricsData.models.mlp_neural_network.roc_auc.toFixed(4) : '—'}
                </td>
                <td className="p-3 text-muted">
                  {metricsData?.models?.mlp_neural_network ? metricsData.models.mlp_neural_network.test_samples.toLocaleString() : '—'}
                </td>
              </tr>

              {/* Isolation Forest Row */}
              <tr className="hover:bg-zinc-900/50">
                <td className="p-3 text-chrome font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400" />
                  ISOLATION FOREST
                </td>
                <td className="p-3 text-muted">Unsupervised Outlier Isolation</td>
                <td className="p-3 text-muted">— (Anomaly Only)</td>
                <td className="p-3 text-chrome">
                  {metricsData?.models?.isolation_forest ? `${(metricsData.models.isolation_forest.precision * 100).toFixed(2)}%` : 'Model Not Trained'}
                </td>
                <td className="p-3 text-chrome font-bold">
                  {metricsData?.models?.isolation_forest ? `${(metricsData.models.isolation_forest.recall * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-chrome">
                  {metricsData?.models?.isolation_forest ? `${(metricsData.models.isolation_forest.f1_score * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="p-3 text-muted">—</td>
                <td className="p-3 text-muted">30,000 baseline fit</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Confusion Matrix Highlights */}
        {metricsData?.models?.random_forest?.confusion_matrix && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border p-4 bg-surface-elevated">
              <span className="font-mono text-xs font-bold text-chrome uppercase tracking-wider block mb-3">
                RANDOM FOREST CONFUSION MATRIX
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center">
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">TRUE NEGATIVE (BENIGN)</span>
                  <span className="text-success font-bold text-sm">
                    {metricsData.models.random_forest.confusion_matrix.tn.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">FALSE POSITIVE (ALERT)</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {metricsData.models.random_forest.confusion_matrix.fp.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">FALSE NEGATIVE (MISSED)</span>
                  <span className="text-crimson font-bold text-sm">
                    {metricsData.models.random_forest.confusion_matrix.fn.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">TRUE POSITIVE (CAUGHT)</span>
                  <span className="text-success font-bold text-sm">
                    {metricsData.models.random_forest.confusion_matrix.tp.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-border p-4 bg-surface-elevated">
              <span className="font-mono text-xs font-bold text-chrome uppercase tracking-wider block mb-3">
                PYTORCH MLP CONFUSION MATRIX
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center">
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">TRUE NEGATIVE (BENIGN)</span>
                  <span className="text-success font-bold text-sm">
                    {metricsData.models.mlp_neural_network?.confusion_matrix?.tn.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">FALSE POSITIVE (ALERT)</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {metricsData.models.mlp_neural_network?.confusion_matrix?.fp.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">FALSE NEGATIVE (MISSED)</span>
                  <span className="text-crimson font-bold text-sm">
                    {metricsData.models.mlp_neural_network?.confusion_matrix?.fn.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-zinc-900 border border-border">
                  <span className="text-[10px] text-muted block">TRUE POSITIVE (CAUGHT)</span>
                  <span className="text-success font-bold text-sm">
                    {metricsData.models.mlp_neural_network?.confusion_matrix?.tp.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </OmenPanel>
    </div>
  );
};
