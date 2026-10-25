import React from 'react';
import { 
  GitBranch, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Zap, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { AttackPath, CriticalChokepoint } from '../../types';

export interface PredictionSummaryPanelProps {
  predictionId?: string | null;
  totalPaths: number;
  highestRiskScore: number;
  estimatedTimeMins?: number;
  chokepoints?: CriticalChokepoint[];
  topPathNodes?: string[];
  snapshotId?: string;
  onRefreshPrediction?: () => void;
  className?: string;
}

export const PredictionSummaryPanel: React.FC<PredictionSummaryPanelProps> = ({
  predictionId = 'PRED-ACTIVE-001',
  totalPaths = 4,
  highestRiskScore = 89.4,
  estimatedTimeMins = 24,
  chokepoints = [
    { node_id: 'srv-app-01', name: 'Application Proxy', frequency: 3, criticality: 'HIGH' },
    { node_id: 'db-prod-01', name: 'Production Database', frequency: 4, criticality: 'CRITICAL' },
  ],
  topPathNodes = ['srv-web-01', 'srv-app-01', 'db-prod-01'],
  snapshotId = 'SNAP-TOPO-LIVE',
  onRefreshPrediction,
  className = '',
}) => {
  return (
    <OmenPanel className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            MODULE 03 ATTACK PATH PREDICTION HANDOFF
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-muted">DOSSIER REF:</span>
          <span className="px-2 py-0.5 bg-surface-elevated text-chrome font-bold border border-border rounded">
            {predictionId || 'PRED-LIVE'}
          </span>
          <span className="text-muted">•</span>
          <span className="text-muted">SNAPSHOT:</span>
          <span className="text-secondary">{snapshotId}</span>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 bg-surface border border-border rounded-xl">
          <span className="text-[10px] text-muted uppercase block">CANDIDATE CORRIDORS</span>
          <span className="font-heading text-xl font-extrabold text-primary mt-1 block">
            {totalPaths} PATHWAYS
          </span>
          <span className="text-[10px] text-secondary">Traversable attack corridors</span>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl">
          <span className="text-[10px] text-muted uppercase block">MAX COMPOSITE RISK</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-heading text-xl font-extrabold text-crimson">
              {highestRiskScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-muted">/ 100</span>
          </div>
          <span className="text-[10px] text-crimson-glow font-bold uppercase">CRITICAL SEVERITY</span>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl">
          <span className="text-[10px] text-muted uppercase block">TRAVERSAL VELOCITY</span>
          <span className="font-heading text-xl font-extrabold text-amber-400 mt-1 block">
            ~{estimatedTimeMins} MINS
          </span>
          <span className="text-[10px] text-secondary">To reach crown jewels</span>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl">
          <span className="text-[10px] text-muted uppercase block">PIVOT CHOKEPOINTS</span>
          <span className="font-heading text-xl font-extrabold text-chrome mt-1 block">
            {chokepoints.length} ASSETS
          </span>
          <span className="text-[10px] text-secondary">Prime containment targets</span>
        </div>
      </div>

      {/* Critical Path Flow Strip */}
      <div className="p-3 bg-surface-elevated border border-border rounded-xl font-mono text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
            PRIMARY THREAT TRAJECTORY (RANK 1)
          </span>
          <span className="text-[10px] text-crimson font-bold">EXPLOIT VELOCITY: HIGH</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {topPathNodes.map((node, idx) => (
            <React.Fragment key={node}>
              <span className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                idx === 0 
                  ? 'bg-crimson/20 border-crimson text-crimson-glow'
                  : idx === topPathNodes.length - 1
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-background border-border text-primary'
              }`}>
                {node}
              </span>
              {idx < topPathNodes.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </OmenPanel>
  );
};
