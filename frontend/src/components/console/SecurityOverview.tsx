import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Network, 
  Cpu, 
  Lock, 
  Server 
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';

interface SecurityOverviewProps {
  totalFlows: number;
  compromisedCount: number;
  nodesCount: number;
  edgesCount: number;
  modelsOnline: number;
  isolatedCount: number;
  runtimeDevice?: string;
}

export const SecurityOverview: React.FC<SecurityOverviewProps> = ({
  totalFlows,
  compromisedCount,
  nodesCount,
  edgesCount,
  modelsOnline,
  isolatedCount,
  runtimeDevice = 'LOCAL CPU',
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Analyzed Flow Events */}
      <div className="p-4 bg-surface border border-border tech-corner-tl hover:border-chrome/40 transition-colors">
        <span className="font-mono text-[9px] text-muted uppercase tracking-wider block mb-1">
          ANALYZED FLOWS
        </span>
        <span className="font-heading text-2xl font-extrabold text-primary block">
          {totalFlows.toLocaleString()}
        </span>
        <span className="font-mono text-[10px] text-secondary mt-1 block">
          UNSW-NB15 + LIVE
        </span>
      </div>

      {/* 2. Compromised Nodes */}
      <div className="p-4 bg-surface border border-border hover:border-crimson/60 transition-colors">
        <span className="font-mono text-[9px] text-muted uppercase tracking-wider block mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-crimson inline-block animate-pulse" />
          COMPROMISED HOSTS
        </span>
        <span className="font-heading text-2xl font-extrabold text-crimson-glow block">
          {compromisedCount} HOSTS
        </span>
        <span className="font-mono text-[10px] text-crimson mt-1 block font-bold">
          {compromisedCount > 0 ? 'CONTAINMENT ACTIVE' : 'ZERO COMPROMISE'}
        </span>
      </div>

      {/* 3. Topology Coverage */}
      <div className="p-4 bg-surface border border-border hover:border-chrome/40 transition-colors">
        <span className="font-mono text-[9px] text-muted uppercase tracking-wider block mb-1">
          TOPOLOGY GRAPH
        </span>
        <span className="font-heading text-2xl font-extrabold text-chrome block">
          {nodesCount} NODES
        </span>
        <span className="font-mono text-[10px] text-secondary mt-1 block">
          {edgesCount} INTERCONNECTS
        </span>
      </div>

      {/* 4. Neural Models */}
      <div className="p-4 bg-surface border border-border hover:border-success/40 transition-colors">
        <span className="font-mono text-[9px] text-muted uppercase tracking-wider block mb-1">
          NEURAL ENGINES
        </span>
        <span className="font-heading text-2xl font-extrabold text-success block">
          {modelsOnline} / 3 ONLINE
        </span>
        <span className="font-mono text-[10px] text-secondary mt-1 block">
          RF / MLP / ISO
        </span>
      </div>

      {/* 5. Quarantine Shield */}
      <div className="p-4 bg-surface border border-border hover:border-amber-400/40 transition-colors">
        <span className="font-mono text-[9px] text-muted uppercase tracking-wider block mb-1">
          QUARANTINE SHIELD
        </span>
        <span className="font-heading text-2xl font-extrabold text-amber-400 block">
          {isolatedCount} ISOLATED
        </span>
        <span className="font-mono text-[10px] text-secondary mt-1 block">
          MICROSEGMENTED
        </span>
      </div>

      {/* 6. Runtime Engine */}
      <div className="p-4 bg-surface border border-border tech-corner-br hover:border-chrome/40 transition-colors">
        <span className="font-mono text-[9px] text-muted uppercase tracking-wider block mb-1">
          INFERENCE DEVICE
        </span>
        <span className="font-heading text-2xl font-extrabold text-primary block">
          {runtimeDevice}
        </span>
        <span className="font-mono text-[10px] text-secondary mt-1 block">
          PYTORCH LOCAL
        </span>
      </div>
    </div>
  );
};
