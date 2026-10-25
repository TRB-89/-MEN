import React from 'react';
import { 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  GitBranch,
  Layers
} from 'lucide-react';
import { IncidentRecord } from '../../types';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenPanel } from '../ui/OmenPanel';

interface IncidentTimelineProps {
  incidents: IncidentRecord[];
  selectedId?: string | null;
  onSelectIncident: (incident: IncidentRecord) => void;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  incidents,
  selectedId,
  onSelectIncident,
}) => {
  if (incidents.length === 0) {
    return (
      <OmenPanel className="p-6 text-center text-muted font-mono text-xs">
        No incident timeline events recorded in the current security epoch.
      </OmenPanel>
    );
  }

  return (
    <OmenPanel className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
            INCIDENT SEQUENCE TIMELINE
          </h3>
        </div>
        <span className="font-mono text-xs text-muted">
          {incidents.length} CHRONOLOGICAL EVENTS
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
        {incidents.map((incident, idx) => {
          const isSelected = selectedId === incident.id;
          const isCritical = incident.severity.toUpperCase() === 'CRITICAL';
          const isResolved = incident.status.toUpperCase() === 'CONTAINED' || incident.status.toUpperCase() === 'RESOLVED';

          return (
            <div 
              key={incident.id}
              onClick={() => onSelectIncident(incident)}
              className={`relative group cursor-pointer transition-all ${
                isSelected ? 'scale-[1.01]' : ''
              }`}
            >
              {/* Timeline dot */}
              <div 
                className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border transition-all ${
                  isCritical 
                    ? 'bg-crimson border-crimson-glow shadow-[0_0_8px_rgba(227,76,103,0.6)]' 
                    : isResolved
                    ? 'bg-success border-success'
                    : 'bg-chrome border-chrome'
                }`}
              />

              <div className={`p-3.5 border transition-all ${
                isSelected 
                  ? 'bg-surface-elevated border-crimson' 
                  : 'bg-surface border-border group-hover:border-chrome/60'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted">
                      {incident.created_at || 'Epoch timestamp'}
                    </span>
                    <span className="text-muted">•</span>
                    <span className="font-mono text-[10px] text-chrome font-bold">
                      {incident.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <OmenBadge 
                      variant={isCritical ? 'crimson' : 'amber'} 
                      size="sm"
                    >
                      {incident.severity}
                    </OmenBadge>
                    <OmenBadge 
                      variant={isResolved ? 'success' : 'neutral'} 
                      size="sm"
                    >
                      {incident.status}
                    </OmenBadge>
                  </div>
                </div>

                <h4 className="font-heading text-sm font-bold text-primary group-hover:text-chrome transition-colors">
                  {incident.title}
                </h4>

                <p className="font-sans text-xs text-secondary mt-1 line-clamp-2">
                  {incident.description}
                </p>

                <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between font-mono text-[10px]">
                  <div className="flex items-center gap-2 text-muted">
                    <span className="text-crimson font-bold">{incident.mitre_technique || 'T1059'}</span>
                    <span>•</span>
                    <span>AFFECTED: {Array.isArray(incident.affected_nodes) ? incident.affected_nodes.join(', ') : (incident.affected_nodes || 'N/A')}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-chrome group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </OmenPanel>
  );
};
