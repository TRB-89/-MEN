import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Pause, RotateCcw, GitBranch } from 'lucide-react';

export interface ModulePathPredictionPanelProps {
  className?: string;
}

export const ModulePathPredictionPanel: React.FC<ModulePathPredictionPanelProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [sourceAsset, setSourceAsset] = useState('ws-001');
  const [targetAsset, setTargetAsset] = useState('db-core');
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePathIndex, setActivePathIndex] = useState(0);

  const rankedPaths = [
    { id: 1, name: 'Path #1', risk: 0.87, hops: 4, severity: 'High' },
    { id: 2, name: 'Path #2', risk: 0.62, hops: 5, severity: 'Med' },
    { id: 3, name: 'Path #3', risk: 0.41, hops: 6, severity: 'Low' },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header (05 MODULE 3 — ATTACK PATH PREDICTION) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-technical text-xs font-bold text-[#F02D46] px-2 py-0.5 rounded bg-[#F02D46]/10 border border-[#F02D46]/30">
            05
          </span>
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              MODULE 3 — ATTACK PATH PREDICTION
            </h3>
            <p className="font-technical text-[10px] text-[#919198]">
              Animated path discovery and risk analysis
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/prediction')}
          className="font-technical text-xs text-[#F02D46] hover:text-white flex items-center gap-1 group transition-colors"
        >
          <span>PATH ENGINE</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl bg-[#101013]/90 backdrop-blur-xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.7)] p-4 space-y-4 font-technical">
        {/* Top Controls: Source & Target Selectors + Predict Button */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[10px] uppercase text-[#919198]">Source Asset</label>
            <select
              value={sourceAsset}
              onChange={(e) => setSourceAsset(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A0A0D] border border-white/10 text-xs text-[#F5F5F5] focus:outline-none"
            >
              <option value="ws-001">WS-001 (Workstation)</option>
              <option value="srv-web-01">srv-web-01 (DMZ Proxy)</option>
            </select>
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-[10px] uppercase text-[#919198]">Target Asset</label>
            <select
              value={targetAsset}
              onChange={(e) => setTargetAsset(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#0A0A0D] border border-white/10 text-xs text-[#F5F5F5] focus:outline-none"
            >
              <option value="db-core">DB-CORE (Database)</option>
              <option value="dc-01">DC-01 (Domain Controller)</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <button
              onClick={() => navigate('/prediction')}
              className="w-full py-1.5 px-3 rounded-xl bg-[#F02D46] hover:bg-[#FF4D61] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(240,45,70,0.4)] flex items-center justify-center gap-1.5"
            >
              <span>PREDICT PATHS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Row: Ranked Paths on Left + Interactive Path Traversal on Right */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Ranked Paths (Cols 1-4) */}
          <div className="sm:col-span-4 space-y-2">
            <span className="text-[10px] uppercase text-[#919198] tracking-wider block">
              Ranked Paths
            </span>
            <div className="space-y-1.5">
              {rankedPaths.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setActivePathIndex(idx)}
                  className={`p-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between border transition-all ${
                    activePathIndex === idx
                      ? 'bg-[#18181D] border-[#F02D46] text-white shadow-[0_0_12px_rgba(240,45,70,0.15)]'
                      : 'bg-[#0A0A0D]/70 border-white/5 text-[#919198] hover:text-[#F5F5F5]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#F02D46]/20 text-[#F02D46] text-[10px] font-bold flex items-center justify-center">
                      {p.id}
                    </span>
                    <span className="font-semibold">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[#F02D46] font-bold">Risk {p.risk}</span>
                    <span className="text-[#919198]">{p.hops} hops</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Path Visualization Canvas (Cols 5-12) */}
          <div className="sm:col-span-8 relative h-48 rounded-xl bg-[#050507] border border-white/10 p-3 overflow-hidden flex flex-col justify-between">
            {/* Header controls: Play, Pause, Reset, 1x */}
            <div className="flex items-center justify-end gap-1.5 z-10">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 rounded bg-[#101013] border border-white/10 text-[#919198] hover:text-white"
              >
                {isPlaying ? <Pause className="w-3 h-3 text-[#F02D46]" /> : <Play className="w-3 h-3 text-[#22C55E]" />}
              </button>
              <button
                onClick={() => setIsPlaying(true)}
                className="p-1 rounded bg-[#101013] border border-white/10 text-[#919198] hover:text-white"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <span className="px-1.5 py-0.5 rounded bg-[#101013] border border-white/10 text-[9px] font-mono text-[#919198]">
                1x
              </span>
            </div>

            {/* Glowing Traversal Path Graph matching screenshot */}
            <div className="relative w-full h-full flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 280 100" fill="none">
                {/* Attack Corridor Line with red glow */}
                <path
                  d="M30 50 L 95 30 L 160 65 L 230 45"
                  stroke="#F02D46"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_10px_#F02D46]"
                />
                {/* Connecting background edges */}
                <path d="M95 30 L 140 20 L 230 45" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
                <path d="M30 50 L 80 80 L 160 65" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                {/* Nodes */}
                {/* WS-001 (Source) */}
                <circle cx="30" cy="50" r="9" fill="#F02D46" className="drop-shadow-[0_0_12px_#F02D46]" />
                <circle cx="30" cy="50" r="4" fill="#FFF" />
                <text x="30" y="70" fill="#F02D46" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  WS-001
                </text>

                {/* APP-01 */}
                <circle cx="95" cy="30" r="7" fill="#E2E2E6" stroke="#F02D46" strokeWidth="1.5" />
                <circle cx="95" cy="30" r="3" fill="#F02D46" />

                {/* FILE-01 */}
                <circle cx="160" cy="65" r="7" fill="#E2E2E6" stroke="#F02D46" strokeWidth="1.5" />
                <circle cx="160" cy="65" r="3" fill="#F02D46" />

                {/* DB-CORE (Target) */}
                <circle cx="230" cy="45" r="14" fill="#F02D46" className="drop-shadow-[0_0_16px_#F02D46]" />
                <circle cx="230" cy="45" r="6" fill="#FFF" />
                <text x="230" y="72" fill="#F5F5F5" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  DB-CORE
                </text>

                {/* Passive network nodes */}
                <circle cx="140" cy="20" r="5" fill="#52525B" />
                <circle cx="80" cy="80" r="5" fill="#52525B" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Telemetry Metrics Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0A0A0D]/70 border border-white/5">
            <span className="text-[#919198]">Path Risk Score</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[#F02D46] font-bold">0.87</span>
              <span className="px-1.5 py-0.2 rounded bg-[#F02D46]/20 text-[#F02D46] text-[9px] font-bold">
                High
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0A0A0D]/70 border border-white/5">
            <span className="text-[#919198]">Attack Steps</span>
            <span className="text-[#F5F5F5] font-mono font-bold">4</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#0A0A0D]/70 border border-white/5">
            <span className="text-[#919198]">Key Techniques</span>
            <span className="text-[#E2E2E6] text-[10px] truncate max-w-[140px]">
              Lateral Movement, Credential Access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
