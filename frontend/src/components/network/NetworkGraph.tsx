import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Server,
  Laptop,
  Database as DatabaseIcon,
  Lock,
  Shield,
  Router,
  KeyRound,
  HardDrive,
  UserCheck,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { NetworkNode } from '../../types';

// Custom Stylized React Flow Node Component for ØMEN
const CyberDeviceNode: React.FC<{
  data: NetworkNode & { onSelect?: (node: NetworkNode) => void; highlightedPath?: boolean };
  selected: boolean;
}> = ({ data, selected }) => {
  const isCompromised = data.security_status === 'COMPROMISED' || data.compromised;
  const isSuspicious = data.security_status === 'SUSPICIOUS';
  const isIsolated = data.security_status === 'ISOLATED' || data.isolated;
  const isCritical = data.criticality === 'CRITICAL';
  const isHigh = data.criticality === 'HIGH';
  const alertCount = data.active_alerts_count || (isCompromised ? 1 : 0);

  const getDeviceIcon = () => {
    const type = (data.device_type || data.asset_type || '').toLowerCase();
    switch (type) {
      case 'database':
        return <DatabaseIcon className="w-3.5 h-3.5 text-amber-400" />;
      case 'workstation':
        return <Laptop className="w-3.5 h-3.5 text-zinc-300" />;
      case 'gateway':
        return <Router className="w-3.5 h-3.5 text-cyan-400" />;
      case 'firewall':
        return <Flame className="w-3.5 h-3.5 text-crimson" />;
      case 'domain_controller':
        return <KeyRound className="w-3.5 h-3.5 text-yellow-300" />;
      case 'storage':
        return <HardDrive className="w-3.5 h-3.5 text-blue-400" />;
      case 'identity':
        return <UserCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'switch':
        return <Shield className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Server className="w-3.5 h-3.5 text-zinc-300" />;
    }
  };

  // Border & background styling based on state
  let cardStyle = 'border-border/80 bg-[#0F0F14] text-zinc-300 hover:border-zinc-500';
  if (isIsolated) {
    cardStyle = 'border-dashed border-zinc-700 bg-[#09090D] opacity-45 text-zinc-500';
  } else if (isCompromised) {
    cardStyle = 'border-2 border-crimson bg-[#1A0A0E] text-white shadow-[0_0_20px_rgba(179,18,47,0.4)] animate-pulse';
  } else if (isSuspicious) {
    cardStyle = 'border-2 border-amber-500/80 bg-[#171208] text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.25)]';
  } else if (isCritical) {
    cardStyle = 'border border-zinc-600 bg-[#121218] text-zinc-100 shadow-[0_0_12px_rgba(255,255,255,0.06)]';
  }

  return (
    <div
      onClick={() => data.onSelect && data.onSelect(data)}
      className={`relative px-3.5 py-2.5 min-w-[185px] max-w-[210px] rounded-none transition-all duration-300 cursor-pointer font-mono text-xs ${cardStyle} ${
        selected ? 'ring-2 ring-crimson shadow-[0_0_25px_rgba(179,18,47,0.6)]' : ''
      }`}
    >
      {/* Corner notch accent */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-60" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-60" />

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-zinc-400 !w-1.5 !h-1.5 !border-0"
      />

      {/* Header bar: Device icon, type, status badges */}
      <div className="flex items-center justify-between mb-1.5 gap-1">
        <div className="flex items-center gap-1.5 text-zinc-400">
          {getDeviceIcon()}
          <span className="text-[9px] uppercase tracking-wider font-semibold truncate max-w-[80px]">
            {data.device_type}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isIsolated && (
            <span className="px-1 py-0.2 bg-zinc-800 text-amber-300 text-[8px] font-bold flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> ISO
            </span>
          )}
          {isCompromised && (
            <span className="px-1 py-0.2 bg-crimson text-white text-[8px] font-bold tracking-tight">
              BREACHED
            </span>
          )}
          {isSuspicious && !isCompromised && (
            <span className="px-1 py-0.2 bg-amber-500 text-black text-[8px] font-bold tracking-tight">
              ALERT
            </span>
          )}
          {alertCount > 0 && !isCompromised && !isSuspicious && (
            <span className="px-1 py-0.2 bg-crimson/80 text-white text-[8px] font-bold flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> {alertCount}
            </span>
          )}
        </div>
      </div>

      {/* Node Name & IP */}
      <div className="font-heading font-bold text-xs tracking-wide text-zinc-100 truncate">
        {data.name}
      </div>
      <div className="text-[10px] text-zinc-400 tracking-tight flex items-center justify-between mt-0.5">
        <span>{data.ip || 'NO_IP'}</span>
        <span className="text-[9px] uppercase text-zinc-500">{data.id}</span>
      </div>

      {/* Zone & Criticality footer */}
      <div className="mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[9px]">
        <span className="text-zinc-400 uppercase tracking-wider">{data.zone}</span>
        <span
          className={`font-semibold ${
            isCritical ? 'text-crimson' : isHigh ? 'text-amber-400' : 'text-zinc-400'
          }`}
        >
          {data.criticality}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-crimson !w-1.5 !h-1.5 !border-0"
      />
    </div>
  );
};

export interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onSelectNode?: (node: NetworkNode) => void;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  showMinimap?: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  className = '',
  minZoom = 0.25,
  maxZoom = 2.0,
  showMinimap = true,
}) => {
  const nodeTypes = useMemo(() => ({ cyberDevice: CyberDeviceNode }), []);

  return (
    <div className={`w-full h-full relative overflow-hidden bg-[#0A0A0E] select-none ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={minZoom}
        maxZoom={maxZoom}
        className="bg-[#0A0A0E]"
      >
        <Background color="#1A1A24" gap={28} size={1.2} />
        <Controls className="!bg-[#121218] !border !border-zinc-800 !fill-zinc-300 !text-zinc-300" />
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.security_status === 'COMPROMISED' || node.data?.compromised) return '#B3122F';
              if (node.data?.security_status === 'SUSPICIOUS') return '#D97706';
              if (node.data?.isolated) return '#3F3F46';
              return '#27272A';
            }}
            maskColor="rgba(8, 8, 12, 0.85)"
            className="!bg-[#0D0D12] !border !border-zinc-800 !bottom-3 !right-3"
          />
        )}
      </ReactFlow>
    </div>
  );
};
