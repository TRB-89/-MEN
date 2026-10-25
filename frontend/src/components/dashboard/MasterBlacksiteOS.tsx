import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { OmenJellyfishEntity } from '../hero/OmenJellyfishEntity';
import { StoryCardsBar } from './StoryCardsBar';
import { CommandPaletteHUD } from './CommandPaletteHUD';
import { Module3DNetworkPanel } from './Module3DNetworkPanel';
import { ModuleNeuralDetectionPanel } from './ModuleNeuralDetectionPanel';
import { ModulePathPredictionPanel } from './ModulePathPredictionPanel';
import { ModuleDefenseSimulationPanel } from './ModuleDefenseSimulationPanel';
import { ModuleAttackReplayPanel } from './ModuleAttackReplayPanel';
import { api } from '../../services/api';
import { NetworkGraphData } from '../../types';

export const MasterBlacksiteOS: React.FC = () => {
  const navigate = useNavigate();
  const [topology, setTopology] = useState<NetworkGraphData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [topoRes, statsRes] = await Promise.allSettled([
        api.getNetworkTopology(),
        api.getStats(),
      ]);
      if (topoRes.status === 'fulfilled') setTopology(topoRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    } catch (err) {
      console.error('Error loading master OS telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-[#F5F5F5] font-sans selection:bg-[#F02D46] selection:text-white relative overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Background Volcanic Ambience & Subtle Grid */}
      <div className="fixed inset-0 bg-tech-grid opacity-15 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(240,45,70,0.12),transparent_70%)] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_bottom,rgba(240,45,70,0.08),transparent_70%)] pointer-events-none z-0" />

      {/* TOP ROW: Left Hero + Right Command Palette HUD */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top-Left: Hero Showcase Section (Cols 1-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            {/* ØMEN Brand */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <span className="w-2.5 h-2.5 bg-[#F02D46] rounded-sm shadow-[0_0_10px_#F02D46]" />
              <span className="font-heading text-xl font-black tracking-wider text-white">ØMEN</span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 font-technical text-xs text-[#919198]">
              <button onClick={() => navigate('/')} className="text-[#F5F5F5] font-semibold">Home</button>
              <button onClick={() => navigate('/detection')} className="hover:text-white transition-colors">Modules</button>
              <button onClick={() => navigate('/system')} className="hover:text-white transition-colors">System</button>
              <button onClick={() => navigate('/network')} className="hover:text-white transition-colors">Architecture</button>
              <button onClick={() => navigate('/history')} className="hover:text-white transition-colors">About</button>
            </nav>

            {/* Right Action */}
            <button
              onClick={() => navigate('/console')}
              className="px-4 py-1.5 rounded-full bg-[#101013] hover:bg-[#F02D46] border border-white/15 hover:border-[#F02D46] font-technical text-xs font-semibold text-white transition-all flex items-center gap-1.5 group shadow-[0_0_15px_rgba(240,45,70,0.2)]"
            >
              <span>ENTER CONSOLE</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Hero Section Container */}
          <div className="relative rounded-2xl bg-[#08080A]/90 border border-white/10 p-6 overflow-hidden min-h-[440px] flex flex-col justify-between">
            {/* Jellyfish Centerpiece in Background */}
            <div className="absolute right-0 top-0 bottom-0 w-3/5 pointer-events-none overflow-visible flex items-center justify-center opacity-90">
              <OmenJellyfishEntity className="w-full h-[480px]" entityState="ELEVATED_RISK" />
            </div>

            <div className="relative z-10 max-w-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-technical text-[10px] text-[#F02D46] tracking-widest uppercase font-bold">
                  DEFCON 3 POSTURE
                </span>
                <span className="text-[#919198]">•</span>
                <span className="font-technical text-[10px] text-[#919198] tracking-widest uppercase font-bold">
                  THE ØMEN CONSOLE.
                </span>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-[#F5F5F5] leading-[0.95]">
                PREDICT THE UNKNOWN.{' '}
                <span className="text-[#F02D46] drop-shadow-[0_0_20px_rgba(240,45,70,0.4)]">
                  CONTROL THE THREAT.
                </span>
              </h1>

              <p className="font-sans text-xs sm:text-sm text-[#919198] leading-relaxed">
                Neural threat detection, attack-path intelligence and autonomous defense simulation within one integrated cyber intelligence platform.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => navigate('/detection')}
                  className="px-5 py-2 rounded-full bg-[#F02D46] hover:bg-[#FF4D61] text-white font-technical text-xs font-bold transition-all shadow-[0_0_20px_rgba(240,45,70,0.4)] flex items-center gap-1.5"
                >
                  <span>EXPLORE ØMEN</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => navigate('/console')}
                  className="px-5 py-2 rounded-full bg-[#18181D] hover:bg-[#202026] border border-white/15 text-[#E2E2E6] font-technical text-xs font-semibold transition-colors"
                >
                  LAUNCH CONSOLE
                </button>
              </div>
            </div>

            {/* Asymmetrical Floating Metric Cards matching screenshot */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-6 mt-6 border-t border-white/10 font-technical">
              {/* Card 1 */}
              <div className="p-3 rounded-xl bg-[#101013]/90 backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between text-[10px] text-[#919198] uppercase">
                  <span>Threats Detected</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F02D46] animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-heading text-xl font-bold text-white">42</span>
                  <span className="text-[10px] text-[#F02D46] font-mono">+12%</span>
                </div>
                <p className="text-[9px] text-[#919198] mt-0.5">ML Multi-Model Telemetry</p>
              </div>

              {/* Card 2 */}
              <div className="p-3 rounded-xl bg-[#101013]/90 backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between text-[10px] text-[#919198] uppercase">
                  <span>Model Readiness</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                </div>
                <div className="font-heading text-lg font-bold text-white mt-1">3/3 ONLINE</div>
                <p className="text-[9px] text-[#919198] mt-0.5">99.1% accuracy (last 24h)</p>
              </div>

              {/* Card 3 */}
              <div className="p-3 rounded-xl bg-[#101013]/90 backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between text-[10px] text-[#919198] uppercase">
                  <span>Attack Paths</span>
                  <span className="text-[#F02D46] text-xs">↗</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-heading text-xl font-bold text-white">28</span>
                  <span className="text-[10px] text-[#F02D46] font-mono">+5</span>
                </div>
                <p className="text-[9px] text-[#919198] mt-0.5">Lateral Corridors</p>
              </div>
            </div>
          </div>

          {/* Section 01: 4 Horizontal Story Cards Bar */}
          <StoryCardsBar />
        </div>

        {/* Top-Right: Command Palette HUD (Cols 8-12) */}
        <div className="lg:col-span-5 space-y-6">
          <CommandPaletteHUD />
          {/* Middle-Right: Module 2 — 3D Network Exploration Mode */}
          <Module3DNetworkPanel nodes={topology?.nodes} edges={topology?.edges} />
        </div>
      </div>

      {/* BOTTOM ROW: 4 MODULE PODS (04, 05, 06, 07) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {/* Pod 04: Neural Threat Detection */}
        <ModuleNeuralDetectionPanel
          eventsAnalyzed={stats?.total_records_analyzed !== undefined ? stats.total_records_analyzed : 3482}
          threatsDetected={stats?.predicted_malicious_count !== undefined ? stats.predicted_malicious_count : 42}
        />

        {/* Pod 05: Attack Path Prediction */}
        <ModulePathPredictionPanel />

        {/* Pod 06: Defense Simulation */}
        <ModuleDefenseSimulationPanel />

        {/* Pod 07: Attack Replay Timeline */}
        <ModuleAttackReplayPanel />
      </div>
    </div>
  );
};
