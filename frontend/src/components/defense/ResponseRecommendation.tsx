import React from 'react';
import { ShieldAlert, ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { OmenPanel } from '../ui';

export interface ResponseRecommendationProps {
  onApplyPreset: (presetNodes: string[], entry: string) => void;
  className?: string;
}

export const ResponseRecommendation: React.FC<ResponseRecommendationProps> = ({
  onApplyPreset,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className}`}>
      <OmenPanel
        onClick={() => onApplyPreset(['srv-app-01'], 'srv-web-01')}
        className="p-4 hover:bg-surface-elevated hover:border-crimson-subtle transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-crimson-glow uppercase font-bold">
            RECOMMENDED PRESET #1
          </span>
          <ShieldAlert className="w-3.5 h-3.5 text-crimson" />
        </div>
        <h4 className="font-heading text-sm font-bold text-primary group-hover:text-white mb-1">
          SEVER APP-TIER LATERAL BRIDGE
        </h4>
        <p className="font-sans text-xs text-secondary leading-relaxed mb-3">
          Quarantine application proxy <code className="text-chrome font-mono">srv-app-01</code> to prevent DMZ adversary from reaching database cluster.
        </p>
        <div className="font-mono text-[10px] text-muted flex items-center gap-1 group-hover:text-chrome">
          <span>APPLY PRESET</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </OmenPanel>

      <OmenPanel
        onClick={() => onApplyPreset(['srv-db-01', 'db-prod-01'], 'srv-web-01')}
        className="p-4 hover:bg-surface-elevated hover:border-crimson-subtle transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-amber-400 uppercase font-bold">
            RECOMMENDED PRESET #2
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <h4 className="font-heading text-sm font-bold text-primary group-hover:text-white mb-1">
          CROWN JEWEL PERIMETER CLAMP
        </h4>
        <p className="font-sans text-xs text-secondary leading-relaxed mb-3">
          Isolate direct database listeners, enforcing strict jump-host requirements across all ingress ports.
        </p>
        <div className="font-mono text-[10px] text-muted flex items-center gap-1 group-hover:text-chrome">
          <span>APPLY PRESET</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </OmenPanel>

      <OmenPanel
        onClick={() => onApplyPreset(['ws-dev-01', 'ws-hr-02'], 'ws-dev-01')}
        className="p-4 hover:bg-surface-elevated hover:border-crimson-subtle transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-secondary uppercase font-bold">
            RECOMMENDED PRESET #3
          </span>
          <Lock className="w-3.5 h-3.5 text-secondary" />
        </div>
        <h4 className="font-heading text-sm font-bold text-primary group-hover:text-white mb-1">
          WORKSTATION SUB-SEGMENT QUARANTINE
        </h4>
        <p className="font-sans text-xs text-secondary leading-relaxed mb-3">
          Simulate complete isolation of compromised endpoint cluster to halt peer-to-peer SMB/RDP infection.
        </p>
        <div className="font-mono text-[10px] text-muted flex items-center gap-1 group-hover:text-chrome">
          <span>APPLY PRESET</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </OmenPanel>
    </div>
  );
};
