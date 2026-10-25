import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { IncidentRecord } from '../../types';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenButton } from '../ui/OmenButton';

interface IncidentArchiveProps {
  incidents: IncidentRecord[];
  selectedId?: string | null;
  onSelectIncident: (incident: IncidentRecord) => void;
  onExportDossier?: () => void;
}

export const IncidentArchive: React.FC<IncidentArchiveProps> = ({
  incidents,
  selectedId,
  onSelectIncident,
  onExportDossier,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.mitre_technique.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.affected_nodes.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || inc.severity.toUpperCase() === severityFilter.toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || inc.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <OmenPanel className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
            INCIDENT MEMORY ARCHIVE
          </h3>
          <span className="font-mono text-xs text-muted">({filtered.length} RECORDS)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text"
              placeholder="Search by ID, MITRE, target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border border-border pl-8 pr-3 py-1 font-mono text-xs text-primary placeholder:text-muted focus:outline-none focus:border-crimson w-48 sm:w-56"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-background border border-border px-2 py-1 font-mono text-xs text-secondary focus:outline-none focus:border-crimson"
          >
            <option value="ALL">SEV: ALL</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {onExportDossier && (
            <OmenButton variant="secondary" size="sm" onClick={onExportDossier} icon={<Download className="w-3.5 h-3.5" />}>
              Export
            </OmenButton>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-[10px] text-muted uppercase tracking-wider">
              <th className="py-2.5 px-3">INCIDENT ID</th>
              <th className="py-2.5 px-3">TITLE / EVENT</th>
              <th className="py-2.5 px-3">MITRE ATT&CK</th>
              <th className="py-2.5 px-3">AFFECTED ASSETS</th>
              <th className="py-2.5 px-3 text-center">SEVERITY</th>
              <th className="py-2.5 px-3 text-center">STATUS</th>
              <th className="py-2.5 px-2 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  No incident records found matching query criteria.
                </td>
              </tr>
            ) : (
              filtered.map((inc) => {
                const isSelected = selectedId === inc.id;
                const isCritical = inc.severity.toUpperCase() === 'CRITICAL';

                return (
                  <tr
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-crimson/15 border-l-2 border-l-crimson' 
                        : 'hover:bg-surface-elevated'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-primary">
                      {inc.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-chrome max-w-xs truncate">
                      {inc.title}
                    </td>
                    <td className="py-2.5 px-3 text-crimson font-bold">
                      {inc.mitre_technique}
                    </td>
                    <td className="py-2.5 px-3 text-muted">
                      {inc.affected_nodes.join(', ') || 'None'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <OmenBadge variant={isCritical ? 'crimson' : 'amber'} size="sm">
                        {inc.severity}
                      </OmenBadge>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <OmenBadge variant={inc.status === 'CONTAINED' ? 'success' : 'neutral'} size="sm">
                        {inc.status}
                      </OmenBadge>
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
