import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Layers, 
  GitBranch, 
  Server, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AttackPath } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';

interface RiskExplanationProps {
  path: AttackPath | null;
  activeHopIndex?: number;
}

export const RiskExplanation: React.FC<RiskExplanationProps> = ({ path, activeHopIndex = 0 }) => {
  if (!path) {
    return (
      <OmenPanel className="p-5 text-center text-muted font-mono text-xs">
        Select or discover an attack vector to calculate cumulative risk and MITRE ATT&CK kill-chain breakdown.
      </OmenPanel>
    );
  }

  const currentHop = path.hop_details && path.hop_details[activeHopIndex];

  return (
    <OmenPanel className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
            KILL-CHAIN RISK SYNTHESIS
          </h3>
        </div>
        <OmenBadge 
          variant={path.risk_score > 70 ? 'crimson' : path.risk_score > 40 ? 'amber' : 'neutral'}
          size="sm"
        >
          RISK SCORE: {path.risk_score.toFixed(1)} / 100
        </OmenBadge>
      </div>

      {/* Aggregate Path Metrics */}
      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">ESTIMATED TIME TO BREACH</span>
          <span className="font-heading text-base font-extrabold text-primary mt-1 block">
            {path.estimated_time_mins} MINS
          </span>
        </div>
        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">LATERAL TRAVERSAL HOPS</span>
          <span className="font-heading text-base font-extrabold text-chrome mt-1 block">
            {path.hops} HOPS
          </span>
        </div>
        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">TARGET CROWN JEWEL</span>
          <span className="font-heading text-base font-extrabold text-crimson mt-1 block truncate">
            {path.target_name || path.target_node}
          </span>
        </div>
      </div>

      {/* Active Hop Focus */}
      {currentHop && (
        <div className="p-3 bg-surface-elevated border border-border space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted uppercase">HOP FOCUS [STEP {activeHopIndex + 1}/{path.hop_details.length}]</span>
            <span className="text-crimson font-bold">
              {currentHop.from_node} → {currentHop.to_node}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-muted block text-[10px]">MITRE TECHNIQUE:</span>
              <span className="text-primary font-bold">{currentHop.mitre_technique}</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">PROTOCOL / PORT:</span>
              <span className="text-chrome font-bold">{currentHop.protocol.toUpperCase()} / {currentHop.port}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/80 flex items-center justify-between text-[10px]">
            <span className="text-muted">HOP PENETRATION RISK:</span>
            <span className="text-amber-400 font-bold">{currentHop.hop_risk.toFixed(1)} pts</span>
          </div>
        </div>
      )}

      {/* Analytical Narrative */}
      <div className="p-3 bg-background border border-border font-sans text-xs text-secondary leading-relaxed space-y-1.5">
        <div className="font-mono text-[10px] text-muted uppercase tracking-wider font-semibold">
          ALGORITHMIC ASSESSMENT // BELLMAN-FORD SHORTEST-RISK
        </div>
        <p>
          Adversary exploits low-entropy pivot point <strong className="text-chrome font-mono">{path.nodes[0]}</strong> to initiate lateral movement towards critical asset <strong className="text-crimson font-mono">{path.target_node}</strong>. Intervening firewall rules and SSH keys allow autonomous credential scraping within ~{path.estimated_time_mins} minutes.
        </p>
      </div>
    </OmenPanel>
  );
};
