import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  ShieldAlert, 
  Cpu, 
  Network, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Filter,
  Layers,
  AlertTriangle,
  Server,
  Activity
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenButton } from '../ui/OmenButton';

export interface TimelineReplayItem {
  id: string;
  event_type: 'OBSERVED_EVENT' | 'PREDICTED_PATH' | 'SIMULATED_DEFENSE';
  timestamp: string;
  source_asset: string;
  related_assets: string[];
  severity: string;
  threat_status: string;
  category: string;
  decision_rule: string;
  rf_probability?: number | null;
  mlp_probability?: number | null;
  anomaly_index?: number | null;
  evidence: Record<string, any>;
  mitre_technique?: string;
}

export interface AttackReplayEngineProps {
  timeline: TimelineReplayItem[];
  onSelectEventAsset?: (assetId: string) => void;
  className?: string;
}

export const AttackReplayEngine: React.FC<AttackReplayEngineProps> = ({
  timeline,
  onSelectEventAsset,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [filterType, setFilterType] = useState<string>('ALL');

  const timerRef = useRef<any>(null);

  // Filter items
  const filteredTimeline = timeline.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.event_type === filterType;
  });

  const activeItem = filteredTimeline[currentIndex] || filteredTimeline[0] || null;

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying && filteredTimeline.length > 0) {
      const intervalMs = Math.max(400, 1800 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= filteredTimeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, filteredTimeline.length]);

  // Notify parent of selected asset
  useEffect(() => {
    if (activeItem && onSelectEventAsset) {
      onSelectEventAsset(activeItem.source_asset);
    }
  }, [currentIndex, activeItem]);

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'OBSERVED_EVENT':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-crimson/20 border border-crimson text-crimson-glow flex items-center gap-1">
            <ShieldAlert className="w-2.5 h-2.5" /> OBSERVED TELEMETRY EVENT
          </span>
        );
      case 'PREDICTED_PATH':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 border border-amber-500 text-amber-300 flex items-center gap-1">
            <Network className="w-2.5 h-2.5" /> HYPOTHETICAL ATTACK TRAVERSAL
          </span>
        );
      case 'SIMULATED_DEFENSE':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> SIMULATED CONTAINMENT ACTION
          </span>
        );
      default:
        return null;
    }
  };

  if (timeline.length === 0) {
    return (
      <OmenPanel className="p-8 text-center text-muted font-mono text-xs">
        No incident timeline events currently recorded in database.
      </OmenPanel>
    );
  }

  return (
    <OmenPanel className={`space-y-5 ${className}`} glowing>
      {/* 1. Header Ribbon & Controls */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            IMMUTABLE FORENSIC ATTACK REPLAY ENGINE
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-lg font-mono text-[10px]">
          <button
            onClick={() => { setFilterType('ALL'); setCurrentIndex(0); }}
            className={`px-2 py-0.5 rounded font-bold ${filterType === 'ALL' ? 'bg-crimson text-white' : 'text-muted hover:text-white'}`}
          >
            ALL ({timeline.length})
          </button>
          <button
            onClick={() => { setFilterType('OBSERVED_EVENT'); setCurrentIndex(0); }}
            className={`px-2 py-0.5 rounded font-bold ${filterType === 'OBSERVED_EVENT' ? 'bg-crimson text-white' : 'text-muted hover:text-white'}`}
          >
            OBSERVED
          </button>
          <button
            onClick={() => { setFilterType('PREDICTED_PATH'); setCurrentIndex(0); }}
            className={`px-2 py-0.5 rounded font-bold ${filterType === 'PREDICTED_PATH' ? 'bg-amber-500 text-black' : 'text-muted hover:text-white'}`}
          >
            PREDICTIONS
          </button>
          <button
            onClick={() => { setFilterType('SIMULATED_DEFENSE'); setCurrentIndex(0); }}
            className={`px-2 py-0.5 rounded font-bold ${filterType === 'SIMULATED_DEFENSE' ? 'bg-emerald-500 text-black' : 'text-muted hover:text-white'}`}
          >
            DEFENSES
          </button>
        </div>
      </div>

      {/* 2. Interactive Scrubber Bar & Playback Controls */}
      <div className="p-4 bg-surface border border-border rounded-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OmenButton
              variant={isPlaying ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isPlaying ? 'PAUSE REPLAY' : 'PLAY REPLAY'}
            </OmenButton>

            <button
              onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
              className="p-1.5 text-muted hover:text-white bg-surface-elevated border border-border rounded"
              title="Rewind to start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Playback speed toggle */}
            <div className="flex bg-surface-elevated border border-border p-0.5 rounded text-[10px]">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded font-bold ${
                    playbackSpeed === spd ? 'bg-crimson text-white' : 'text-muted hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-muted">
            STEP <strong className="text-chrome font-bold">{currentIndex + 1}</strong> OF{' '}
            <strong className="text-secondary">{filteredTimeline.length}</strong>
          </div>
        </div>

        {/* Timeline Scrubber Range Input */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={Math.max(0, filteredTimeline.length - 1)}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(parseInt(e.target.value, 10));
            }}
            className="w-full accent-crimson cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted">
            <span>EPOCH START: {filteredTimeline[0]?.timestamp?.slice(0, 19) || 'T-0'}</span>
            <span>EPOCH END: {filteredTimeline[filteredTimeline.length - 1]?.timestamp?.slice(0, 19) || 'T-End'}</span>
          </div>
        </div>
      </div>

      {/* 3. Replay Step Inspector */}
      {activeItem && (
        <div className="p-4 bg-surface-elevated border border-border rounded-xl space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between border-b border-border pb-2.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-chrome">{activeItem.id}</span>
              <span className="text-muted">•</span>
              <span className="text-muted text-[11px]">{activeItem.timestamp}</span>
            </div>
            {getEventTypeBadge(activeItem.event_type)}
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-background border border-border rounded-lg space-y-1">
              <span className="text-[10px] text-muted uppercase block">PRIMARY ASSET FOCUS</span>
              <div className="font-heading text-sm font-bold text-primary flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-crimson" />
                <span>{activeItem.source_asset}</span>
              </div>
              <span className="text-[10px] text-secondary">
                Related: {activeItem.related_assets.join(', ')}
              </span>
            </div>

            <div className="p-3 bg-background border border-border rounded-lg space-y-1">
              <span className="text-[10px] text-muted uppercase block">MITRE TACTIC / TECHNIQUE</span>
              <span className="font-heading text-sm font-bold text-chrome block">
                {activeItem.mitre_technique || 'T1190 - Exploit Remote Service'}
              </span>
              <span className="text-[10px] text-crimson-glow font-bold uppercase">
                {activeItem.category}
              </span>
            </div>

            <div className="p-3 bg-background border border-border rounded-lg space-y-1">
              <span className="text-[10px] text-muted uppercase block">EVIDENCE & CONFIDENCE</span>
              <div className="space-y-0.5 text-[11px]">
                {activeItem.rf_probability !== undefined && activeItem.rf_probability !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted">RF Prob:</span>
                    <span className="text-crimson font-bold">{(activeItem.rf_probability * 100).toFixed(1)}%</span>
                  </div>
                )}
                {activeItem.mlp_probability !== undefined && activeItem.mlp_probability !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted">MLP Prob:</span>
                    <span className="text-crimson font-bold">{(activeItem.mlp_probability * 100).toFixed(1)}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Decision:</span>
                  <span className="text-chrome font-bold">{activeItem.decision_rule}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </OmenPanel>
  );
};
