import React, { useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Server, 
  Laptop, 
  Database as DatabaseIcon, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  KeyRound, 
  Flame, 
  Router, 
  Layers, 
  Maximize2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  NetworkNode, 
  NetworkEdge, 
  DefenseSimulationResponse, 
  DefenseActionType,
  AttackPath
} from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenButton } from '../ui/OmenButton';

// Custom Stylized React Flow Node Component for Defense Simulation
const DefenseSimNode: React.FC<{
  data: NetworkNode & {
    isIsolated?: boolean;
    isCompromised?: boolean;
    isCrownJewel?: boolean;
    isMonitored?: boolean;
    isTargetAction?: boolean;
    isReachableAfter?: boolean;
  };
  selected: boolean;
}> = ({ data, selected }) => {
  const { isIsolated, isCompromised, isCrownJewel, isMonitored, isTargetAction, isReachableAfter } = data;

  const getDeviceIcon = () => {
    const type = (data.device_type || data.asset_type || '').toLowerCase();
    switch (type) {
      case 'database':
        return <DatabaseIcon className="w-4 h-4 text-amber-400" />;
      case 'workstation':
        return <Laptop className="w-4 h-4 text-zinc-300" />;
      case 'gateway':
        return <Router className="w-4 h-4 text-cyan-400" />;
      case 'firewall':
        return <Flame className="w-4 h-4 text-crimson" />;
      case 'domain_controller':
        return <KeyRound className="w-4 h-4 text-yellow-300" />;
      default:
        return <Server className="w-4 h-4 text-zinc-300" />;
    }
  };

  // BLACKSITE Cinematic Styling States
  let borderBgClass = 'border border-white/10 bg-[#101013]/90 text-white shadow-lg';
  let badgeLabel = null;

  if (isIsolated) {
    borderBgClass = 'border-2 border-dashed border-amber-500/80 bg-[#1c1200]/90 text-amber-200 opacity-70 shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    badgeLabel = (
      <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[8px] font-mono font-bold rounded flex items-center gap-0.5">
        <Lock className="w-2.5 h-2.5" /> QUARANTINED
      </span>
    );
  } else if (isCompromised) {
    borderBgClass = 'border-2 border-crimson bg-crimson/25 text-white shadow-[0_0_25px_rgba(177,15,41,0.6)] animate-pulse';
    badgeLabel = (
      <span className="px-1.5 py-0.5 bg-crimson text-white text-[8px] font-mono font-bold rounded">
        FOOTHOLD
      </span>
    );
  } else if (isMonitored) {
    borderBgClass = 'border-2 border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.4)]';
    badgeLabel = (
      <span className="px-1.5 py-0.5 bg-cyan-500 text-black text-[8px] font-mono font-bold rounded flex items-center gap-0.5">
        <Eye className="w-2.5 h-2.5" /> SENSOR BOOST
      </span>
    );
  } else if (isCrownJewel) {
    borderBgClass = 'border-2 border-amber-400/80 bg-[#1a1500]/90 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]';
    badgeLabel = (
      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px] font-mono font-bold rounded">
        CROWN JEWEL
      </span>
    );
  }

  return (
    <div
      className={`relative px-3.5 py-2.5 min-w-[180px] max-w-[210px] rounded-xl transition-all duration-300 font-mono text-xs backdrop-blur-md ${borderBgClass} ${
        selected || isTargetAction ? 'ring-2 ring-crimson' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-zinc-500 !w-1.5 !h-1.5 !border-0" />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-muted">
          {getDeviceIcon()}
          <span className="text-[9px] uppercase tracking-wider font-semibold truncate max-w-[70px]">
            {data.device_type}
          </span>
        </div>
        {badgeLabel}
      </div>

      {/* Node Name */}
      <div className="font-heading font-bold text-xs tracking-wide text-chrome truncate">
        {data.name}
      </div>
      <div className="text-[10px] text-muted flex items-center justify-between mt-0.5">
        <span>{data.ip || '192.168.x.x'}</span>
        <span className="text-[9px] uppercase text-zinc-500">{data.id}</span>
      </div>

      {/* Footer: Zone & Status */}
      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px]">
        <span className="text-muted uppercase">{data.zone}</span>
        <span className={data.criticality === 'CRITICAL' ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
          {data.criticality}
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-crimson !w-1.5 !h-1.5 !border-0" />
    </div>
  );
};

export interface DefenseGraphCanvasProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  simulation?: DefenseSimulationResponse | null;
  activeActionType?: DefenseActionType;
  targetEntity?: string;
  entryNode?: string;
  crownJewelTarget?: string;
  className?: string;
}

export const DefenseGraphCanvas: React.FC<DefenseGraphCanvasProps> = ({
  nodes,
  edges,
  simulation,
  activeActionType = 'WORKSTATION_ISOLATION',
  targetEntity,
  entryNode = 'srv-web-01',
  crownJewelTarget = 'db-prod-01',
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'BEFORE' | 'AFTER' | 'DIFF'>('AFTER');
  const nodeTypes = useMemo(() => ({ defenseNode: DefenseSimNode }), []);

  // Compute Layout Positions (layered grid or circular)
  const flowNodes: Node[] = useMemo(() => {
    const zoneColumns: Record<string, number> = {
      DMZ: 100,
      APPLICATION: 400,
      INTERNAL: 700,
      DATABASE: 1000,
      MANAGEMENT: 700,
    };

    const zoneCounters: Record<string, number> = {};

    return nodes.map((node) => {
      const zone = node.zone || 'INTERNAL';
      const colX = zoneColumns[zone] || 400;
      const count = zoneCounters[zone] || 0;
      zoneCounters[zone] = count + 1;
      const rowY = 80 + count * 130;

      const isCompromised = node.id === entryNode || node.compromised;
      const isCrownJewel = node.id === crownJewelTarget || node.criticality === 'CRITICAL';
      const isTargetAction = targetEntity === node.id;

      // Simulation effect flags
      let isIsolated = false;
      let isMonitored = false;

      if (simulation && (viewMode === 'AFTER' || viewMode === 'DIFF')) {
        if (simulation.action_type === 'WORKSTATION_ISOLATION' && simulation.target_entity === node.id) {
          isIsolated = true;
        }
        if (simulation.action_type === 'ENHANCED_MONITORING' && simulation.target_entity === node.id) {
          isMonitored = true;
        }
      }

      return {
        id: node.id,
        type: 'defenseNode',
        position: { x: colX, y: rowY },
        data: {
          ...node,
          isCompromised,
          isCrownJewel,
          isIsolated,
          isMonitored,
          isTargetAction,
        },
      };
    });
  }, [nodes, simulation, viewMode, entryNode, crownJewelTarget, targetEntity]);

  // Compute Flow Edges with Severed / Blocked / Normal states
  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((edge, idx) => {
      const edgeKey = `${edge.source}->${edge.target}`;
      const isTargetRestrictedEdge = 
        activeActionType === 'CONNECTION_RESTRICTION' && 
        (targetEntity === edgeKey || targetEntity === `${edge.source}_to_${edge.target}`);
      
      const isTargetSessionRevoked = 
        activeActionType === 'SESSION_REVOCATION' && 
        (targetEntity === edgeKey || targetEntity === `${edge.source}_to_${edge.target}`);

      const isIsolatedNodeIncident = 
        simulation?.action_type === 'WORKSTATION_ISOLATION' && 
        (edge.source === simulation.target_entity || edge.target === simulation.target_entity);

      const isSeveredInSimulation = 
        (viewMode === 'AFTER' || viewMode === 'DIFF') && 
        (isIsolatedNodeIncident || isTargetRestrictedEdge || isTargetSessionRevoked);

      if (isSeveredInSimulation) {
        return {
          id: edge.id || `edge-${edge.source}-${edge.target}-${idx}`,
          source: edge.source,
          target: edge.target,
          animated: false,
          label: '[BLOCKED]',
          labelStyle: { fill: '#F02D46', fontWeight: 800, fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#1a0508', stroke: '#F02D46', strokeWidth: 1 },
          style: {
            stroke: '#52525B',
            strokeWidth: 2,
            strokeDasharray: '6,6',
            opacity: 0.45,
          },
        };
      }

      // Default baseline edge or remaining vector
      const isLikelyAttackCorridor = 
        (edge.source === entryNode || edge.target === crownJewelTarget || edge.source === 'srv-app-01');

      return {
        id: edge.id || `edge-${edge.source}-${edge.target}-${idx}`,
        source: edge.source,
        target: edge.target,
        animated: isLikelyAttackCorridor && viewMode === 'BEFORE',
        label: `${edge.protocol || 'TCP'}:${edge.port || 443}`,
        labelStyle: { fill: '#919198', fontSize: 9, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#101013', fillOpacity: 0.8 },
        style: {
          stroke: isLikelyAttackCorridor ? (viewMode === 'BEFORE' ? '#F02D46' : '#E2E2E5') : '#404048',
          strokeWidth: isLikelyAttackCorridor ? 2 : 1.2,
          opacity: 0.8,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isLikelyAttackCorridor ? (viewMode === 'BEFORE' ? '#F02D46' : '#E2E2E5') : '#71717A',
        },
      };
    });
  }, [edges, simulation, viewMode, activeActionType, targetEntity, entryNode, crownJewelTarget]);

  return (
    <OmenPanel className={`space-y-3 ${className}`}>
      {/* Visualizer Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            INTERACTIVE GRAPH SIMULATION ENGINE
          </h3>
        </div>

        {/* View mode toggle: BEFORE vs AFTER vs DIFF */}
        <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-lg font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setViewMode('BEFORE')}
            className={`px-2.5 py-1 rounded transition-all font-bold ${
              viewMode === 'BEFORE'
                ? 'bg-crimson text-white shadow'
                : 'text-muted hover:text-white'
            }`}
          >
            BEFORE (BASELINE)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('AFTER')}
            className={`px-2.5 py-1 rounded transition-all font-bold ${
              viewMode === 'AFTER'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-muted hover:text-white'
            }`}
          >
            AFTER (SIMULATED)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('DIFF')}
            className={`px-2.5 py-1 rounded transition-all font-bold ${
              viewMode === 'DIFF'
                ? 'bg-amber-500 text-black shadow'
                : 'text-muted hover:text-white'
            }`}
          >
            DIFF OVERLAY
          </button>
        </div>
      </div>

      {/* React Flow Viewport */}
      <div className="w-full h-[480px] bg-[#050506] rounded-xl overflow-hidden relative border border-white/10">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={1.8}
        >
          <Background color="#101013" gap={24} size={1} />
          <Controls className="!bg-[#101013] !border !border-white/15 !rounded-xl !fill-white !text-white" />
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.isIsolated) return '#F59E0B';
              if (n.data?.isCompromised) return '#F02D46';
              if (n.data?.isCrownJewel) return '#EAB308';
              return '#27272A';
            }}
            maskColor="rgba(5, 5, 6, 0.85)"
            className="!bg-[#101013] !border !border-white/10 !rounded-xl !bottom-3 !right-3"
          />
        </ReactFlow>

        {/* Dynamic Status Legend & Banner */}
        <div className="absolute top-3 left-3 bg-[#101013]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-[10px] space-y-1.5 shadow-xl max-w-xs">
          <div className="text-chrome font-bold uppercase tracking-wider flex items-center justify-between">
            <span>GRAPH TOPOLOGY STATUS</span>
            <span className="text-[9px] text-muted">{viewMode} MODE</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-crimson animate-pulse" />
            <span>Compromised Foothold ({entryNode})</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Crown Jewel ({crownJewelTarget})</span>
          </div>
          {viewMode !== 'BEFORE' && (
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span className="w-2.5 h-2.5 rounded border border-dashed border-amber-400 bg-amber-400/20" />
              <span>Simulated Containment / Neutralized Links</span>
            </div>
          )}
        </div>
      </div>
    </OmenPanel>
  );
};
