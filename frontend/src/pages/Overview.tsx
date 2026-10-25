import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { 
  DetectionHistoryResponse, 
  NetworkGraphData, 
  DetectionModelsResponse, 
  AttackPath 
} from '../types';
import { useBackend } from '../services/BackendContext';
import { SecurityOverview } from '../components/console/SecurityOverview';
import { ThreatDistribution } from '../components/console/ThreatDistribution';
import { RecentEvents } from '../components/console/RecentEvents';
import { NetworkPreview } from '../components/console/NetworkPreview';
import { ModelHealth } from '../components/console/ModelHealth';
import { OmenPanel } from '../components/ui/OmenPanel';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline } = useBackend();

  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<DetectionHistoryResponse | null>(null);
  const [topology, setTopology] = useState<NetworkGraphData | null>(null);
  const [models, setModels] = useState<DetectionModelsResponse | null>(null);
  const [predictedPath, setPredictedPath] = useState<AttackPath | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchConsoleTelemetry = async () => {
    setIsLoading(true);
    try {
      const [statsRes, historyRes, topoRes, modelsRes, pathRes] = await Promise.allSettled([
        api.getStats(),
        api.getDetectionHistory(10, 0),
        api.getNetworkTopology(),
        api.getDetectionModels(),
        api.predictAttackPaths('srv-web-01', 'db-prod-01', [], 4),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value);
      if (topoRes.status === 'fulfilled') setTopology(topoRes.value);
      if (modelsRes.status === 'fulfilled') setModels(modelsRes.value);
      if (pathRes.status === 'fulfilled' && pathRes.value.paths && pathRes.value.paths.length > 0) {
        setPredictedPath(pathRes.value.paths[0]);
      }
    } catch (err) {
      console.error('Failed to load console telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsoleTelemetry();
  }, []);

  const totalEvents = stats?.total_flows_analyzed || 1420;
  const compromisedCount = topology?.nodes.filter((n) => n.compromised).length || 1;
  const isolatedCount = topology?.isolated_nodes.length || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Module Header */}
      <OmenSectionHeader 
        moduleNumber="MODULE 06"
        tag="DEFCON 3 POSTURE"
        title="THE ØMEN CONSOLE."
        description="Single-pane-of-glass executive cybersecurity interface synthesizing multi-model threat perception, network memory topology, predictive lateral movement, and autonomous quarantine simulation."
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface border border-crimson/40 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
              <span className="text-crimson-glow font-bold">DEFCON 3 // ELEVATED THREAT</span>
            </div>

            <button
              onClick={fetchConsoleTelemetry}
              disabled={isLoading}
              className="p-2 bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-chrome transition-colors"
              title="Refresh console telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* 2. Top Telemetry KPI Ribbon */}
      <SecurityOverview 
        totalFlows={totalEvents}
        compromisedCount={compromisedCount}
        nodesCount={topology?.nodes_count || 10}
        edgesCount={topology?.edges_count || 14}
        modelsOnline={3}
        isolatedCount={isolatedCount}
        runtimeDevice="LOCAL CPU"
      />

      {/* 3. Central Grid: Topology Radar + Live Threats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <NetworkPreview 
            topology={topology}
            predictedPath={predictedPath}
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <RecentEvents 
            events={history?.records || []}
          />
          <ThreatDistribution 
            distribution={stats?.severity_distribution}
          />
        </div>
      </div>

      {/* 4. Bottom Grid: Model Readiness + Containment Simulation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ModelHealth models={models} />
        </div>

        <div className="lg:col-span-4">
          <OmenPanel className="p-5 space-y-3 font-mono text-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-2.5">
                <span className="font-heading text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  AUTONOMOUS DEFENSE
                </span>
                <span className="px-2 py-0.5 bg-success/20 text-success text-[9px] font-bold">
                  READY
                </span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-secondary">CONTAINMENT EFFICACY:</span>
                  <span className="text-success font-bold">75.0% AVERAGE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">BLAST RADIUS REDUCTION:</span>
                  <span className="text-primary font-bold">4 NODES SHIELDED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">ACTIVE QUARANTINES:</span>
                  <span className="text-amber-400 font-bold">{isolatedCount} DEVICES</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/defense')}
              className="w-full py-2 bg-surface-elevated hover:bg-surface border border-border text-chrome font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>OPEN DEFENSE SIMULATOR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </OmenPanel>
        </div>
      </div>
    </div>
  );
};
