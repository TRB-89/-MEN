import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, Cpu } from 'lucide-react';

export interface ModuleNeuralDetectionPanelProps {
  eventsAnalyzed?: number;
  threatsDetected?: number;
  className?: string;
}

export const ModuleNeuralDetectionPanel: React.FC<ModuleNeuralDetectionPanelProps> = ({
  eventsAnalyzed = 3482,
  threatsDetected = 42,
  className = '',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Live Analysis' | 'Model Performance' | 'Incident History'>('Overview');

  const tabs = ['Overview', 'Live Analysis', 'Model Performance', 'Incident History'] as const;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header (04 MODULE 1 — NEURAL THREAT DETECTION) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-technical text-xs font-bold text-[#F02D46] px-2 py-0.5 rounded bg-[#F02D46]/10 border border-[#F02D46]/30">
            04
          </span>
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              MODULE 1 — NEURAL THREAT DETECTION
            </h3>
            <p className="font-technical text-[10px] text-[#919198]">
              Real-time analysis with model visualizations
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/detection')}
          className="font-technical text-xs text-[#F02D46] hover:text-white flex items-center gap-1 group transition-colors"
        >
          <span>OPEN INFERENCE</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl bg-[#101013]/90 backdrop-blur-xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.7)] p-4 space-y-4 font-technical">
        {/* Sub-tabs Row */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'Overview') navigate('/detection');
              }}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                activeTab === tab
                  ? 'bg-[#F02D46]/20 border border-[#F02D46]/60 text-white font-semibold shadow-[0_0_12px_rgba(240,45,70,0.2)]'
                  : 'bg-[#18181D] border border-white/5 text-[#919198] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#0A0A0D]/70 border border-white/5">
            <span className="text-[10px] uppercase text-[#919198] block">Events Analyzed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-xl font-bold text-[#F5F5F5]">
                {eventsAnalyzed.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#22C55E] font-mono">+12%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A0A0D]/70 border border-white/5">
            <span className="text-[10px] uppercase text-[#919198] block">Threats Detected</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-xl font-bold text-[#F02D46]">
                {threatsDetected}
              </span>
              <span className="text-[10px] text-[#F02D46] font-mono">+5</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A0A0D]/70 border border-white/5">
            <span className="text-[10px] uppercase text-[#919198] block">Model Readiness</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-heading text-lg font-bold text-[#F5F5F5]">3/3</span>
              <span className="px-1.5 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-[9px] font-bold">
                ONLINE
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A0A0D]/70 border border-white/5">
            <span className="text-[10px] uppercase text-[#919198] block">False Positive Rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-heading text-xl font-bold text-[#F5F5F5]">2.1%</span>
              <span className="text-[10px] text-[#22C55E] font-mono">-0.4%</span>
            </div>
          </div>
        </div>

        {/* Lower Row: Waveform Chart on Left + Model Confidence on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Live Traffic Analysis (Cols 1-7) */}
          <div className="md:col-span-7 p-3.5 rounded-xl bg-[#0A0A0D]/70 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                Live Traffic Analysis
              </span>
              <div className="flex items-center gap-3 text-[10px] text-[#919198]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Suspicious
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F02D46]" /> Malicious
                </span>
              </div>
            </div>

            {/* Glowing Red ECG / Cardiac Waveform */}
            <div className="relative h-24 w-full flex items-center overflow-hidden">
              <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />
              <svg className="w-full h-full" viewBox="0 0 350 80" preserveAspectRatio="none">
                <path
                  d="M0 45 L40 45 L50 25 L60 65 L70 30 L80 50 L90 45 L130 45 L140 15 L150 70 L160 35 L170 55 L180 45 L220 45 L230 20 L240 68 L250 10 L260 75 L270 45 L310 45 L320 28 L330 60 L340 45 L350 45"
                  fill="none"
                  stroke="#F02D46"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_8px_#F02D46]"
                />
              </svg>
            </div>

            {/* Timestamps */}
            <div className="flex justify-between text-[9px] text-[#919198] font-mono px-1">
              <span>10:00</span>
              <span>10:05</span>
              <span>10:10</span>
              <span>10:15</span>
              <span>10:20</span>
              <span>10:25</span>
              <span>10:30</span>
            </div>
          </div>

          {/* Model Confidence Progress Bars (Cols 8-12) */}
          <div className="md:col-span-5 p-3.5 rounded-xl bg-[#0A0A0D]/70 border border-white/5 space-y-3">
            <span className="font-heading text-xs font-bold text-[#F5F5F5] uppercase tracking-wider block">
              Model Confidence
            </span>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#919198]">Random Forest</span>
                  <span className="text-[#F5F5F5] font-mono font-bold">98.2%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#18181D] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#F02D46] to-[#FF4D61] rounded-full shadow-[0_0_8px_#F02D46]" style={{ width: '98.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#919198]">MLP Neural Net</span>
                  <span className="text-[#F5F5F5] font-mono font-bold">96.7%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#18181D] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#F02D46] to-[#FF4D61] rounded-full shadow-[0_0_8px_#F02D46]" style={{ width: '96.7%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#919198]">Isolation Forest</span>
                  <span className="text-[#F5F5F5] font-mono font-bold">94.1%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#18181D] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#F02D46] to-[#FF4D61] rounded-full shadow-[0_0_8px_#F02D46]" style={{ width: '94.1%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
