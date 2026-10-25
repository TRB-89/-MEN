import React from 'react';
import { 
  History, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenButton } from '../ui/OmenButton';
import { DefenseHistoryItem } from '../../types';

export interface SimulationHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: DefenseHistoryItem[];
  onSelectHistoricalSimulation: (simulationId: string) => void;
  isLoading?: boolean;
}

export const SimulationHistoryDrawer: React.FC<SimulationHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoricalSimulation,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold rounded flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 bg-crimson/20 text-crimson-glow border border-crimson/40 text-[9px] font-bold rounded flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" /> REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-surface text-secondary border border-border text-[9px] font-bold rounded flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> PENDING REVIEW
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-fade-in font-mono">
      <div className="w-full max-w-xl bg-[#050506] border-l border-white/10 h-full p-6 flex flex-col justify-between space-y-4 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-crimson" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-chrome">
                CONTAINMENT SIMULATION AUDIT DOSSIER
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="font-sans text-xs text-secondary mt-2">
            Historical containment simulations executed and stored in persistent database. Review past blast radius reduction runs and analyst approvals.
          </p>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {isLoading ? (
            <div className="text-center py-12 text-muted text-xs">
              Loading simulation audit logs...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted text-xs border border-dashed border-border rounded-xl">
              No previous simulation records found in database.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.simulation_id}
                onClick={() => {
                  onSelectHistoricalSimulation(item.simulation_id);
                  onClose();
                }}
                className="p-3.5 bg-[#101013] border border-white/10 rounded-xl hover:border-crimson/50 hover:bg-[#18181D] transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-chrome">{item.simulation_id}</span>
                    <span className="text-[10px] text-muted">{item.timestamp}</span>
                  </div>
                  {getStatusBadge(item.approval_status)}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted uppercase text-[10px]">ACTION: </span>
                    <span className="text-crimson font-bold">{item.action_type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-muted text-[10px]">
                    TARGET: <strong className="text-secondary">{item.target_entity}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1 text-muted">
                    <span>Risk:</span>
                    <span className="text-crimson font-bold">{(item.risk_before ?? item.risk_score_before ?? 0).toFixed(1)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-emerald-400 font-bold">{(item.risk_after ?? item.risk_score_after ?? 0).toFixed(1)}</span>
                  </div>

                  <div className="text-right text-muted">
                    Net Utility: <strong className="text-chrome font-bold">+{((item.net_utility ?? 0.75) * 100).toFixed(1)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10">
          <OmenButton variant="ghost" size="sm" className="w-full" onClick={onClose}>
            Close Dossier
          </OmenButton>
        </div>
      </div>
    </div>
  );
};
