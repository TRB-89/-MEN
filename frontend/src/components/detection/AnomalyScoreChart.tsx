import React from 'react';
import { OmenPanel } from '../ui';

export interface AnomalyScoreChartProps {
  score: number | null;
  threshold: number;
  className?: string;
}

export const AnomalyScoreChart: React.FC<AnomalyScoreChartProps> = ({
  score,
  threshold,
  className = '',
}) => {
  const isAnomaly = score !== null && score >= threshold;
  const percentage = score !== null ? Math.min(100, Math.max(0, score * 100)) : 0;
  const thresholdPercentage = Math.min(100, Math.max(0, threshold * 100));

  return (
    <OmenPanel className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-muted uppercase">ANOMALY INDEX</span>
        <span className="font-mono text-xs font-bold text-chrome">
          {score !== null ? score.toFixed(4) : 'N/A'}
        </span>
      </div>

      {/* Score gauge bar */}
      <div className="w-full bg-zinc-900 h-2.5 border border-zinc-800 overflow-hidden mb-2 relative">
        {/* Calibrated Threshold Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-chrome z-10 shadow-chrome-sm"
          style={{ left: `${thresholdPercentage}%` }}
          title={`Calibrated Threshold: ${threshold}`}
        />
        <div
          className={`h-full transition-all duration-500 ${
            isAnomaly ? 'bg-crimson' : 'bg-success'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between font-mono text-[9px] text-muted">
        <span>0.0 (NORMAL)</span>
        <span className="text-chrome font-bold">THRESH: {threshold.toFixed(4)}</span>
        <span>1.0 (ANOMALY)</span>
      </div>
    </OmenPanel>
  );
};
