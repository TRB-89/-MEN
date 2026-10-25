import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { OmenPanel, OmenButton } from '../ui';

export interface DefenseApprovalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedNodes: string[];
  entryNode: string;
}

export const DefenseApproval: React.FC<DefenseApprovalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedNodes,
  entryNode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <OmenPanel
        chamfer="card"
        borderVariant="crimson"
        className="p-6 max-w-lg w-full space-y-5 shadow-crimson-md animate-fade-in"
      >
        <div className="flex items-center gap-3 text-crimson">
          <ShieldAlert className="w-6 h-6" />
          <h3 className="font-heading text-lg font-bold uppercase text-primary">
            CONFIRM DEFENSE SIMULATION RUN
          </h3>
        </div>

        <p className="font-sans text-xs text-secondary leading-relaxed">
          You are about to simulate autonomous quarantine for{' '}
          <strong className="text-primary">{selectedNodes.length} devices</strong> from entry node{' '}
          <strong className="text-primary">{entryNode}</strong>.
        </p>

        <div className="p-3 bg-background border border-border font-mono text-xs space-y-1">
          <div className="text-muted">STAGED QUARANTINE DEVICES:</div>
          <div className="text-chrome font-bold">{selectedNodes.join(', ')}</div>
        </div>

        <div className="p-3 bg-crimson/10 border border-crimson/30 text-[11px] font-mono text-crimson-glow">
          * Safety Guarantee: Actions modify simulated graph reachability only; no live connection severed.
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border font-mono text-xs">
          <OmenButton variant="ghost" size="sm" onClick={onClose}>
            CANCEL
          </OmenButton>
          <OmenButton variant="primary" size="sm" onClick={onConfirm}>
            CONFIRM SIMULATION
          </OmenButton>
        </div>
      </OmenPanel>
    </div>
  );
};
