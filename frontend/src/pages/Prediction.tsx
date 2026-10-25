import React, { useState, useEffect, useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import { 
  RefreshCw, 
  AlertTriangle, 
  History, 
  X, 
  Eye, 
  ShieldCheck, 
  Compass, 
  Crosshair, 
  Activity, 
  CheckCircle2,
  Layers,
  ShieldAlert,
  Flame,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { 
  AttackPath, 
  NetworkGraphData, 
  PredictionHistoryItem, 
  CriticalAssetItem, 
  CriticalChokepoint 
} from '../types';
import { NetworkGraph } from '../components/network/NetworkGraph';
import { PathRankingPanel } from '../components/prediction/PathRankingPanel';
import { AttackTimeline } from '../components/prediction/AttackTimeline';
import { RiskExplanation } from '../components/prediction/RiskExplanation';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';
import { OmenPanel } from '../components/ui/OmenPanel';
import { OmenButton } from '../components/ui/OmenButton';
import { OmenBadge } from '../components/ui/OmenBadge';

export const Prediction: React.FC = () => {
  const [topology, setTopology] = useState<NetworkGraphData | null>(null);
  const [criticalAssets, setCriticalAssets] = useState<CriticalAssetItem[]>([]);
  const [sourceNode, setSourceNode] = useState<string>('srv-web-01');
  const [targetNode, setTargetNode] = useState<string>('db-prod-01');
  const [maxHops, setMaxHops] = useState<number>(5);
  const [topK, setTopK] = useState<number>(5);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paths, setPaths] = useState<AttackPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<AttackPath | null>(null);
  const [chokepoints, setChokepoints] = useState<CriticalChokepoint[]>([]);
  const [predictionMeta, setPredictionMeta] = useState<{
    predictionId?: string;
    snapshotId?: string;
    scoringVersion?: string;
    disclaimer?: string;
  }>({});

  // History Dossier State
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<PredictionHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Timeline Playback State
  const [activeHopStep, setActiveHopStep] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Active view tab: GRAPH vs SPLIT
  const [activeViewTab, setActiveViewTab] = useState<'GRAPH' | 'SPLIT'>('GRAPH');

  // Initial load: fetch topology & critical crown-jewel assets
  useEffect(() => {
    Promise.all([
      api.getNetworkTopology(),
      api.getCriticalAssets().catch(() => []),
    ])
      .then(([topoData, critAssets]) => {
        setTopology(topoData);
        if (critAssets.length > 0) {
          setCriticalAssets(critAssets);
        }
        if (topoData.nodes.length > 0) {
          const entry = topoData.nodes.find((n) => n.zone === 'DMZ' || n.compromised) || topoData.nodes[0];
          const target = topoData.nodes.find((n) => n.criticality === 'CRITICAL' && n.id !== entry.id) || topoData.nodes[topoData.nodes.length - 1];
          setSourceNode(entry.id);
          setTargetNode(target.id);
        }
      })
      .catch((err) => console.error('Topology initialization error:', err));
  }, []);

  // Discover Attack Paths using Module 3 API
  const handleDiscoverPaths = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.predictAttackPathsV2({
        source_asset_id: sourceNode,
        target_asset_id: targetNode || undefined,
        max_depth: maxHops,
        top_k: topK,
        isolated_nodes: [],
        simulation_mode: true,
      });

      setPaths(res.candidate_paths || []);
      setChokepoints(res.critical_chokepoints || []);
      setPredictionMeta({
        predictionId: res.prediction_id,
        snapshotId: res.topology_snapshot_id,
        scoringVersion: res.scoring_engine_version,
        disclaimer: res.disclaimer,
      });

      if (res.candidate_paths && res.candidate_paths.length > 0) {
        setSelectedPath(res.candidate_paths[0]);
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
    if (isPlayingTimeline && selectedPath && selectedPath.hop_details.length > 0) {
      timer = setInterval(() => {
        setActiveHopStep((prev) => {
          if (prev >= selectedPath.hop_details.length - 1) {
            setIsPlayingTimeline(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline, selectedPath]);

  // Load History List
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const hist = await api.getPredictionHistory(15);
      setHistoryList(hist);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    fetchHistory();
  };

  const handleLoadHistoricalRecord = async (item: PredictionHistoryItem) => {
    try {
      setIsLoading(true);
      const detail = await api.getPredictionById(item.prediction_id);
      if (detail) {
        setSourceNode(detail.source_asset_id);
        if (detail.target_asset_id) setTargetNode(detail.target_asset_id);
        setPaths(detail.paths || []);
        setChokepoints(detail.critical_chokepoints || []);
        setPredictionMeta({
          predictionId: detail.id,
          snapshotId: detail.topology_snapshot,
          scoringVersion: detail.scoring_version,
        });
        if (detail.paths && detail.paths.length > 0) {
          setSelectedPath(detail.paths[0]);
          setActiveHopStep(0);
        }
      }
      setShowHistoryModal(false);
    } catch (err: any) {
      setError(err.message || 'Could not load historical dossier.');
    } finally {
      setIsLoading(false);
    }
  };

  // Build dynamic React Flow nodes with path highlighting
  const flowNodes: Node[] = useMemo(() => {
    if (!topology) return [];
    const pathNodesSet = new Set(selectedPath?.nodes || []);
    const currentActiveHop = selectedPath?.hop_details?.[activeHopStep];
    const activeTargetId = currentActiveHop ? currentActiveHop.to_node : null;

    const zoneColumns: Record<string, number> = {
      PERIMETER: 80,
      DMZ: 380,
      CORE: 680,
      CORPORATE: 980,
      RESTRICTED: 1280,
    };
    const zoneCounters: Record<string, number> = {};

    return topology.nodes.map((node) => {
      const isPathNode = pathNodesSet.has(node.id);
      const isSource = selectedPath?.nodes[0] === node.id;
      const isTarget = selectedPath?.nodes[selectedPath.nodes.length - 1] === node.id;
      const isActiveStep = activeTargetId === node.id;

      const zoneKey =
        Object.keys(zoneColumns).find((k) => (node.zone || '').toUpperCase().includes(k)) || 'CORE';
      const x = zoneColumns[zoneKey] || 680;
      const y = zoneCounters[zoneKey] || 80;
      zoneCounters[zoneKey] = (zoneCounters[zoneKey] || 80) + 120;

      const opacity = selectedPath ? (isPathNode ? 1 : 0.22) : 1;

      return {
        id: node.id,
        type: 'cyberDevice',
        position: { x, y },
        data: {
          ...node,
          highlightedPath: isPathNode,
          isSource,
          isTarget,
          isActiveStep,
          onSelect: () => {
            if (node.criticality === 'CRITICAL' || node.criticality === 'HIGH') {
              setTargetNode(node.id);
            } else {
              setSourceNode(node.id);
            }
          },
        },
        style: {
          opacity,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: isActiveStep ? 30 : isPathNode ? 20 : 1,
        },
      };
    });
  }, [topology, selectedPath, activeHopStep]);

  // Build dynamic React Flow edges with path illumination
  const flowEdges: Edge[] = useMemo(() => {
    if (!topology) return [];
    const pathHops = new Set<string>();
    if (selectedPath) {
      for (let i = 0; i < selectedPath.nodes.length - 1; i++) {
        pathHops.add(`${selectedPath.nodes[i]}->${selectedPath.nodes[i + 1]}`);
      }
    }

    const currentActiveHop = selectedPath?.hop_details?.[activeHopStep];
    const activeHopKey = currentActiveHop ? `${currentActiveHop.from_node}->${currentActiveHop.to_node}` : null;

    return topology.edges.map((edge, idx) => {
      const hopKey = `${edge.source}->${edge.target}`;
      const isPathEdge = pathHops.has(hopKey);
      const isActive = activeHopKey === hopKey;

      return {
        id: edge.id || `e-${edge.source}-${edge.target}-${idx}`,
        source: edge.source,
        target: edge.target,
        animated: isPathEdge,
        style: {
          stroke: isActive
            ? '#F02D46'
            : isPathEdge
            ? '#B10F29'
            : 'rgba(255, 255, 255, 0.08)',
          strokeWidth: isActive ? 3.5 : isPathEdge ? 2.5 : 1,
          transition: 'all 0.3s ease',
        },
        label: isPathEdge ? `${edge.protocol}/${edge.port}` : undefined,
        labelStyle: { fill: '#E2E2E5', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' },
        labelBgStyle: { fill: '#101013', fillOpacity: 0.9, stroke: '#B10F29', strokeWidth: 0.5 },
      };
    });
  }, [topology, selectedPath, activeHopStep]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Module Header with Non-Confirmed Simulation Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#101013] border border-white/10 font-mono text-[11px] text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-chrome font-bold uppercase tracking-wider">DEFENSIVE SIMULATION ADVISORY:</span>
          <span className="text-muted">Heuristic traversal risk model. Represents potential propagation vectors, never guaranteed adversary activity.</span>
        </div>
        <div className="flex items-center gap-2">
          {predictionMeta.predictionId && (
            <span className="font-mono text-[10px] text-chrome bg-surface-elevated px-2 py-0.5 rounded border border-border">
              {predictionMeta.predictionId}
            </span>
          )}
          <span className="font-mono text-[10px] text-crimson bg-crimson/10 px-2 py-0.5 rounded border border-crimson/30 font-bold">
            HEURISTIC // READ-ONLY PROJECTION
          </span>
        </div>
      </div>

      <OmenSectionHeader 
        moduleNumber="MODULE 03"
        tag="HEURISTIC TRAVERSAL MATRIX"
        title="FORESEE THE BREACH."
        description="Predictive network intelligence engine. Identifies, ranks, and maps lateral movement corridors through enterprise topology before critical crown-jewel assets are compromised."
        actions={
          <div className="flex items-center gap-2">
            <OmenButton 
              variant="secondary" 
              size="sm"
              onClick={handleOpenHistory}
              icon={<History className="w-3.5 h-3.5 text-chrome" />}
            >
              History Dossiers
            </OmenButton>
            <OmenButton 
              variant="primary" 
              size="sm" 
              onClick={handleDiscoverPaths}
              loading={isLoading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Discover Attack Paths
            </OmenButton>
          </div>
        }
      />

      {/* 2. Source & Target Selector Control Strip */}
      <OmenPanel className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div>
          <label className="text-[10px] text-muted block mb-1.5 uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <Crosshair className="w-3.5 h-3.5 text-chrome" />
            <span>ADVERSARY ENTRY NODE (SOURCE)</span>
          </label>
          <select
            value={sourceNode}
            onChange={(e) => setSourceNode(e.target.value)}
            className="w-full bg-surface-elevated border border-border px-3 py-2 text-primary focus:border-crimson outline-none font-mono text-xs rounded"
          >
            {topology?.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id}) — {n.zone} [{n.security_status || 'SECURE'}]
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted block mb-1.5 uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <Flame className="w-3.5 h-3.5 text-crimson" />
            <span>CROWN-JEWEL TARGET (DESTINATION)</span>
          </label>
          <select
            value={targetNode}
            onChange={(e) => setTargetNode(e.target.value)}
            className="w-full bg-surface-elevated border border-border px-3 py-2 text-primary focus:border-crimson outline-none font-mono text-xs rounded"
          >
            {criticalAssets.length > 0 ? (
              criticalAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.id}) — {a.criticality} [{a.zone}]
                </option>
              ))
            ) : (
              topology?.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.id}) — {n.criticality}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5 font-bold">
            <label className="text-[10px] text-muted uppercase tracking-wider">
              MAX HOP HORIZON
            </label>
            <span className="text-chrome">{maxHops} HOPS</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            value={maxHops}
            onChange={(e) => setMaxHops(parseInt(e.target.value, 10))}
            className="w-full accent-crimson cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5 font-bold">
            <label className="text-[10px] text-muted uppercase tracking-wider">
              CANDIDATE CORRIDORS (TOP-K)
            </label>
            <span className="text-chrome">{topK} PATHS</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value, 10))}
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

      {/* 3. Interactive Attack Graph Topology Panel */}
      <OmenPanel className="p-0 overflow-hidden border border-border">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2 font-mono text-xs">
            <Compass className="w-4 h-4 text-crimson" />
            <span className="font-bold uppercase tracking-wider text-primary">
              TOPOLOGY ATTACK VECTOR PROJECTION
            </span>
            <span className="text-muted text-[11px] hidden sm:inline">
              // Click nodes to change source/target. Selected trajectory illuminates in crimson.
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E5]" />
              <span className="text-muted text-[10px]">SOURCE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B10F29]" />
              <span className="text-muted text-[10px]">TARGET</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F02D46] animate-pulse" />
              <span className="text-muted text-[10px]">ACTIVE HOP</span>
            </div>
          </div>
        </div>

        <div className="h-[420px] w-full relative">
          <NetworkGraph
            nodes={flowNodes}
            edges={flowEdges}
            showMinimap={true}
          />
        </div>
      </OmenPanel>

      {/* 4. Main Split: Ranked Paths & Attack Timeline */}
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

        <div className="lg:col-span-7 space-y-6">
          <AttackTimeline 
            selectedPath={selectedPath}
            activeHopStep={activeHopStep}
            setActiveHopStep={setActiveHopStep}
            isPlayingTimeline={isPlayingTimeline}
            setIsPlayingTimeline={setIsPlayingTimeline}
            chokepoints={chokepoints}
          />

          {/* Critical Chokepoint Defense Advisory */}
          {chokepoints.length > 0 && (
            <OmenPanel className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-primary">
                    IDENTIFIED DEFENSIVE CHOKEPOINTS ({chokepoints.length})
                  </span>
                </div>
                <span className="text-[10px] text-muted">CONTAINMENT RECOMMENDATIONS</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {chokepoints.map((chk, cIdx) => (
                  <div
                    key={chk.node_id || cIdx}
                    className="p-3 bg-surface-elevated border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-chrome">{chk.name}</span>
                        <span className="text-[10px] text-muted">[{chk.node_id}]</span>
                        <span className="px-1.5 py-0.2 bg-crimson/15 text-crimson text-[9px] font-bold">
                          {chk.frequency} CORRIDORS
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary mt-1">
                        {chk.recommended_action}
                      </p>
                    </div>

                    <OmenBadge variant="neutral" size="sm">
                      {chk.criticality}
                    </OmenBadge>
                  </div>
                ))}
              </div>
            </OmenPanel>
          )}
        </div>
      </div>

      {/* 5. Historical Predictions Dossier Drawer / Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
          <div className="bg-[#050506] border border-white/20 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-crimson" />
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-chrome">
                  HISTORICAL PREDICTION DOSSIERS (SQLITE INCIDENT MEMORY)
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-muted hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[440px] overflow-y-auto space-y-2.5 text-xs">
              {isLoadingHistory ? (
                <div className="p-8 text-center text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-crimson" />
                  <span>Querying SQLite prediction audit records...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  No previous attack path predictions recorded in Incident Memory.
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.prediction_id}
                    onClick={() => handleLoadHistoricalRecord(item)}
                    className="p-3.5 bg-[#101013] hover:bg-[#19191D] border border-white/10 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-chrome font-bold">{item.prediction_id}</span>
                        <span className="text-[10px] text-muted">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-secondary mt-1 flex items-center gap-1.5">
                        <span className="text-chrome">{item.source_asset_id}</span>
                        <span>→</span>
                        <span className="text-crimson font-semibold">{item.target_asset_id || 'ALL CROWN JEWELS'}</span>
                        <span className="text-muted ml-2">({item.total_paths} paths found)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        item.risk_category === 'CRITICAL'
                          ? 'bg-crimson/20 text-crimson border border-crimson/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}>
                        {item.highest_risk_score.toFixed(1)} / 100
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <OmenButton
                variant="secondary"
                size="sm"
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </OmenButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
