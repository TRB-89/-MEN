import React from 'react';
import { Clock, Play, RotateCcw, GitBranch } from 'lucide-react';
import { AttackPath } from '../../types';
import { OmenPanel } from '../ui';

export interface AttackTimelineProps {
  selectedPath: AttackPath | null;
  activeHopStep: number;
  setActiveHopStep: (step: number) => void;
  isPlayingTimeline: boolean;
  setIsPlayingTimeline: (playing: boolean) => void;
  chokepoints: Array<{ node_id: string; name: string; frequency: number; criticality: string }>;
  className?: string;
}

export const AttackTimeline: React.FC<AttackTimelineProps> = ({
  selectedPath,
  activeHopStep,
  setActiveHopStep,
  isPlayingTimeline,
  setIsPlayingTimeline,
  chokepoints,
  className = '',
}) => {
  return (
    <OmenPanel className={`p-5 space-y-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
          <Clock className="w-4 h-4 text-crimson" />
          SEQUENTIAL LATERAL MOVEMENT TIMELINE
        </h3>

        {/* Playback Controls */}
        {selectedPath && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="px-2.5 py-1 bg-surface-elevated hover:bg-surface border border-border font-mono text-[11px] text-chrome flex items-center gap-1.5 transition-colors"
            >
              <Play className={`w-3 h-3 ${isPlayingTimeline ? 'text-crimson' : ''}`} />
              {isPlayingTimeline ? 'PAUSE' : 'PLAY SEQUENCE'}
            </button>
            <button
              onClick={() => {
                setIsPlayingTimeline(false);
                setActiveHopStep(0);
              }}
              className="p-1 text-muted hover:text-chrome transition-colors"
              title="Reset to start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {selectedPath ? (
        <div className="space-y-6 font-mono text-xs animate-fade-in">
          {/* Hop Timeline Visualizer */}
          <div className="space-y-3">
            {selectedPath.hop_details.map((hop, hIdx) => {
              const isActive = hIdx === activeHopStep;
              const isPassed = hIdx < activeHopStep;

              return (
                <div
                  key={hIdx}
                  onClick={() => {
                    setIsPlayingTimeline(false);
                    setActiveHopStep(hIdx);
                  }}
                  className={`p-4 border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'border-crimson bg-crimson/10 shadow-crimson-sm border-l-4'
                      : isPassed
                      ? 'border-border/60 bg-surface-elevated/40 text-muted'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? 'bg-crimson text-white'
                            : isPassed
                            ? 'bg-zinc-800 text-muted'
                            : 'bg-zinc-900 text-secondary'
                        }`}
                      >
                        {hIdx + 1}
                      </span>
                      <span className="font-bold text-primary">
                        HOP #{hIdx + 1}: {hop.from_node} → {hop.to_node}
                      </span>
                    </div>

                    <span className="text-[10px] text-muted">EST: +{hop.estimated_time_mins}m</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-[10px]">
                    <div>
                      <span className="text-muted block">PROTOCOL</span>
                      <span className="text-chrome font-bold">
                        {hop.protocol}:{hop.port}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block">MITRE TECHNIQUE</span>
                      <span className="text-crimson-glow font-bold">{hop.mitre_technique}</span>
                    </div>
                    <div>
                      <span className="text-muted block">HOP RISK FACTOR</span>
                      <span className="text-chrome font-bold">{hop.hop_risk.toFixed(1)} / 10.0</span>
                    </div>
                    <div>
                      <span className="text-muted block">TARGET STATE</span>
                      <span className="text-amber-400 font-bold">AT RISK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical Chokepoints */}
          {chokepoints.length > 0 && (
            <div className="p-4 bg-background border border-border space-y-3 tech-corner-tl tech-corner-br">
              <span className="text-[10px] text-muted uppercase tracking-widest block">
                CRITICAL DEFENSIVE CHOKEPOINTS (BOTTLENECK INTERCEPTORS)
              </span>
              <p className="font-sans text-xs text-secondary leading-relaxed">
                These servers occur across multiple predicted paths. Isolating or patching these nodes offers the highest leverage in breaking traversal reachability.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {chokepoints.map((cp) => (
                  <div
                    key={cp.node_id}
                    className="p-3 bg-surface border border-border flex items-center justify-between"
                  >
                    <div>
                      <span className="text-primary font-bold block">{cp.name}</span>
                      <span className="text-muted text-[10px]">
                        {cp.node_id} • {cp.criticality}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-crimson/20 border border-crimson text-crimson-glow text-[10px] font-bold">
                      {cp.frequency} PATHS
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-center text-muted p-4 border border-dashed border-border font-sans text-xs">
          <GitBranch className="w-8 h-8 mb-2 text-muted" />
          <p>Select a candidate corridor on the left to step through the traversal timeline.</p>
        </div>
      )}
    </OmenPanel>
  );
};
