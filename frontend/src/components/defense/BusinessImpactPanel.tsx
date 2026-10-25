import React from 'react';
import { 
  Building2, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase,
  Users,
  ShieldCheck
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { BusinessImpactAnalysis } from '../../types';

export interface BusinessImpactPanelProps {
  impact: BusinessImpactAnalysis;
  className?: string;
}

export const BusinessImpactPanel: React.FC<BusinessImpactPanelProps> = ({
  impact,
  className = '',
}) => {
  const getFrictionBadge = (friction: string) => {
    switch (friction) {
      case 'CRITICAL':
        return <OmenBadge variant="crimson">CRITICAL OPERATIONAL FRICTION</OmenBadge>;
      case 'HIGH':
        return <OmenBadge variant="amber">HIGH OPERATIONAL FRICTION</OmenBadge>;
      case 'MODERATE':
        return <OmenBadge variant="neutral">MODERATE DISRUPTION</OmenBadge>;
      default:
        return <OmenBadge variant="success">MINIMAL / ZERO FRICTION</OmenBadge>;
    }
  };

  return (
    <OmenPanel className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            COLLATERAL BUSINESS DISRUPTION & AVAILABILITY IMPACT
          </h3>
        </div>
        <div>{getFrictionBadge(impact.operational_friction)}</div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
        <div className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-muted uppercase block">ESTIMATED DOWNTIME</span>
              <span className="font-heading text-lg font-bold text-primary">
                ~{impact.estimated_downtime_minutes} MINUTES
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted">Transitory SLA impact</span>
        </div>

        <div className="p-3 bg-surface border border-border rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-chrome" />
            <div>
              <span className="text-[10px] text-muted uppercase block">AFFECTED UNITS</span>
              <span className="font-heading text-lg font-bold text-primary">
                {impact.affected_departments.length} DEPARTMENTS
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted">Subject to containment</span>
        </div>
      </div>

      {/* Disrupted Services vs Maintained Critical Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Disrupted Services */}
        <div className="p-3.5 bg-background border border-border rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-crimson font-bold text-[10px] uppercase">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>DISRUPTED LEGITIMATE SERVICES ({impact.disrupted_legitimate_services.length})</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {impact.disrupted_legitimate_services.length === 0 ? (
              <span className="text-secondary italic text-[11px]">
                No business-critical services interrupted by this action.
              </span>
            ) : (
              impact.disrupted_legitimate_services.map((srv) => (
                <div
                  key={srv}
                  className="px-2 py-1 bg-surface-elevated border border-border rounded text-[11px] text-secondary flex items-center justify-between"
                >
                  <span>{srv}</span>
                  <span className="text-[9px] text-crimson font-bold">SUSPENDED</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maintained Critical Functions */}
        <div className="p-3.5 bg-background border border-border rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MAINTAINED ENTERPRISE FUNCTIONS ({impact.critical_business_functions_maintained.length})</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {impact.critical_business_functions_maintained.map((func) => (
              <div
                key={func}
                className="px-2 py-1 bg-surface-elevated border border-border rounded text-[11px] text-secondary flex items-center justify-between"
              >
                <span>{func}</span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OmenPanel>
  );
};
