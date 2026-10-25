import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Node, Edge, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Network,
  Activity,
  Layers,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Wifi,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { NetworkGraphData, NetworkNode } from '../types';
import { NetworkGraph } from '../components/network/NetworkGraph';
import { Network3DGraph } from '../components/network/Network3DGraph';
import { AssetInspector } from '../components/network/AssetInspector';
import { TopologyControls } from '../components/network/TopologyControls';
import { DetectionCorrelationPanel } from '../components/network/DetectionCorrelationPanel';
import { ScenarioSimulationBar } from '../components/network/ScenarioSimulationBar';
import { OmenSectionHeader } from '../components/ui';
import {
  useNetworkTopology,
  useNetworkAlerts,
  useUnmatchedEvents,
  useDetectionModels,
  useLoadScenario,
  useAnalyzeEvent,
} from '../hooks/useOmenApi';

export const NetworkView: React.FC = () => {
  const [isolatedNodes, setIsolatedNodes] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'correlation'>('inspector');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [graphViewMode, setGraphViewMode] = useState<'2D' | '3D'>('2D');

  // React Query Hooks
  const {
    data: topologyData,
    isLoading: isTopologyLoading,
    refetch: refetchTopology,
  } = useNetworkTopology(isolatedNodes);

  const {
    data: alertsData,
    isLoading: isAlertsLoading,
    refetch: refetchAlerts,
  } = useNetworkAlerts();

  const {
    data: unmatchedData,
    isLoading: isUnmatchedLoading,
    refetch: refetchUnmatched,
  } = useUnmatchedEvents();

  const { data: modelsData } = useDetectionModels();
  const loadScenarioMutation = useLoadScenario();
  const analyzeEventMutation = useAnalyzeEvent();

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Compute selected node object
  const selectedNode = useMemo(() => {
    if (!topologyData || !topologyData.nodes) return null;
    if (selectedNodeId) {
      const found = topologyData.nodes.find((n) => n.id.toLowerCase() === selectedNodeId.toLowerCase());
      if (found) return found;
    }
    // Default to first compromised node or first node
    const compromised = topologyData.nodes.find((n) => n.security_status === 'COMPROMISED' || n.compromised);
    return compromised || topologyData.nodes[0] || null;
  }, [topologyData, selectedNodeId]);

  // Handle Isolation Toggle
  const handleToggleIsolation = useCallback(
    (nodeId: string) => {
      setIsolatedNodes((prev) =>
        prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      );
    },
    []
  );

  // Scenario Loader
  const handleLoadScenario = async (scenarioType: string) => {
    try {
      const res = await loadScenarioMutation.mutateAsync(scenarioType);
      if (res && res.topology && res.topology.isolated_nodes) {
        setIsolatedNodes(res.topology.isolated_nodes);
      }
      refetchTopology();
      refetchAlerts();
      refetchUnmatched();
    } catch (err) {
      console.error('Failed to load simulation scenario:', err);
    }
  };

  // Flow Event Injection
  const handleInjectFlow = async (flowData: Record<string, any>) => {
    const res = await analyzeEventMutation.mutateAsync(flowData);
    refetchTopology();
    refetchAlerts();
    refetchUnmatched();
    if (flowData.device_id) {
      setSelectedNodeId(flowData.device_id);
    }
    return res;
  };

  // Refresh All Data
  const handleManualRefresh = () => {
    refetchTopology();
    refetchAlerts();
    refetchUnmatched();
  };

  // Compute Layout & Coordinates for React Flow Canvas
  useEffect(() => {
    if (!topologyData || !topologyData.nodes) return;

    // Filter nodes
    const filteredNodes = topologyData.nodes.filter((node) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        node.name.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        (node.ip && node.ip.toLowerCase().includes(q)) ||
        (node.vulnerabilities && node.vulnerabilities.some((v) => v.toLowerCase().includes(q)));

      const matchesZone =
        zoneFilter === 'ALL' || node.zone.toUpperCase().includes(zoneFilter.toUpperCase());

      const matchesCrit =
        criticalityFilter === 'ALL' ||
        node.criticality.toUpperCase() === criticalityFilter.toUpperCase();

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPROMISED' && (node.security_status === 'COMPROMISED' || node.compromised)) ||
        (statusFilter === 'SUSPICIOUS' && node.security_status === 'SUSPICIOUS') ||
        (statusFilter === 'ISOLATED' && (node.security_status === 'ISOLATED' || node.isolated)) ||
        (statusFilter === 'SECURE' &&
          (node.security_status === 'SECURE' || !node.security_status) &&
          !node.compromised &&
          !node.isolated);

      return matchesSearch && matchesZone && matchesCrit && matchesStatus;
    });

    // Column positions for architectural zones
    const zoneColumns: Record<string, number> = {
      PERIMETER: 80,
      DMZ: 380,
      CORE: 680,
      CORPORATE: 980,
      RESTRICTED: 1280,
    };

    const zoneCounters: Record<string, number> = {
      PERIMETER: 100,
      DMZ: 90,
      CORE: 70,
      CORPORATE: 70,
      RESTRICTED: 110,
    };

    const flowNodes: Node[] = filteredNodes.map((n) => {
      const zoneKey =
        Object.keys(zoneColumns).find((k) => n.zone.toUpperCase().includes(k)) || 'CORE';
      const x = zoneColumns[zoneKey] || 680;
      const y = zoneCounters[zoneKey] || 100;
      zoneCounters[zoneKey] = (zoneCounters[zoneKey] || 100) + 130;

      return {
        id: n.id,
        type: 'cyberDevice',
        position: { x, y },
        selected: selectedNode?.id === n.id,
        data: {
          ...n,
          onSelect: (selected: NetworkNode) => {
            setSelectedNodeId(selected.id);
            setRightPanelTab('inspector');
            setIsRightPanelOpen(true);
          },
        },
      };
    });

    const flowEdges: Edge[] = (topologyData.edges || [])
      .filter((e) => {
        const hasSource = filteredNodes.some((n) => n.id === e.source);
        const hasTarget = filteredNodes.some((n) => n.id === e.target);
        return hasSource && hasTarget;
      })
      .map((e, idx) => {
        const sourceNode = topologyData.nodes.find((n) => n.id === e.source);
        const targetNode = topologyData.nodes.find((n) => n.id === e.target);
        const isCompromisedPath =
          sourceNode?.security_status === 'COMPROMISED' ||
          sourceNode?.compromised ||
          targetNode?.security_status === 'COMPROMISED' ||
          targetNode?.compromised;
        const isSuspiciousPath =
          sourceNode?.security_status === 'SUSPICIOUS' ||
          targetNode?.security_status === 'SUSPICIOUS';

        let strokeColor = '#2D2D38';
        if (isCompromisedPath) {
          strokeColor = '#B3122F';
        } else if (isSuspiciousPath) {
          strokeColor = '#D97706';
        }

        return {
          id: `e-${e.source}-${e.target}-${idx}`,
          source: e.source,
          target: e.target,
          animated: isCompromisedPath,
          style: {
            stroke: strokeColor,
            strokeWidth: isCompromisedPath ? 2.2 : isSuspiciousPath ? 1.8 : 1.0,
            strokeDasharray: isCompromisedPath ? '4,4' : undefined,
          },
          label: `${e.protocol || 'TCP'}:${e.port || 0}`,
          labelStyle: { fill: isCompromisedPath ? '#FF4D6D' : '#A1A1AA', fontSize: 8.5, fontFamily: 'JetBrains Mono', fontWeight: 600 },
          labelBgStyle: { fill: '#0E0E14', fillOpacity: 0.9, stroke: strokeColor, strokeWidth: 0.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 14,
            height: 14,
          },
        };
      });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [topologyData, searchQuery, zoneFilter, criticalityFilter, statusFilter, selectedNode?.id]);

  const activeAlerts = alertsData?.alerts || [];
  const unmatchedEvents = unmatchedData?.unmatched_events || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#07070A] text-zinc-200">
      {/* 1. Header Section: Title, Subtitle, Engine Indicator */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-[#0B0B0F] shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.2 bg-crimson/20 border border-crimson/60 text-crimson text-[10px] font-mono font-bold tracking-widest">
              ØMEN // MODULE 02
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              ATTACK GRAPH INTELLIGENCE
            </span>
          </div>
          <h1 className="font-heading text-xl md:text-2xl font-black text-white tracking-wider flex items-center gap-2">
            THE NETWORK HAS A MEMORY.
          </h1>
          <p className="text-xs text-zinc-400 font-sans tracking-wide max-w-2xl mt-0.5">
            Visualize infrastructure, correlate suspicious activity, and expose potential network relationships.
          </p>
        </div>

        {/* Action & Connectivity Telemetry & 2D/3D Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* 2D / 3D Exploration Mode Toggle */}
          <div className="flex bg-[#121218] border border-zinc-800 p-0.5 font-mono text-xs">
            <button
              onClick={() => setGraphViewMode('2D')}
              className={`px-3 py-1 flex items-center gap-1.5 transition-colors font-bold ${
                graphViewMode === '2D' ? 'bg-crimson/20 text-crimson' : 'text-zinc-400 hover:text-white'
              }`}
            >
              2D TOPOLOGY
            </button>
            <button
              onClick={() => setGraphViewMode('3D')}
              className={`px-3 py-1 flex items-center gap-1.5 transition-colors font-bold ${
                graphViewMode === '3D' ? 'bg-crimson/20 text-crimson' : 'text-zinc-400 hover:text-white'
              }`}
            >
              3D EXPLORATION
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#121218] border border-zinc-800 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-zinc-400">GRAPH SYNC:</span>
            <span className="text-emerald-400 font-bold">LIVE (SQLite)</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isTopologyLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14141B] border border-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all text-xs font-mono font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTopologyLoading ? 'animate-spin text-crimson' : ''}`} />
            REFRESH
          </button>
        </div>
      </div>

      {/* 2. Top Controls & Scenario Simulation Bar */}
      <div className="px-6 py-2.5 bg-[#09090D] border-b border-zinc-800/80 shrink-0 space-y-2">
        <ScenarioSimulationBar
          metrics={topologyData?.metrics}
          onLoadScenario={handleLoadScenario}
          onInjectFlow={handleInjectFlow}
          isLoadingScenario={loadScenarioMutation.isPending}
        />
        <TopologyControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          zoneFilter={zoneFilter}
          onZoneFilterChange={setZoneFilter}
          criticalityFilter={criticalityFilter}
          onCriticalityFilterChange={setCriticalityFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onResetFilters={() => {
            setSearchQuery('');
            setZoneFilter('ALL');
            setCriticalityFilter('ALL');
            setStatusFilter('ALL');
          }}
        />
      </div>

      {/* 3. Main Workspace: Full-Width Graph Canvas + Dynamic Side Inspector */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Full-Width Canvas: 2D vs 3D */}
        <div className="flex-1 h-full relative">
          {graphViewMode === '2D' ? (
            <NetworkGraph
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              className="w-full h-full"
            />
          ) : (
            <Network3DGraph
              nodes={topologyData?.nodes || []}
              edges={topologyData?.edges || []}
              selectedNodeId={selectedNode?.id}
              onSelectNode={(node) => setSelectedNodeId(node.id)}
              isolatedNodes={isolatedNodes}
              className="w-full h-full"
            />
          )}

          {/* Quick Toggle Button for Right Side Panel */}
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="absolute top-4 right-4 z-20 px-2.5 py-1.5 bg-[#121218] border border-zinc-700 hover:border-crimson text-white text-xs font-mono flex items-center gap-1.5 shadow-lg"
          >
            {isRightPanelOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            <span>{isRightPanelOpen ? 'HIDE PANEL' : 'SHOW INSPECTOR'}</span>
          </button>
        </div>

        {/* Right Dock: Inspector & Correlation Drawer */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-[360px] xl:w-[420px] h-full border-l border-zinc-800 bg-[#09090D] flex flex-col shrink-0 z-30 shadow-2xl"
            >
              {/* Tab Switcher */}
              <div className="flex border-b border-zinc-800 bg-[#0E0E14] text-[11px] font-mono uppercase shrink-0">
                <button
                  onClick={() => setRightPanelTab('inspector')}
                  className={`flex-1 py-2 font-bold tracking-wider transition-all ${
                    rightPanelTab === 'inspector'
                      ? 'border-b-2 border-crimson text-white bg-crimson/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Asset Inspector
                </button>
                <button
                  onClick={() => setRightPanelTab('correlation')}
                  className={`flex-1 py-2 font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'correlation'
                      ? 'border-b-2 border-crimson text-white bg-crimson/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Correlation
                  {activeAlerts.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-crimson text-white text-[9px] rounded-full font-bold">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Panel Body */}
              <div className="flex-1 overflow-hidden p-3">
                {rightPanelTab === 'inspector' ? (
                  <AssetInspector
                    selectedNode={selectedNode}
                    isolatedNodes={isolatedNodes}
                    onToggleIsolation={handleToggleIsolation}
                    onSelectNeighbor={(neighborId) => setSelectedNodeId(neighborId)}
                    className="h-full"
                  />
                ) : (
                  <DetectionCorrelationPanel
                    alerts={activeAlerts}
                    unmatchedEvents={unmatchedEvents}
                    modelsStatus={modelsData}
                    onSelectAsset={(assetId) => {
                      setSelectedNodeId(assetId);
                      setRightPanelTab('inspector');
                    }}
                    onInjectSyntheticFlow={() => {
                      // Trigger flow modal
                      const triggerBtn = document.querySelector<HTMLButtonElement>(
                        'button:has-text("INJECT FLOW EVENT")'
                      );
                      if (triggerBtn) triggerBtn.click();
                    }}
                    isLoading={isAlertsLoading}
                    onRefresh={handleManualRefresh}
                    className="h-full"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
