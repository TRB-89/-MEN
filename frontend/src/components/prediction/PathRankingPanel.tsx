import React from 'react';
import { GitBranch, ArrowRight, Info } from 'lucide-react';
import { AttackPath } from '../../types';
import { OmenPanel } from '../ui';

export interface PathRankingPanelProps {
  paths: AttackPath[];
  selectedPath: AttackPath | null;
  onSelectPath: (path: AttackPath) => void;
  maxHops: number;
  className?: string;
}

export const PathRankingPanel: React.FC<PathRankingPanelProps> = ({
  paths,
  selectedPath,
  onSelectPath,
  maxHops,
  className = '',
}) => {
  return (
    <OmenPanel className={`p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-crimson" />
          RANKED CANDIDATE CORRIDORS ({paths.length})
        </h3>
        <span className="font-mono text-[9px] text-muted">SORTED BY RISK INDEX</span>
      </div>

      <div className="space-y-3 max-h-[560px] overflow-y-auto">
        {paths.length > 0 ? (
          paths.map((p, idx) => (
            <div
              key={p.path_id}
              onClick={() => onSelectPath(p)}
              className={`chamfer-tr p-4 border transition-all duration-200 cursor-pointer font-mono text-xs ${
                selectedPath?.path_id === p.path_id
                  ? 'border-crimson bg-surface-elevated shadow-crimson-sm border-l-4'
                  : 'border-border bg-background hover:border-chrome/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-primary font-bold">
                  PATH #{idx + 1} // {p.path_id}
                </span>
                <span className="px-2 py-0.5 bg-crimson/15 text-crimson-glow border border-crimson/30 text-[10px] font-bold">
                  RISK {p.risk_score.toFixed(1)} / 100
                </span>
              </div>

              {/* Node chain preview */}
              <div className="flex items-center gap-1.5 flex-wrap text-secondary text-[11px] mb-3">
                {p.nodes.map((nodeId, nIdx) => (
                  <React.Fragment key={nIdx}>
                    <span
                      className={`px-1.5 py-0.5 border ${
                        nIdx === 0
                          ? 'bg-zinc-800 text-chrome border-zinc-700'
                          : nIdx === p.nodes.length - 1
                          ? 'bg-crimson/20 text-crimson-glow border-crimson/40 font-bold'
                          : 'bg-surface text-muted border-border'
                      }`}
                    >
                      {nodeId}
                    </span>
                    {nIdx < p.nodes.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted pt-2 border-t border-border/60">
                <span>{p.hops} HOPS</span>
                <span>EST. TRAVERSAL: ~{p.estimated_time_mins} MINS</span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center text-muted p-4 border border-dashed border-border font-sans text-xs">
            <Info className="w-6 h-6 mb-2 text-muted" />
            <p>No valid traversal paths discovered within {maxHops} hops between selected entities.</p>
          </div>
        )}
      </div>
    </OmenPanel>
  );
};
