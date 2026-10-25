import React from 'react';
import { 
  FileText, 
  HelpCircle, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Calculator,
  ArrowRight,
  Info
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { DefenseSimulationResponse } from '../../types';

export interface DecisionExplanationPanelProps {
  simulation: DefenseSimulationResponse;
  className?: string;
}

export const DecisionExplanationPanel: React.FC<DecisionExplanationPanelProps> = ({
  simulation,
  className = '',
}) => {
  return (
    <OmenPanel className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            EXPLAINABLE DECISION SYSTEM & MATHEMATICAL RATIONALE
          </h3>
        </div>
        <span className="font-mono text-[10px] text-muted">
          FORMULA: U = (w_r · ΔRisk) - (w_d · Cost)
        </span>
      </div>

      {/* Rationale Narrative */}
      <div className="p-4 bg-surface-elevated border border-border rounded-xl space-y-2">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider block font-bold">
          PRIMARY HEURISTIC & GRAPH REACHABILITY EXPLANATION
        </span>
        <p className="font-sans text-xs text-primary leading-relaxed font-medium">
          {simulation.explanation}
        </p>
      </div>

      {/* Interrupted vs Remaining Corridors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Interrupted Paths */}
        <div className="p-3 bg-background border border-border rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase">
            <span>INTERRUPTED ATTACK PATHWAYS ({simulation.interrupted_attack_paths.length})</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>

          <div className="space-y-1.5 pt-1">
            {simulation.interrupted_attack_paths.length === 0 ? (
              <span className="text-secondary italic text-[11px]">
                No attack pathways severed by this action.
              </span>
            ) : (
              simulation.interrupted_attack_paths.map((p, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 bg-surface-elevated border border-emerald-500/20 rounded text-[11px] text-emerald-300"
                >
                  ✓ Neutralized: {p}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Remaining Attack Paths */}
        <div className="p-3 bg-background border border-border rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold uppercase">
            <span>REMAINING ALTERNATIVE CORRIDORS ({simulation.remaining_attack_paths.length})</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="space-y-1.5 pt-1">
            {simulation.remaining_attack_paths.length === 0 ? (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-[11px] text-emerald-400 font-bold text-center">
                ALL KNOWN ATTACK CORRIDORS TO CROWN JEWEL TERMINATED
              </div>
            ) : (
              simulation.remaining_attack_paths.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-surface-elevated border border-amber-500/30 rounded text-[10px] space-y-1"
                >
                  <div className="flex justify-between font-bold text-primary">
                    <span>Route #{idx + 1}: {p.hops} Hops</span>
                    <span className="text-crimson">Risk: {p.risk_score.toFixed(1)}</span>
                  </div>
                  <div className="text-muted truncate">{p.nodes.join(' ➔ ')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Safety Notice & Assumptions */}
      <div className="p-3 bg-background border border-border rounded-xl space-y-2 font-mono text-[10px]">
        <div className="flex items-center gap-2 text-muted">
          <Info className="w-3.5 h-3.5 text-chrome" />
          <strong className="text-chrome">GOVERNANCE & SAFETY NOTICE:</strong>
          <span>{simulation.disclaimer}</span>
        </div>

        {simulation.assumptions && simulation.assumptions.length > 0 && (
          <div className="pt-1 text-muted">
            <span className="text-secondary font-bold">MODEL ASSUMPTIONS: </span>
            {simulation.assumptions.join(' • ')}
          </div>
        )}
      </div>
    </OmenPanel>
  );
};
