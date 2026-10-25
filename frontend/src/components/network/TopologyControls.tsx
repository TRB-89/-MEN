import React from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { OmenPanel } from '../ui';

export interface TopologyControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  zoneFilter: string;
  onZoneFilterChange: (zone: string) => void;
  criticalityFilter: string;
  onCriticalityFilterChange: (crit: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onResetFilters: () => void;
  className?: string;
}

export const TopologyControls: React.FC<TopologyControlsProps> = ({
  searchQuery,
  onSearchChange,
  zoneFilter,
  onZoneFilterChange,
  criticalityFilter,
  onCriticalityFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  className = '',
}) => {
  const zones = ['ALL', 'PERIMETER', 'DMZ', 'CORE', 'CORPORATE', 'RESTRICTED'];
  const criticalities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = ['ALL', 'SECURE', 'SUSPICIOUS', 'COMPROMISED', 'ISOLATED'];

  const hasActiveFilters =
    searchQuery !== '' || zoneFilter !== 'ALL' || criticalityFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <OmenPanel className={`p-3 bg-[#0D0D12] border border-zinc-800 space-y-2.5 font-mono text-xs ${className}`}>
      {/* Top Bar: Search Input & Reset Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-lg bg-[#14141B] border border-zinc-800 px-3 py-1.5 focus-within:border-crimson">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="FILTER BY ASSET ID, HOSTNAME, IP OR CVE..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-white placeholder:text-zinc-600 outline-none text-xs"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-bold text-zinc-400 hover:text-white bg-zinc-800/60 border border-zinc-700"
          >
            <RefreshCw className="w-3 h-3" />
            RESET FILTERS
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1.5 border-t border-zinc-800/80 text-[10px]">
        {/* Zone Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 uppercase tracking-widest font-semibold">ZONE:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => onZoneFilterChange(z)}
                className={`px-2 py-0.5 border uppercase font-medium transition-colors ${
                  zoneFilter.toUpperCase() === z
                    ? 'bg-crimson/20 border-crimson text-white font-bold'
                    : 'border-zinc-800 bg-[#121218] text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 uppercase tracking-widest font-semibold">STATUS:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => onStatusFilterChange(st)}
                className={`px-2 py-0.5 border uppercase font-medium transition-colors ${
                  statusFilter.toUpperCase() === st
                    ? st === 'COMPROMISED'
                      ? 'bg-crimson text-white border-crimson font-bold'
                      : st === 'SUSPICIOUS'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-zinc-800 border-zinc-500 text-white font-bold'
                    : 'border-zinc-800 bg-[#121218] text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Criticality Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 uppercase tracking-widest font-semibold">CRIT:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {criticalities.map((c) => (
              <button
                key={c}
                onClick={() => onCriticalityFilterChange(c)}
                className={`px-2 py-0.5 border uppercase font-medium transition-colors ${
                  criticalityFilter.toUpperCase() === c
                    ? 'bg-zinc-800 border-zinc-400 text-white font-bold'
                    : 'border-zinc-800 bg-[#121218] text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </OmenPanel>
  );
};
