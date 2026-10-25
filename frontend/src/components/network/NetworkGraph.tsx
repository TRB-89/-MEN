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

  // Border & background styling based on state (Section 8 — Dark graphite canvas, red illuminated suspicious, chrome normal)
  let cardStyle = 'border border-[#DCDCE0]/15 bg-[#161619]/90 text-[#F5F5F5] hover:border-[#DCDCE0]/40 shadow-[0_4px_16px_rgba(0,0,0,0.6)]';
  if (isIsolated) {
    cardStyle = 'border-dashed border-[#99999F]/30 bg-[#0D0D0F]/80 opacity-50 text-[#99999F]';
  } else if (isCompromised) {
    cardStyle = 'border-2 border-[#FF293F] bg-[#5C0614]/40 text-white shadow-[0_0_25px_rgba(255,41,63,0.45)] animate-pulse';
  } else if (isSuspicious) {
    cardStyle = 'border-2 border-[#F59E0B]/80 bg-[#291800]/50 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.3)]';
  } else if (isCritical) {
    cardStyle = 'border border-[#DCDCE0]/40 bg-[#1A1A1E] text-white shadow-[0_0_15px_rgba(220,220,224,0.1)]';
  }

  return (
    <div
      onClick={() => data.onSelect && data.onSelect(data)}
      className={`relative px-4 py-3 min-w-[190px] max-w-[220px] rounded-2xl transition-all duration-300 cursor-pointer font-technical text-xs backdrop-blur-md ${cardStyle} ${
        selected ? 'ring-2 ring-[#FF293F] shadow-[0_0_30px_rgba(255,41,63,0.6)]' : ''
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
    <div className={`w-full h-full relative overflow-hidden bg-[#050505] select-none ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={minZoom}
        maxZoom={maxZoom}
        className="bg-[#050505]"
      >
        <Background color="#161619" gap={28} size={1.2} />
        <Controls className="!bg-[#161619] !border !border-[#DCDCE0]/15 !rounded-xl !overflow-hidden !fill-[#DCDCE0] !text-[#DCDCE0]" />
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.security_status === 'COMPROMISED' || node.data?.compromised) return '#FF293F';
              if (node.data?.security_status === 'SUSPICIOUS') return '#F59E0B';
              if (node.data?.isolated) return '#52525B';
              return '#161619';
            }}
            maskColor="rgba(5, 5, 5, 0.85)"
            className="!bg-[#0D0D0F] !border !border-[#DCDCE0]/15 !rounded-xl !bottom-4 !right-4"
          />
        )}
      </ReactFlow>
    </div>
  );
};
