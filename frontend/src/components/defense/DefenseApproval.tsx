import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw,
  Layers
} from 'lucide-react';
import { DefenseSimulationResponse } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenButton } from '../ui/OmenButton';
import { OmenBadge } from '../ui/OmenBadge';

export interface DefenseApprovalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: DefenseSimulationResponse | null;
  onApprove: (notes: string) => Promise<void>;
  onReject: (notes: string) => Promise<void>;
  onReset: () => void;
}

export const DefenseApproval: React.FC<DefenseApprovalProps> = ({
  isOpen,
  onClose,
  simulation,
  onApprove,
  onReject,
  onReset,
}) => {
  const [analystNotes, setAnalystNotes] = useState<string>(
    'Verified containment efficacy. Acceptable operational disruption for business units.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !simulation) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(analystNotes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(analystNotes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono animate-fade-in">
      <div className="bg-[#050506] border border-white/20 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-crimson" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-chrome">
              DEFENSE SIMULATION APPROVAL DOSSIER
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Target Banner */}
        <div className="p-3.5 bg-[#101013] border border-white/10 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted uppercase">PROPOSED DEFENSIVE INTERVENTION:</span>
            <span className="px-2 py-0.5 bg-crimson/20 text-crimson font-bold text-[10px] rounded border border-crimson/40">
              {simulation.action_type.replace('_', ' ')}
            </span>
          </div>
          <div className="text-sm font-bold text-chrome">
            Target Entity: <span className="text-crimson font-mono">{simulation.target_name}</span> ({simulation.target_entity})
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            {simulation.explanation}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-[#101013] border border-white/10 rounded-lg">
            <span className="text-[10px] text-muted uppercase block">RISK MITIGATION</span>
            <span className="font-heading text-xl font-bold text-emerald-400 mt-0.5 block">
              -{simulation.metrics.risk_reduction_pct.toFixed(1)}%
            </span>
            <span className="text-[9px] text-muted">
              {simulation.metrics.risk_score_before.toFixed(0)} → {simulation.metrics.risk_score_after.toFixed(0)} / 100
            </span>
          </div>

          <div className="p-3 bg-[#101013] border border-white/10 rounded-lg">
            <span className="text-[10px] text-muted uppercase block">OPERATIONAL FRICTION</span>
            <span className="font-heading text-xl font-bold text-amber-400 mt-0.5 block">
              {simulation.business_impact.operational_friction}
            </span>
            <span className="text-[9px] text-muted">
              ~{simulation.business_impact.estimated_downtime_minutes} mins downtime
            </span>
          </div>

          <div className="p-3 bg-[#101013] border border-white/10 rounded-lg">
            <span className="text-[10px] text-muted uppercase block">PATHS INTERRUPTED</span>
            <span className="font-heading text-xl font-bold text-chrome mt-0.5 block">
              {simulation.interrupted_attack_paths.length}
            </span>
            <span className="text-[9px] text-muted">
              {simulation.remaining_attack_paths.length} alternate corridors
            </span>
          </div>
        </div>

        {/* Collateral Business Impact */}
        {simulation.business_impact.disrupted_legitimate_services.length > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>COLLATERAL BUSINESS DISRUPTION:</span>
            </div>
            <ul className="text-[11px] text-secondary pl-5 list-disc space-y-0.5">
              {simulation.business_impact.disrupted_legitimate_services.map((svc, i) => (
                <li key={i}>{svc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Analyst Notes Input */}
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">
            SECOPS ANALYST RATIONALE & AUDIT NOTES:
          </label>
          <textarea
            value={analystNotes}
            onChange={(e) => setAnalystNotes(e.target.value)}
            rows={2}
            className="w-full bg-[#101013] border border-white/10 rounded-lg p-2.5 text-xs text-chrome focus:border-crimson outline-none font-mono"
            placeholder="Document rationale for approval or operational objection..."
          />
        </div>

        {/* Safety Guarantee */}
        <div className="p-2.5 bg-black border border-white/10 rounded-lg text-[10px] text-muted flex items-center justify-between">
          <span>🛡️ Safety Guarantee: Approval authorizes containment simulation plan; zero live firewalls modified.</span>
          <span className="text-chrome font-bold">SNAPSHOT: {simulation.topology_snapshot_id}</span>
        </div>

        {/* Decision Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <OmenButton
            variant="ghost"
            size="sm"
            onClick={() => {
              onReset();
              onClose();
            }}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Scenario
          </OmenButton>

          <div className="flex items-center gap-2">
            <OmenButton
              variant="secondary"
              size="sm"
              onClick={handleReject}
              loading={isSubmitting}
            >
              Reject Plan
            </OmenButton>
            <OmenButton
              variant="primary"
              size="sm"
              onClick={handleApprove}
              loading={isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve Simulation Plan
            </OmenButton>
          </div>
        </div>
      </div>
    </div>
  );
};
