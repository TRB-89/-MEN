import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface ModuleDefenseSimulationPanelProps {
  className?: string;
}

export const ModuleDefenseSimulationPanel: React.FC<ModuleDefenseSimulationPanelProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Recommendation' | 'Simulation' | 'Impact Analysis' | 'Approval' | 'History'>('Recommendation');
  const [isApproved, setIsApproved] = useState(false);

  const tabs = ['Recommendation', 'Simulation', 'Impact Analysis', 'Approval', 'History'] as const;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header (06 MODULE 4 — DEFENSE SIMULATION) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-technical text-xs font-bold text-[#F02D46] px-2 py-0.5 rounded bg-[#F02D46]/10 border border-[#F02D46]/30">
            06
          </span>
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              MODULE 4 — DEFENSE SIMULATION
            </h3>
            <p className="font-technical text-[10px] text-[#919198]">
              Before/after comparison and containment strategy
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/defense')}
          className="font-technical text-xs text-[#F02D46] hover:text-white flex items-center gap-1 group transition-colors"
        >
          <span>SIMULATOR</span>
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
                if (tab !== 'Recommendation') navigate('/defense');
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

        {/* Dual Before / After Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Before Defense */}
          <div className="p-3.5 rounded-xl bg-[#0A0A0D]/70 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading text-xs font-bold text-[#F5F5F5]">Before Defense</span>
              <span className="px-1.5 py-0.2 rounded bg-[#F02D46]/20 text-[#F02D46] text-[9px] font-bold">
                Breached
              </span>
            </div>

            {/* Mini Network Graph Before */}
            <div className="relative h-28 w-full flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 160 80" fill="none">
                {/* Breached link */}
                <line x1="30" y1="40" x2="80" y2="25" stroke="#F02D46" strokeWidth="2" />
                <line x1="80" y1="25" x2="130" y2="45" stroke="#F02D46" strokeWidth="2" strokeDasharray="3 3" />
                <line x1="30" y1="40" x2="80" y2="60" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <line x1="80" y1="60" x2="130" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                {/* WS-001 (Red Breached) */}
                <circle cx="30" cy="40" r="7" fill="#F02D46" className="drop-shadow-[0_0_8px_#F02D46]" />
                <circle cx="30" cy="40" r="2.5" fill="#FFF" />
                <text x="30" y="58" fill="#F02D46" fontSize="6.5" fontWeight="bold" textAnchor="middle">WS-001</text>
                {/* Intermediaries */}
                <circle cx="80" cy="25" r="4.5" fill="#E2E2E6" />
                <circle cx="80" cy="60" r="4.5" fill="#71717A" />
                {/* DB-CORE */}
                <circle cx="130" cy="45" r="10" fill="#F02D46" className="drop-shadow-[0_0_10px_#F02D46]" />
                <circle cx="130" cy="45" r="4" fill="#FFF" />
                <text x="130" y="68" fill="#F5F5F5" fontSize="7" fontWeight="bold" textAnchor="middle">DB-CORE</text>
              </svg>
            </div>
          </div>

          {/* Card 2: After Workstation Isolation */}
          <div className="p-3.5 rounded-xl bg-[#0A0A0D]/70 border border-[#22C55E]/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading text-xs font-bold text-[#F5F5F5]">After Workstation Isolation</span>
              <span className="px-1.5 py-0.2 rounded bg-[#22C55E]/20 text-[#22C55E] text-[9px] font-bold">
                Isolated
              </span>
            </div>

            {/* Mini Network Graph After */}
            <div className="relative h-28 w-full flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 160 80" fill="none">
                {/* Severed links with green quarantine aura */}
                <line x1="30" y1="40" x2="80" y2="25" stroke="rgba(240,45,70,0.2)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="80" y1="25" x2="130" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <line x1="80" y1="60" x2="130" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                {/* WS-001 (Green Isolated) */}
                <circle cx="30" cy="40" r="8" fill="#18181B" stroke="#22C55E" strokeWidth="2" className="drop-shadow-[0_0_8px_#22C55E]" />
                <circle cx="30" cy="40" r="3" fill="#22C55E" />
                <text x="30" y="58" fill="#22C55E" fontSize="6.5" fontWeight="bold" textAnchor="middle">WS-001 [Isolated]</text>
                {/* Intermediaries */}
                <circle cx="80" cy="25" r="4.5" fill="#71717A" />
                <circle cx="80" cy="60" r="4.5" fill="#71717A" />
                {/* DB-CORE Shielded */}
                <circle cx="130" cy="45" r="10" fill="#22C55E" className="drop-shadow-[0_0_10px_#22C55E]" />
                <circle cx="130" cy="45" r="4" fill="#FFF" />
                <text x="130" y="68" fill="#F5F5F5" fontSize="7" fontWeight="bold" textAnchor="middle">DB-CORE</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Simulation Results Bar */}
        <div className="p-3 rounded-xl bg-[#0A0A0D]/70 border border-white/5 space-y-2">
          <span className="text-[10px] uppercase text-[#919198] tracking-wider block">
            Simulation Results
          </span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-[#919198] block">Attack Paths</span>
              <span className="font-heading text-sm font-bold text-[#F5F5F5]">4 → 0</span>
            </div>
            <div>
              <span className="text-[10px] text-[#919198] block">Risk Reduction</span>
              <span className="font-heading text-sm font-bold text-[#22C55E]">87%</span>
            </div>
            <div>
              <span className="text-[10px] text-[#919198] block">Operational Disruption</span>
              <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold inline-block">
                High
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsApproved(true)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isApproved
                ? 'bg-[#22C55E] text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                : 'bg-[#F02D46] hover:bg-[#FF4D61] text-white shadow-[0_0_15px_rgba(240,45,70,0.4)]'
            }`}
          >
            {isApproved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulation Plan Approved</span>
              </>
            ) : (
              <span>Approve Simulation Plan</span>
            )}
          </button>

          <button
            onClick={() => navigate('/defense')}
            className="py-2 px-4 rounded-xl bg-[#18181D] hover:bg-[#202026] border border-white/10 text-xs text-[#E2E2E6] hover:text-white transition-colors"
          >
            Compare Alternatives
          </button>
        </div>
      </div>
    </div>
  );
};
