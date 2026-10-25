import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import { AttackPath, NetworkGraphData } from '../types';
import { PathRankingPanel } from '../components/prediction/PathRankingPanel';
import { AttackTimeline } from '../components/prediction/AttackTimeline';
import { RiskExplanation } from '../components/prediction/RiskExplanation';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';
import { OmenPanel } from '../components/ui/OmenPanel';
import { OmenButton } from '../components/ui/OmenButton';

export const Prediction: React.FC = () => {
  const [topology, setTopology] = useState<NetworkGraphData | null>(null);
  const [sourceNode, setSourceNode] = useState<string>('srv-web-01');
  const [targetNode, setTargetNode] = useState<string>('db-prod-01');
  const [maxHops, setMaxHops] = useState<number>(5);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paths, setPaths] = useState<AttackPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<AttackPath | null>(null);
  const [chokepoints, setChokepoints] = useState<Array<{ node_id: string; name: string; frequency: number; criticality: string }>>([]);

  // Timeline / Step Playback State
  const [activeHopStep, setActiveHopStep] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Initial load: fetch topology to populate node dropdowns
  useEffect(() => {
    api.getNetworkTopology()
      .then((data) => {
        setTopology(data);
        if (data.nodes.length > 0) {
          const entry = data.nodes.find((n) => n.zone === 'DMZ') || data.nodes[0];
          const target = data.nodes.find((n) => n.criticality === 'CRITICAL') || data.nodes[data.nodes.length - 1];
          setSourceNode(entry.id);
          setTargetNode(target.id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Discover Attack Paths
  const handleDiscoverPaths = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.predictAttackPaths(sourceNode, targetNode, [], maxHops);
      setPaths(res.paths || []);
      setChokepoints(res.critical_chokepoints || []);
      if (res.paths && res.paths.length > 0) {
        setSelectedPath(res.paths[0]);
        setActiveHopStep(0);
      } else {
        setSelectedPath(null);
      }
    } catch (err: any) {
      setError(err.message || 'Attack path discovery failed.');
      setPaths([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sourceNode && targetNode) {
      handleDiscoverPaths();
    }
  }, [sourceNode, targetNode]);

  // Animated Timeline Playback
  useEffect(() => {
    let timer: any;
    if (isPlayingTimeline && selectedPath) {
      timer = setInterval(() => {
        setActiveHopStep((prev) => {
          if (prev >= selectedPath.hop_details.length - 1) {
            setIsPlayingTimeline(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline, selectedPath]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Module Header */}
      <OmenSectionHeader 
        moduleNumber="MODULE 03"
        tag="HEURISTIC TRAVERSAL MATRIX"
        title="FORESEE THE BREACH."
        description="Heuristic traversal path discovery through enterprise network topology. Forecasts potential lateral movement corridors targeting crown-jewel assets and identifies critical defensive chokepoints."
        actions={
          <OmenButton 
            variant="primary" 
            size="sm" 
            onClick={handleDiscoverPaths}
            loading={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Discover Attack Paths
          </OmenButton>
        }
      />

      {/* 2. Source & Target Selector Strip */}
      <OmenPanel className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div>
          <label className="text-[10px] text-muted block mb-1.5 uppercase tracking-wider">
            ADVERSARY ENTRY NODE (SOURCE)
          </label>
          <select
            value={sourceNode}
            onChange={(e) => setSourceNode(e.target.value)}
            className="w-full bg-surface-elevated border border-border px-3 py-2 text-primary focus:border-crimson outline-none font-mono text-xs"
          >
            {topology?.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id}) — {n.zone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted block mb-1.5 uppercase tracking-wider">
            CRITICAL ASSET TARGET (DESTINATION)
          </label>
          <select
            value={targetNode}
            onChange={(e) => setTargetNode(e.target.value)}
            className="w-full bg-surface-elevated border border-border px-3 py-2 text-primary focus:border-crimson outline-none font-mono text-xs"
          >
            {topology?.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id}) — {n.criticality}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] text-muted uppercase tracking-wider">
              MAXIMUM HOP HORIZON
            </label>
            <span className="text-chrome font-bold">{maxHops} HOPS</span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            value={maxHops}
            onChange={(e) => setMaxHops(parseInt(e.target.value, 10))}
            className="w-full accent-crimson cursor-pointer"
          />
        </div>
      </OmenPanel>

      {error && (
        <div className="p-4 bg-crimson/15 border border-crimson text-crimson-glow font-mono text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Main Split: Ranked Paths & Attack Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <PathRankingPanel 
            paths={paths}
            selectedPath={selectedPath}
            onSelectPath={(p) => {
              setSelectedPath(p);
              setActiveHopStep(0);
              setIsPlayingTimeline(false);
            }}
            maxHops={maxHops}
          />

          <RiskExplanation 
            path={selectedPath}
            activeHopIndex={activeHopStep}
          />
        </div>

        <div className="lg:col-span-7">
          <AttackTimeline 
            selectedPath={selectedPath}
            activeHopStep={activeHopStep}
            setActiveHopStep={setActiveHopStep}
            isPlayingTimeline={isPlayingTimeline}
            setIsPlayingTimeline={setIsPlayingTimeline}
            chokepoints={chokepoints}
          />
        </div>
      </div>
    </div>
  );
};
