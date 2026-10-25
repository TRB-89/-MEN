import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DetectionRecordItem } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';

interface RecentEventsProps {
  events: DetectionRecordItem[];
}

export const RecentEvents: React.FC<RecentEventsProps> = ({ events }) => {
  const navigate = useNavigate();

  return (
    <OmenPanel className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted">
            LIVE DETECTED THREAT STREAM
          </h3>
        </div>
        <button
          onClick={() => navigate('/detection')}
          className="font-mono text-[11px] text-chrome hover:text-white flex items-center gap-1 group"
        >
          <span>VIEW ALL</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="p-4 text-center text-muted font-mono text-xs">
            No active threat events detected in recent telemetry.
          </div>
        ) : (
          events.slice(0, 5).map((ev) => {
            const isMalicious = ev.threat_status === 'MALICIOUS';
            const isSuspicious = ev.threat_status === 'SUSPICIOUS';

            return (
              <div
                key={ev.detection_id}
                onClick={() => navigate('/detection')}
                className="p-3 bg-background hover:bg-surface-elevated border border-border transition-colors cursor-pointer flex items-center justify-between gap-3 font-mono text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {isMalicious ? (
                    <ShieldAlert className="w-4 h-4 text-crimson shrink-0" />
                  ) : isSuspicious ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-bold text-primary block truncate">
                      {ev.detected_attack_cat || 'Normal Baseline'}
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      {ev.device_id || 'unassigned-host'} • {ev.detection_id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <OmenBadge 
                    variant={isMalicious ? 'crimson' : isSuspicious ? 'amber' : 'success'}
                    size="sm"
                  >
                    {ev.threat_status}
                  </OmenBadge>
                  <ChevronRight className="w-3.5 h-3.5 text-muted" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </OmenPanel>
  );
};
