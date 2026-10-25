import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Server, 
  Layers, 
  Download, 
  X, 
  ExternalLink,
  Lock,
  GitBranch
} from 'lucide-react';
import { IncidentRecord } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenButton } from '../ui/OmenButton';

interface IncidentDetailsProps {
  incident: IncidentRecord | null;
  onClose?: () => void;
}

export const IncidentDetails: React.FC<IncidentDetailsProps> = ({ incident, onClose }) => {
  if (!incident) {
    return (
      <OmenPanel className="p-6 text-center text-muted font-mono text-xs">
        Select an incident dossier to inspect root cause attribution, MITRE technique mapping, and containment blast radius.
      </OmenPanel>
    );
  }

  const isCritical = incident.severity.toUpperCase() === 'CRITICAL';

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(incident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOSSIER_${incident.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <OmenPanel className="space-y-5" glowing={isCritical}>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
              INCIDENT INVESTIGATION DOSSIER
            </span>
            <OmenBadge variant={isCritical ? 'crimson' : 'amber'} size="sm">
              {incident.severity}
            </OmenBadge>
            <OmenBadge variant={incident.status === 'CONTAINED' ? 'success' : 'neutral'} size="sm">
              {incident.status}
            </OmenBadge>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary">
            {incident.title}
          </h3>
          <span className="font-mono text-xs text-chrome">{incident.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportJson}
            className="p-1.5 bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-chrome"
            title="Export JSON Dossier"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-chrome"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">DETECTED TIMESTAMP</span>
          <span className="font-bold text-primary mt-1 block truncate">
            {incident.created_at}
          </span>
        </div>

        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">MITRE ATT&CK</span>
          <span className="font-bold text-crimson mt-1 block truncate">
            {incident.mitre_technique}
          </span>
        </div>

        <div className="p-3 bg-background border border-border">
          <span className="text-[9px] text-muted uppercase block">CONTAINMENT STATUS</span>
          <span className="font-bold text-chrome mt-1 block">
            {incident.status}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="p-3.5 bg-background border border-border space-y-1.5 font-sans text-xs text-secondary leading-relaxed">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider block font-semibold">
          ANALYST NARRATIVE // ROOT CAUSE
        </span>
        <p className="text-primary font-medium">
          {incident.description}
        </p>
      </div>

      {/* Affected Topology Nodes */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">
          AFFECTED TOPOLOGY ASSETS ({incident.affected_nodes.length})
        </span>
        <div className="flex flex-wrap gap-2">
          {incident.affected_nodes.map((nodeId) => (
            <div 
              key={nodeId}
              className="px-2.5 py-1.5 bg-surface border border-crimson/50 font-mono text-xs text-primary flex items-center gap-2"
            >
              <Server className="w-3 h-3 text-crimson" />
              <span className="font-bold">{nodeId}</span>
            </div>
          ))}
        </div>
      </div>
    </OmenPanel>
  );
};
