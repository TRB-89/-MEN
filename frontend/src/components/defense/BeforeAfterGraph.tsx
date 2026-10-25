import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DefenseSimulationResult } from '../../types';
import { OmenPanel } from '../ui';

export interface BeforeAfterGraphProps {
  result: DefenseSimulationResult;
  className?: string;
}

export const BeforeAfterGraph: React.FC<BeforeAfterGraphProps> = ({
  result,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Containment Efficacy */}
      <OmenPanel cornerTicks className="p-5">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1">
          CONTAINMENT EFFICACY
        </span>
        <span className="font-heading text-3xl font-extrabold text-success block">
          {result.metrics.containment_efficacy_pct.toFixed(1)}%
        </span>
        <span className="font-sans text-[11px] text-secondary mt-1 block">
          Attack surface reduction
        </span>
      </OmenPanel>

      {/* Blast Radius Before vs After */}
      <OmenPanel className="p-5">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1">
          BLAST RADIUS REDUCTION
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-heading text-2xl font-bold text-crimson line-through">
            {result.metrics.blast_radius_before}
          </span>
          <ArrowRight className="w-4 h-4 text-muted" />
          <span className="font-heading text-3xl font-extrabold text-primary">
            {result.metrics.blast_radius_after} NODES
          </span>
        </div>
        <span className="font-sans text-[11px] text-secondary mt-1 block">
          Reachable compromise nodes
        </span>
      </OmenPanel>

      {/* Severed Attack Edges */}
      <OmenPanel className="p-5">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1">
          SEVERED ATTACK EDGES
        </span>
        <span className="font-heading text-3xl font-extrabold text-chrome block">
          {result.metrics.severed_edges_count} PATHWAYS
        </span>
        <span className="font-sans text-[11px] text-secondary mt-1 block">
          Traversals neutralized
        </span>
      </OmenPanel>

      {/* Critical Assets Saved */}
      <OmenPanel cornerTicks className="p-5">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1">
          CRITICAL ASSETS SAVED
        </span>
        <span className="font-heading text-3xl font-extrabold text-crimson-glow block">
          {result.metrics.critical_assets_saved_count} CROWNS
        </span>
        <span className="font-sans text-[11px] text-secondary mt-1 block">
          Shielded databases & servers
        </span>
      </OmenPanel>
    </div>
  );
};
