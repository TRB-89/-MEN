import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  TrendingDown, 
  Activity, 
  Lock, 
  Crown,
  Layers
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { SimulationMetrics } from '../../types';

export interface RiskReductionVisualizerProps {
  metrics: SimulationMetrics;
  actionType: string;
  targetName: string;
  className?: string;
}

export const RiskReductionVisualizer: React.FC<RiskReductionVisualizerProps> = ({
  metrics,
  actionType,
  targetName,
  className = '',
}) => {
  const riskBefore = metrics.risk_score_before;
  const riskAfter = metrics.risk_score_after;
  const riskReductionPct = metrics.risk_reduction_pct;
  const blastBefore = metrics.blast_radius_before;
  const blastAfter = metrics.blast_radius_after;
  const utility = metrics.net_defensive_utility;

  return (
    <OmenPanel className={`space-y-4 ${className}`} glowing>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-400" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            CONTAINMENT EFFICACY & RISK MITIGATION ANALYSIS
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-muted">NET DEFENSIVE UTILITY:</span>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold rounded">
            +{(utility * 100).toFixed(1)} / 100
          </span>
        </div>
      </div>

      {/* KPI Comparison Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        {/* Risk Score Delta */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase block">COMPOSITE GRAPH RISK</span>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-lg font-bold text-crimson line-through">
              {riskBefore.toFixed(1)}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="font-heading text-2xl font-extrabold text-emerald-400">
              {riskAfter.toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold block">
            -{riskReductionPct.toFixed(1)}% RISK REDUCTION
          </span>
        </div>

        {/* Blast Radius Delta */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase block">REACHABLE BLAST RADIUS</span>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-lg font-bold text-crimson line-through">
              {blastBefore}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="font-heading text-2xl font-extrabold text-chrome">
              {blastAfter} NODES
            </span>
          </div>
          <span className="text-[10px] text-secondary">
            {metrics.containment_efficacy_pct.toFixed(1)}% Surface Quarantined
          </span>
        </div>

        {/* Severed Attack Pathways */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase block">SEVERED ATTACK EDGES</span>
          <span className="font-heading text-2xl font-extrabold text-amber-400 block">
            {metrics.severed_edges_count} PATHWAYS
          </span>
          <span className="text-[10px] text-secondary">
            Lateral routes neutralized
          </span>
        </div>

        {/* Shielded Crown Jewels */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-1">
          <span className="text-[10px] text-muted uppercase block">SHIELDED CROWN JEWELS</span>
          <span className="font-heading text-2xl font-extrabold text-chrome block">
            {metrics.critical_assets_saved_count} CROWNS
          </span>
          <span className="text-[10px] text-secondary">
            Protected from compromise
          </span>
        </div>
      </div>

      {/* Visual Risk Progress Comparison Bars */}
      <div className="p-3.5 bg-surface-elevated border border-border rounded-xl space-y-3 font-mono text-xs">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-muted">BASELINE PRE-CONTAINMENT RISK EXPOSURE:</span>
            <span className="text-crimson font-bold">{riskBefore.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
            <div
              className="bg-crimson h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, riskBefore)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-muted">SIMULATED POST-DEFENSE RESIDUAL RISK:</span>
            <span className="text-emerald-400 font-bold">{riskAfter.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, riskAfter)}%` }}
            />
          </div>
        </div>
      </div>
    </OmenPanel>
  );
};
