import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Activity, 
  Lock,
  RotateCcw
} from 'lucide-react';
import { DefenseSimulationResult } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenButton } from '../ui/OmenButton';

interface SimulationOutcomeProps {
  result: DefenseSimulationResult | null;
  onReset?: () => void;
}

export const SimulationOutcome: React.FC<SimulationOutcomeProps> = ({ result, onReset }) => {
  if (!result) {
    return (
      <OmenPanel className="p-6 text-center text-muted font-mono text-xs">
        Execute an autonomous quarantine simulation to calculate post-isolation blast radius reduction.
      </OmenPanel>
    );
  }

  const { metrics } = result;
  const efficacy = metrics.containment_efficacy_pct;

  return (
    <OmenPanel className="space-y-4" glowing>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-success" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
            AUTONOMOUS SIMULATION OUTCOME
          </h3>
        </div>
        <OmenBadge variant="success" size="sm">
          {efficacy.toFixed(1)}% CONTAINMENT EFFICACY
        </OmenBadge>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">BLAST RADIUS BEFORE</span>
          <span className="font-heading text-xl font-extrabold text-crimson mt-1 block">
            {metrics.blast_radius_before} NODES
          </span>
        </div>

        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">BLAST RADIUS AFTER</span>
          <span className="font-heading text-xl font-extrabold text-success mt-1 block">
            {metrics.blast_radius_after} NODES
          </span>
        </div>

        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">SEVERED ATTACK VECTORS</span>
          <span className="font-heading text-xl font-extrabold text-amber-400 mt-1 block">
            {metrics.severed_edges_count} EDGES
          </span>
        </div>

        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">PRESERVED CROWN JEWELS</span>
          <span className="font-heading text-xl font-extrabold text-chrome mt-1 block">
            {metrics.critical_assets_saved_count} ASSETS
          </span>
        </div>
      </div>

      {/* Executive Technical Summary */}
      <div className="p-3.5 bg-surface-elevated border border-border font-sans text-xs text-secondary leading-relaxed space-y-2">
        <div className="font-mono text-[10px] text-muted uppercase tracking-wider font-semibold">
          MICROSEGMENTATION SIMULATION VERDICT
        </div>
        <p className="text-primary font-medium">
          {result.summary}
        </p>
        <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-muted">
          <Lock className="w-3 h-3 text-crimson" />
          <span>SIMULATED HOST ISOLATIONS: </span>
          <span className="text-chrome font-bold">{result.isolated_nodes.join(', ') || 'None'}</span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-3 bg-background border border-border flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span>ZERO-RISK SIMULATION SANDBOX // NO PRODUCTION NETWORK TRAFFIC WAS ALTERED</span>
        </div>
        {onReset && (
          <OmenButton variant="ghost" size="sm" onClick={onReset} icon={<RotateCcw className="w-3 h-3" />}>
            Reset
          </OmenButton>
        )}
      </div>
    </OmenPanel>
  );
};
