import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Layers,
  BarChart2,
  Share2,
  X,
  Send,
} from 'lucide-react';
import { NetworkGraphMetrics } from '../../types';
import { OmenPanel } from '../ui';

export interface ScenarioSimulationBarProps {
  metrics?: NetworkGraphMetrics;
  onLoadScenario: (scenarioType: string) => void;
  onInjectFlow: (flowData: Record<string, any>) => Promise<any>;
  isLoadingScenario?: boolean;
  className?: string;
}

export const ScenarioSimulationBar: React.FC<ScenarioSimulationBarProps> = ({
  metrics,
  onLoadScenario,
  onInjectFlow,
  isLoadingScenario = false,
  className = '',
}) => {
  const [showInjectModal, setShowInjectModal] = useState<boolean>(false);
  const [injectDevice, setInjectDevice] = useState<string>('ws-dev-04');
  const [injectService, setInjectService] = useState<string>('ssh');
  const [injectProto, setInjectProto] = useState<string>('tcp');
  const [injectRate, setInjectRate] = useState<number>(350);
  const [injectSbytes, setInjectSbytes] = useState<number>(8500);
  const [injectSourceIp, setInjectSourceIp] = useState<string>('10.0.3.104');
  const [injectDestIp, setInjectDestIp] = useState<string>('10.0.2.10');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [injectResult, setInjectResult] = useState<string | null>(null);

  const scenarios = [
    { id: 'baseline', label: 'RESET BASELINE', icon: <RotateCcw className="w-3 h-3 text-emerald-400" />, desc: 'Normalize all nodes to SECURE state' },
    { id: 'kerberoasting', label: 'KERBEROASTING', icon: <Zap className="w-3 h-3 text-amber-400" />, desc: 'Simulate T1558.003 SPN query on ws-dev-04' },
    { id: 'dmz_foothold', label: 'DMZ WEB EXPLOIT', icon: <AlertTriangle className="w-3 h-3 text-crimson" />, desc: 'Simulate CVE-2024-21413 exploit on srv-web-01' },
    { id: 'ransomware_staging', label: 'RANSOMWARE STAGING', icon: <Zap className="w-3 h-3 text-purple-400" />, desc: 'ws-ops-05 staging probes toward cold backup' },
    { id: 'zero_trust_isolated', label: 'ZERO-TRUST QUARANTINE', icon: <Lock className="w-3 h-3 text-cyan-400" />, desc: 'Autonomous boundary severing on compromised nodes' },
  ];

  const handleApplyPreset = (preset: 'compromise_dev' | 'compromise_db' | 'unmatched_ext' | 'benign') => {
    if (preset === 'compromise_dev') {
      setInjectDevice('ws-dev-04');
      setInjectService('ssh');
      setInjectProto('tcp');
      setInjectRate(400);
      setInjectSbytes(9500);
      setInjectSourceIp('10.0.3.104');
      setInjectDestIp('10.0.2.10');
    } else if (preset === 'compromise_db') {
      setInjectDevice('db-prod-01');
      setInjectService('sql');
      setInjectProto('tcp');
      setInjectRate(800);
      setInjectSbytes(25000);
      setInjectSourceIp('10.0.3.105');
      setInjectDestIp('10.0.4.50');
    } else if (preset === 'unmatched_ext') {
      setInjectDevice('');
      setInjectService('http');
      setInjectProto('udp');
      setInjectRate(500);
      setInjectSbytes(12000);
      setInjectSourceIp('203.0.113.88');
      setInjectDestIp('198.51.100.99');
    } else {
      setInjectDevice('ws-hr-02');
      setInjectService('dns');
      setInjectProto('udp');
      setInjectRate(10);
      setInjectSbytes(250);
      setInjectSourceIp('10.0.3.102');
      setInjectDestIp('10.0.2.15');
    }
  };

  const handleSubmitFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setInjectResult(null);
    try {
      const payload: Record<string, any> = {
        proto: injectProto,
        service: injectService,
        rate: injectRate,
        sbytes: injectSbytes,
        source_ip: injectSourceIp,
        destination_ip: injectDestIp,
        dur: 0.25,
        spkts: 45,
      };
      if (injectDevice.trim()) {
        payload.device_id = injectDevice.trim();
      }

      const res = await onInjectFlow(payload);
      setInjectResult(`Engine Verdict: ${res.threat_status} (${res.severity}) — Decision: ${res.decision_rule}`);
      setTimeout(() => {
        setShowInjectModal(false);
        setInjectResult(null);
      }, 2000);
    } catch (err: any) {
      setInjectResult(`Error: ${err.message || 'Flow evaluation failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <OmenPanel className={`p-3 bg-[#0D0D12] border border-zinc-800 space-y-3 font-mono text-xs ${className}`}>
        {/* Top: Real-Time Statistics Counters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pb-2.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <BarChart2 className="w-4 h-4 text-crimson" />
            <span className="font-bold text-zinc-200 uppercase tracking-widest text-[10px]">
              GRAPH METRICS:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">TOTAL ASSETS:</span>
              <span className="text-white font-bold">{metrics?.total_assets || 16}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">RELATIONSHIPS:</span>
              <span className="text-zinc-300 font-bold">{metrics?.total_relationships || 26}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">COMPROMISED:</span>
              <span className="text-crimson font-bold">{metrics?.compromised_count ?? 1}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">SUSPICIOUS:</span>
              <span className="text-amber-400 font-bold">{metrics?.suspicious_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">ISOLATED:</span>
              <span className="text-zinc-400 font-bold">{metrics?.isolated_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">SECURE:</span>
              <span className="text-emerald-400 font-bold">{metrics?.secure_count ?? 15}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">DENSITY:</span>
              <span className="text-cyan-400 font-bold">{metrics?.density ?? '0.1083'}</span>
            </div>
          </div>
        </div>

        {/* Bottom: Scenario Simulation Buttons & Inject Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-zinc-500 uppercase tracking-widest font-semibold shrink-0">
            <Play className="w-3 h-3 text-crimson" />
            SCENARIO REPLAY:
          </div>

          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {scenarios.map((scen) => (
              <button
                key={scen.id}
                onClick={() => onLoadScenario(scen.id)}
                disabled={isLoadingScenario}
                title={scen.desc}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#14141B] border border-zinc-800 hover:border-crimson text-zinc-300 hover:text-white transition-all text-[10px] font-bold disabled:opacity-50"
              >
                {scen.icon}
                <span>{scen.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowInjectModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-crimson text-white hover:bg-crimson/80 transition-all text-[10px] font-bold shadow-[0_0_12px_rgba(179,18,47,0.4)]"
          >
            <Zap className="w-3 h-3" />
            INJECT FLOW EVENT
          </button>
        </div>
      </OmenPanel>

      {/* SYNTHETIC EVENT INJECTION MODAL */}
      {showInjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0E0E14] border-2 border-crimson p-5 font-mono text-xs space-y-4 shadow-[0_0_40px_rgba(179,18,47,0.5)] animate-fade-in relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-crimson" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                  INJECT SYNTHETIC FLOW TELEMETRY
                </h3>
              </div>
              <button
                onClick={() => setShowInjectModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans">
              Submits a validated network flow directly through the <strong className="text-zinc-200">Module 1 Neural Threat Detection Engine</strong> (Random Forest + Isolation Forest) and executes live correlation against the <strong className="text-zinc-200">NetworkX attack graph</strong>.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                TEST PRESETS:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('compromise_dev')}
                  className="p-1.5 bg-[#14141B] border border-zinc-800 hover:border-zinc-500 text-left text-zinc-300"
                >
                  ⚡ Probe ws-dev-04 (High Rate)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('compromise_db')}
                  className="p-1.5 bg-[#14141B] border border-zinc-800 hover:border-zinc-500 text-left text-zinc-300"
                >
                  ⚡ Probe db-prod-01 (SQL Burst)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('unmatched_ext')}
                  className="p-1.5 bg-[#14141B] border border-zinc-800 hover:border-zinc-500 text-left text-zinc-300"
                >
                  ❓ Unmatched External IP
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('benign')}
                  className="p-1.5 bg-[#14141B] border border-zinc-800 hover:border-zinc-500 text-left text-zinc-300"
                >
                  🛡️ Normal DNS Flow (Benign)
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitFlow} className="space-y-3 pt-2 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                    TARGET DEVICE ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={injectDevice}
                    onChange={(e) => setInjectDevice(e.target.value)}
                    placeholder="e.g. ws-dev-04 (blank for unmatched)"
                    className="w-full bg-[#14141B] border border-zinc-800 p-2 text-white outline-none focus:border-crimson text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                    SERVICE / PROTOCOL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={injectService}
                      onChange={(e) => setInjectService(e.target.value)}
                      placeholder="service (ssh, http)"
                      className="w-1/2 bg-[#14141B] border border-zinc-800 p-2 text-white outline-none focus:border-crimson text-xs"
                    />
                    <select
                      value={injectProto}
                      onChange={(e) => setInjectProto(e.target.value)}
                      className="w-1/2 bg-[#14141B] border border-zinc-800 p-2 text-white outline-none focus:border-crimson text-xs uppercase"
                    >
                      <option value="tcp">TCP</option>
                      <option value="udp">UDP</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                    SOURCE IP
                  </label>
                  <input
                    type="text"
                    value={injectSourceIp}
                    onChange={(e) => setInjectSourceIp(e.target.value)}
                    className="w-full bg-[#14141B] border border-zinc-800 p-2 text-white outline-none focus:border-crimson text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                    DESTINATION IP
                  </label>
                  <input
                    type="text"
                    value={injectDestIp}
                    onChange={(e) => setInjectDestIp(e.target.value)}
                    className="w-full bg-[#14141B] border border-zinc-800 p-2 text-white outline-none focus:border-crimson text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                    PACKET RATE (pkts/sec)
                  </label>
                  <input
                    type="number"
                    value={injectRate}
                    onChange={(e) => setInjectRate(Number(e.target.value))}
                    className="w-full bg-[#14141B] border border-zinc-800 p-2 text-white outline-none focus:border-crimson text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                    SOURCE BYTES
                  </label>
                  <input
                    type="number"
                    value={injectSbytes}
                    onChange={(e) => setInjectSbytes(Number(e.target.value))}
                    className="w-full bg-[#14141B] border border-zinc-800 p-2 text-white outline-none focus:border-crimson text-xs"
                  />
                </div>
              </div>

              {injectResult && (
                <div className={`p-2.5 border text-xs font-mono ${injectResult.includes('Error') ? 'bg-crimson/20 border-crimson text-crimson' : 'bg-emerald-950/40 border-emerald-500 text-emerald-300'}`}>
                  {injectResult}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowInjectModal(false)}
                  className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-crimson text-white font-bold hover:bg-crimson/80 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'ANALYZING FLOW...' : 'SUBMIT TO MODULE 1 ENGINE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
