import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';

export interface ModuleAttackReplayPanelProps {
  className?: string;
}

export const ModuleAttackReplayPanel: React.FC<ModuleAttackReplayPanelProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(2); // 14:34:11 selected

  const events = [
    { time: '14:32:18', desc: 'Initial Anomaly Detected', target: 'WS-001' },
    { time: '14:33:02', desc: 'Credential Harvest Access to Target', target: 'WS-001 → APP-01' },
    { time: '14:34:11', desc: 'Lateral Movement', target: 'APP-01 → FILE-01' },
    { time: '14:35:27', desc: 'Privilege Escalation', target: 'FILE-01' },
    { time: '14:36:12', desc: 'Database Access Attempt', target: 'FILE-01 → DB-CORE' },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header (07 ATTACK REPLAY TIMELINE) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-technical text-xs font-bold text-[#F02D46] px-2 py-0.5 rounded bg-[#F02D46]/10 border border-[#F02D46]/30">
            07
          </span>
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              ATTACK REPLAY TIMELINE
            </h3>
            <p className="font-technical text-[10px] text-[#919198]">
              Replay incidents and simulated attacks
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/incidents')}
          className="font-technical text-xs text-[#F02D46] hover:text-white flex items-center gap-1 group transition-colors"
        >
          <span>DOSSIERS</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Container with Watermark */}
      <div className="relative rounded-2xl bg-[#101013]/90 backdrop-blur-xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.7)] p-4 space-y-4 font-technical overflow-hidden">
        {/* Jellyfish Watermark in Background matching screenshot */}
        <div className="absolute -right-6 -bottom-6 w-48 h-48 pointer-events-none opacity-20">
          <svg className="w-full h-full text-[#F02D46]" viewBox="0 0 100 100" fill="none">
            <path
              d="M25 45 C25 20, 75 20, 75 45 C75 55, 65 58, 50 58 C35 58, 25 55, 25 45 Z"
              fill="rgba(240, 45, 70, 0.5)"
              stroke="#F02D46"
              strokeWidth="2"
            />
            <circle cx="50" cy="38" r="6" fill="#FFF" />
            <path d="M35 58 Q32 75 36 92" stroke="#F02D46" strokeWidth="2" />
            <path d="M45 60 Q42 80 48 95" stroke="#F02D46" strokeWidth="2.5" />
            <path d="M55 60 Q58 80 52 95" stroke="#F02D46" strokeWidth="2.5" />
            <path d="M65 58 Q68 75 64 92" stroke="#F02D46" strokeWidth="2" />
          </svg>
        </div>

        {/* Incident Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xs font-bold text-[#F5F5F5]">INC-2024-001</span>
            <span className="px-1.5 py-0.2 rounded bg-[#F02D46]/20 text-[#F02D46] text-[9px] font-bold">
              High Severity
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#919198]">2024-11-15 14:32:18</span>
        </div>

        <p className="text-[11px] text-[#919198]">
          Suspicious lateral movement detected
        </p>

        {/* Chronological Step List */}
        <div className="space-y-2 text-xs">
          {events.map((evt, idx) => {
            const isPassed = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={evt.time}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-[#F02D46]/10 text-white border-l-2 border-[#F02D46] pl-2 font-semibold'
                    : isPassed
                    ? 'text-[#F5F5F5] hover:bg-white/5'
                    : 'text-[#919198]/60 hover:text-[#919198]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                  isCurrent ? 'bg-[#F02D46] animate-ping' : isPassed ? 'bg-[#F02D46]' : 'bg-[#52525B]'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#919198]">{evt.time}</span>
                    <span className="font-mono text-[10px] text-[#E2E2E6]">{evt.target}</span>
                  </div>
                  <p className="text-[11px] truncate text-[#DCDCE0]">{evt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrub Control Bar */}
        <div className="pt-2 border-t border-white/10 flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-[#18181D] hover:bg-[#F02D46]/20 border border-white/10 text-white"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#F02D46]" /> : <Play className="w-3.5 h-3.5 text-[#22C55E]" />}
          </button>

          {/* Progress Slider */}
          <div className="flex-1 relative h-1.5 rounded-full bg-[#18181D] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F02D46] to-[#FF4D61] rounded-full shadow-[0_0_8px_#F02D46]"
              style={{ width: `${((currentStep + 1) / events.length) * 100}%` }}
            />
          </div>

          {/* Timestamp Indicator matching screenshot */}
          <span className="font-mono text-[10px] text-[#919198] shrink-0">
            {events[currentStep]?.time || '14:34:11'} / 14:36:12
          </span>
        </div>
      </div>
    </div>
  );
};
