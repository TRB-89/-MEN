import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  ExternalLink, 
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { DetectionRecordItem } from '../../types';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenPanel } from '../ui/OmenPanel';

interface ThreatEventTableProps {
  records: DetectionRecordItem[];
  selectedId?: string | null;
  onSelectEvent: (record: DetectionRecordItem) => void;
  isLoading?: boolean;
}

export const ThreatEventTable: React.FC<ThreatEventTableProps> = ({
  records,
  selectedId,
  onSelectEvent,
  isLoading = false,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MALICIOUS' | 'SUSPICIOUS' | 'BENIGN'>('ALL');

  const filtered = records.filter((rec) => {
    const matchesQuery = 
      rec.detection_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (rec.device_id && rec.device_id.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (rec.detected_attack_cat && rec.detected_attack_cat.toLowerCase().includes(filterQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || rec.threat_status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <OmenPanel className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
            NEURAL THREAT EVENT LOG
          </h3>
          <span className="font-mono text-xs text-muted">({filtered.length} RECORDS)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text"
              placeholder="Filter by ID, host, attack..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="bg-background border border-border pl-8 pr-3 py-1 font-mono text-xs text-primary placeholder:text-muted focus:outline-none focus:border-crimson w-48 sm:w-56"
            />
          </div>

          <div className="flex bg-background border border-border p-0.5 font-mono text-[10px]">
            {(['ALL', 'MALICIOUS', 'SUSPICIOUS', 'BENIGN'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-0.5 transition-colors ${
                  statusFilter === status 
                    ? 'bg-crimson/20 text-crimson font-bold' 
                    : 'text-muted hover:text-chrome'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-[10px] text-muted uppercase tracking-wider">
              <th className="py-2.5 px-3">RECORD ID</th>
              <th className="py-2.5 px-3">DEVICE / TARGET</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">CLASSIFICATION</th>
              <th className="py-2.5 px-3 text-right">RF PROB</th>
              <th className="py-2.5 px-3 text-right">MLP PROB</th>
              <th className="py-2.5 px-3 text-right">ANOMALY</th>
              <th className="py-2.5 px-3 text-center">SEVERITY</th>
              <th className="py-2.5 px-2 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
                    <span>Synchronizing threat telemetry stream...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted">
                  No threat events matching current telemetry filters.
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const isSelected = selectedId === record.detection_id;
                const isMalicious = record.threat_status === 'MALICIOUS';
                const isSuspicious = record.threat_status === 'SUSPICIOUS';

                return (
                  <tr 
                    key={record.detection_id}
                    onClick={() => onSelectEvent(record)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-crimson/15 border-l-2 border-l-crimson' 
                        : 'hover:bg-surface-elevated'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-primary flex items-center gap-2">
                      {isMalicious ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-crimson shrink-0" />
                      ) : isSuspicious ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                      )}
                      <span className="truncate max-w-[140px]">{record.detection_id}</span>
                    </td>
                    <td className="py-2.5 px-3 text-chrome">
                      {record.device_id || 'unassigned-host'}
                    </td>
                    <td className="py-2.5 px-3">
                      <OmenBadge 
                        variant={isMalicious ? 'crimson' : isSuspicious ? 'amber' : 'success'}
                        size="sm"
                      >
                        {record.threat_status}
                      </OmenBadge>
                    </td>
                    <td className="py-2.5 px-3 text-secondary font-medium">
                      {record.detected_attack_cat || 'Normal Baseline'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {record.rf_score !== null ? (
                        <span className={record.rf_score > 0.5 ? 'text-crimson font-bold' : 'text-muted'}>
                          {(record.rf_score * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {record.mlp_score !== null ? (
                        <span className={record.mlp_score > 0.5 ? 'text-crimson font-bold' : 'text-muted'}>
                          {(record.mlp_score * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {record.anomaly_score !== null ? (
                        <span className={record.anomaly_score > 0.6 ? 'text-amber-400 font-bold' : 'text-muted'}>
                          {record.anomaly_score.toFixed(3)}
                        </span>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold ${
                        record.alert_severity === 'CRITICAL' ? 'bg-crimson/20 text-crimson-glow border border-crimson' :
                        record.alert_severity === 'HIGH' ? 'bg-crimson/10 text-crimson' :
                        record.alert_severity === 'MEDIUM' ? 'bg-amber-400/10 text-amber-400' :
                        'bg-chrome/10 text-chrome'
                      }`}>
                        {record.alert_severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <ChevronRight className="w-4 h-4 text-muted mx-auto" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </OmenPanel>
  );
};
