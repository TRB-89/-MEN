import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Network, 
  Eye, 
  KeyRound, 
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenButton } from '../ui/OmenButton';
import { DefenseRecommendationItem } from '../../types';

export interface DefenseRecommendationCardsProps {
  recommendedStrategy?: DefenseRecommendationItem | null;
  alternativeStrategies?: DefenseRecommendationItem[];
  onSelectStrategy: (strategy: DefenseRecommendationItem) => void;
  selectedEntity?: string;
  className?: string;
}

export const DefenseRecommendationCards: React.FC<DefenseRecommendationCardsProps> = ({
  recommendedStrategy,
  alternativeStrategies = [],
  onSelectStrategy,
  selectedEntity,
  className = '',
}) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'WORKSTATION_ISOLATION':
        return <Lock className="w-4 h-4 text-crimson" />;
      case 'CONNECTION_RESTRICTION':
        return <Network className="w-4 h-4 text-amber-400" />;
      case 'SESSION_REVOCATION':
        return <KeyRound className="w-4 h-4 text-purple-400" />;
      case 'ENHANCED_MONITORING':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'WORKSTATION_ISOLATION':
        return 'border-crimson/50 text-crimson-glow bg-crimson/15';
      case 'CONNECTION_RESTRICTION':
        return 'border-amber-500/50 text-amber-400 bg-amber-500/15';
      case 'SESSION_REVOCATION':
        return 'border-purple-500/50 text-purple-300 bg-purple-500/15';
      case 'ENHANCED_MONITORING':
        return 'border-cyan-500/50 text-cyan-300 bg-cyan-500/15';
      default:
        return 'border-border text-primary bg-surface';
    }
  };

  const allStrategies = [
    ...(recommendedStrategy ? [recommendedStrategy] : []),
    ...alternativeStrategies,
  ];

  if (allStrategies.length === 0) {
    return (
      <OmenPanel className="p-8 text-center text-muted font-mono text-xs">
        Generating multi-objective defense recommendations from graph topology and prediction telemetry...
      </OmenPanel>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            RECOMMENDED CONTAINMENT STRATEGIES (MULTI-OBJECTIVE RANKED)
          </h3>
        </div>
        <span className="font-mono text-[10px] text-muted">
          OPTIMIZATION MODEL: RISK (70%) // DISRUPTION (30%)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allStrategies.slice(0, 3).map((strat) => {
          const isPrimary = strat.rank === 1;
          const isSelected = selectedEntity === strat.target_entity;

          return (
            <OmenPanel
              key={strat.recommendation_id}
              onClick={() => onSelectStrategy(strat)}
              className={`p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                isPrimary
                  ? 'border-crimson/60 bg-gradient-to-b from-crimson/10 to-surface shadow-[0_0_20px_rgba(177,15,41,0.25)]'
                  : 'hover:border-chrome/40 hover:bg-surface-elevated'
              } ${isSelected ? 'ring-2 ring-crimson' : ''}`}
            >
              <div className="space-y-2.5">
                {/* Header ribbon */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                    isPrimary 
                      ? 'bg-crimson text-white border-crimson'
                      : 'bg-surface text-secondary border-border'
                  }`}>
                    {isPrimary ? 'OPTIMAL (RANK 1)' : `ALT (RANK ${strat.rank})`}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase flex items-center gap-1 ${getActionBadgeColor(strat.action_type)}`}>
                    {getActionIcon(strat.action_type)}
                    {strat.action_type.replace('_', ' ')}
                  </span>
                </div>

                {/* Target Name */}
                <div>
                  <h4 className="font-heading text-sm font-bold text-primary group-hover:text-white">
                    {strat.target_name}
                  </h4>
                  <div className="font-mono text-[10px] text-muted flex items-center gap-2 mt-0.5">
                    <span>ID: {strat.target_entity}</span>
                    <span>•</span>
                    <span>ZONE: {strat.target_zone}</span>
                  </div>
                </div>

                {/* KPI comparison pills */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 bg-background border border-border rounded">
                    <span className="text-[9px] text-muted uppercase block">RISK MITIGATION</span>
                    <span className="font-bold text-emerald-400">
                      +{strat.projected_risk_reduction_pct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2 bg-background border border-border rounded">
                    <span className="text-[9px] text-muted uppercase block">DISRUPTION COST</span>
                    <span className="font-bold text-amber-400">
                      {strat.operational_disruption_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Rationale explanation */}
                <p className="font-sans text-xs text-secondary leading-relaxed line-clamp-3">
                  {strat.rationale}
                </p>
              </div>

              {/* Action trigger footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between font-mono text-[10px]">
                <div className="text-muted">
                  NET UTILITY: <strong className="text-chrome font-bold">{(strat.net_utility_score * 100).toFixed(1)}</strong>
                </div>

                <div className="flex items-center gap-1 text-crimson-glow font-bold">
                  <span>STAGE SIMULATION</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </OmenPanel>
          );
        })}
      </div>
    </div>
  );
};
