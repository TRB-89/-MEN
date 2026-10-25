import React from 'react';
import { 
  ShieldAlert, 
  Crosshair, 
  AlertTriangle, 
  Activity, 
  Server, 
  Database as DatabaseIcon,
  Radio,
  Cpu
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { NetworkNode } from '../../types';

export interface ThreatContextPanelProps {
  entryNode: string;
  crownJewelTarget: string;
  nodes: NetworkNode[];
  onSelectEntryNode: (nodeId: string) => void;
  onSelectCrownJewel: (nodeId: string) => void;
  activeAlertCount?: number;
  threatStatus?: string;
  modelConfidence?: number;
  className?: string;
}

export const ThreatContextPanel: React.FC<ThreatContextPanelProps> = ({
  entryNode,
  crownJewelTarget,
  nodes,
  onSelectEntryNode,
  onSelectCrownJewel,
  activeAlertCount = 3,
  threatStatus = 'MALICIOUS (STAGE 2 - LATERAL MOVEMENT)',
  modelConfidence = 0.942,
  className = '',
}) => {
  const entryNodeObj = nodes.find((n) => n.id === entryNode);
  const targetNodeObj = nodes.find((n) => n.id === crownJewelTarget);

  return (
    <OmenPanel className={`space-y-4 ${className}`} glowing>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            MODULE 01 THREAT INTELLIGENCE CONTEXT
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson"></span>
          </span>
          <OmenBadge variant="crimson" size="sm">
            {threatStatus}
          </OmenBadge>
        </div>
      </div>

      {/* Primary Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Compromised Foothold */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-crimson" />
              BREACHED FOOTHOLD (ENTRY)
            </span>
            <span className="px-1.5 py-0.2 bg-crimson/20 text-crimson-glow text-[9px] font-bold rounded">
              SOURCE
            </span>
          </div>

          <select
            value={entryNode}
            onChange={(e) => onSelectEntryNode(e.target.value)}
            className="w-full bg-background border border-border text-primary font-mono text-xs p-1.5 rounded focus:border-crimson focus:outline-none"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id}) - {n.zone}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between text-[11px] text-muted pt-1">
            <span>Zone: <strong className="text-secondary">{entryNodeObj?.zone || 'DMZ'}</strong></span>
            <span>IP: <strong className="text-secondary">{entryNodeObj?.ip || '192.168.1.50'}</strong></span>
          </div>
        </div>

        {/* Crown Jewel Objective */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase flex items-center gap-1.5">
              <DatabaseIcon className="w-3.5 h-3.5 text-amber-400" />
              CROWN JEWEL (TARGET OBJECTIVE)
            </span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded">
              CRITICAL
            </span>
          </div>

          <select
            value={crownJewelTarget}
            onChange={(e) => onSelectCrownJewel(e.target.value)}
            className="w-full bg-background border border-border text-primary font-mono text-xs p-1.5 rounded focus:border-amber-500 focus:outline-none"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id}) - {n.criticality}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between text-[11px] text-muted pt-1">
            <span>Criticality: <strong className="text-crimson-glow">{targetNodeObj?.criticality || 'CRITICAL'}</strong></span>
            <span>Asset Type: <strong className="text-secondary">{targetNodeObj?.device_type || 'DATABASE'}</strong></span>
          </div>
        </div>

        {/* Neural Classifier Signal */}
        <div className="p-3 bg-surface border border-border rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-chrome" />
              NEURAL TELEMETRY
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">ONLINE</span>
          </div>

          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted">RF Anomaly Index:</span>
              <span className="text-crimson font-bold">{(modelConfidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">MLP Path Probability:</span>
              <span className="text-crimson font-bold">96.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Active Correlated Alerts:</span>
              <span className="text-amber-400 font-bold">{activeAlertCount} Events</span>
            </div>
          </div>
        </div>
      </div>
    </OmenPanel>
  );
};
