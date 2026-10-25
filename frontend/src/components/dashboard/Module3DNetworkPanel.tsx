import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, ShieldAlert, Laptop, Server, Database, Router } from 'lucide-react';
import { Network3DGraph } from '../network/Network3DGraph';
import { NetworkNode, NetworkEdge } from '../../types';

export interface Module3DNetworkPanelProps {
  nodes?: NetworkNode[];
  edges?: NetworkEdge[];
  className?: string;
}

export const Module3DNetworkPanel: React.FC<Module3DNetworkPanelProps> = ({
  nodes: propNodes,
  edges: propEdges,
  className = '',
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ws-001');

  // Fallback realistic topology matching reference image if not loaded
  const defaultNodes: NetworkNode[] = [
    {
      id: 'ws-001',
      name: 'WS-001',
      device_type: 'workstation',
      zone: 'USER_LAN',
      ip: '192.168.1.45',
      os: 'Windows 11',
      criticality: 'HIGH',
      security_status: 'COMPROMISED',
      compromised: true,
      isolated: false,
      vulnerabilities: ['CVE-2024-21413'],
      vuln_score: 8.4,
      detections_count: 12,
      last_seen: '2 minutes ago',
    },
    {
      id: 'app-01',
      name: 'APP-01',
      device_type: 'server',
      zone: 'DMZ',
      ip: '10.0.4.12',
      os: 'Ubuntu 22.04',
      criticality: 'HIGH',
      security_status: 'SUSPICIOUS',
      compromised: false,
      isolated: false,
      vulnerabilities: [],
      vuln_score: 5.2,
      detections_count: 3,
      last_seen: '1 minute ago',
    },
    {
      id: 'db-core',
      name: 'DB-CORE',
      device_type: 'database',
      zone: 'RESTRICTED_DATA',
      ip: '10.0.10.88',
      os: 'RHEL 9.1',
      criticality: 'CRITICAL',
      security_status: 'COMPROMISED',
      compromised: true,
      isolated: false,
      vulnerabilities: ['CVE-2023-48795'],
      vuln_score: 9.6,
      detections_count: 18,
      last_seen: 'Just now',
    },
    {
      id: 'file-01',
      name: 'FILE-01',
      device_type: 'server',
      zone: 'INTERNAL',
      ip: '10.0.2.5',
      os: 'Windows Server 2022',
      criticality: 'MEDIUM',
      security_status: 'SECURE',
      compromised: false,
      isolated: false,
      vulnerabilities: [],
      vuln_score: 2.1,
      detections_count: 1,
      last_seen: '5 minutes ago',
    },
    {
      id: 'dc-01',
      name: 'DC-01',
      device_type: 'domain_controller',
      zone: 'RESTRICTED',
      ip: '10.0.0.1',
      os: 'Windows Server 2022',
      criticality: 'CRITICAL',
      security_status: 'SECURE',
      compromised: false,
      isolated: false,
      vulnerabilities: [],
      vuln_score: 1.5,
      detections_count: 0,
      last_seen: 'Just now',
    },
  ];

  const defaultEdges: NetworkEdge[] = [
    { source: 'ws-001', target: 'app-01', protocol: 'TCP/443', port: 443, weight: 1, risk_weight: 0.85 },
    { source: 'app-01', target: 'db-core', protocol: 'TCP/5432', port: 5432, weight: 1, risk_weight: 0.92 },
    { source: 'app-01', target: 'file-01', protocol: 'SMB/445', port: 445, weight: 1, risk_weight: 0.45 },
    { source: 'file-01', target: 'db-core', protocol: 'TCP/5432', port: 5432, weight: 1, risk_weight: 0.78 },
    { source: 'dc-01', target: 'file-01', protocol: 'LDAP/389', port: 389, weight: 1, risk_weight: 0.3 },
  ];

  const nodes = propNodes && propNodes.length > 0 ? propNodes : defaultNodes;
  const edges = propEdges && propEdges.length > 0 ? propEdges : defaultEdges;

  const selectedNode = nodes.find((n) => n.id.toLowerCase() === selectedNodeId.toLowerCase()) || nodes[0];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header (03 MODULE 2 — 3D NETWORK EXPLORATION MODE) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-technical text-xs font-bold text-[#F02D46] px-2 py-0.5 rounded bg-[#F02D46]/10 border border-[#F02D46]/30">
            03
          </span>
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              MODULE 2 — 3D NETWORK EXPLORATION MODE
            </h3>
            <p className="font-technical text-[10px] text-[#919198]">
              Interactive 3D topology with real backend data
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/network')}
          className="font-technical text-xs text-[#F02D46] hover:text-white flex items-center gap-1 group transition-colors"
        >
          <span>FULL GRAPH</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Panel Box */}
      <div className="rounded-2xl bg-[#101013]/90 backdrop-blur-xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.7)] p-4 space-y-3 font-technical">
        {/* Controls Row: Mode Toggle + Search Assets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === '3D'
                  ? 'bg-[#F02D46] text-white shadow-[0_0_15px_rgba(240,45,70,0.5)]'
                  : 'bg-[#18181D] text-[#919198] hover:text-white border border-white/10'
              }`}
            >
              3D Mode
            </button>
            <button
              onClick={() => {
                setViewMode('2D');
                navigate('/network');
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === '2D'
                  ? 'bg-[#F02D46] text-white'
                  : 'bg-[#18181D] text-[#919198] hover:text-white border border-white/10'
              }`}
            >
              2D Mode
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0A0D] border border-white/10 text-xs">
            <Search className="w-3.5 h-3.5 text-[#919198]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="bg-transparent text-[#F5F5F5] placeholder-[#919198] text-xs focus:outline-none w-32 sm:w-44"
            />
          </div>
        </div>

        {/* Device Type Legend Pills */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#919198] border-b border-white/5 pb-2.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            Workstation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
            Server
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            Database
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A1A1AA]" />
            Network Device
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            Suspicious
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F02D46] animate-pulse" />
            Critical
          </span>
        </div>

        {/* Viewport: 3D Canvas on Left + Asset Details on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* 3D Network Topology Viewport (Cols 1-8) */}
          <div className="lg:col-span-8 relative h-[360px] rounded-xl overflow-hidden bg-[#050507] border border-white/10">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,rgba(240,45,70,0.15),transparent_70%)] pointer-events-none" />

            <Network3DGraph
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={(n) => setSelectedNodeId(n.id)}
              className="w-full h-full"
            />

            {/* In-canvas Label Overlay mimicking screenshot */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#0A0A0D]/80 border border-white/10 text-[10px] text-[#919198] font-mono pointer-events-none">
              <span>TOPOLOGY RADAR: 5 NODES ACTIVE</span>
            </div>
          </div>

          {/* Right Asset Details Card (Cols 9-12) */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-[#0A0A0D]/80 border border-white/10 space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-technical text-[10px] text-[#919198] uppercase tracking-wider">
                Asset Details
              </span>
              <span className="w-2 h-2 rounded-full bg-[#F02D46] animate-ping" />
            </div>

            {/* Asset Avatar & Title */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#F02D46]/40 to-[#0A0A0D] border border-[#F02D46]/60 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(240,45,70,0.3)]">
                <Laptop className="w-6 h-6 text-[#F02D46]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading text-sm font-bold text-[#F5F5F5] truncate">
                    {selectedNode.name || 'WS-001'}
                  </h4>
                  <span className="font-technical text-[9px] px-1.5 py-0.5 rounded bg-[#F02D46]/20 text-[#F02D46] border border-[#F02D46]/40 font-bold">
                    {selectedNode.security_status === 'COMPROMISED' ? 'HIGH RISK' : selectedNode.criticality || 'MONITORED'}
                  </span>
                </div>
                <p className="font-technical text-[11px] text-[#919198] capitalize">
                  {selectedNode.device_type || 'Workstation'}
                </p>
              </div>
            </div>

            {/* Spec List */}
            <div className="space-y-2 text-xs font-technical pt-1">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[#919198]">IP Address</span>
                <span className="text-[#F5F5F5] font-mono">{selectedNode.ip || '192.168.1.45'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[#919198]">OS</span>
                <span className="text-[#F5F5F5]">{selectedNode.os || 'Windows 11'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[#919198]">Connections</span>
                <span className="text-[#F5F5F5] font-mono">7</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[#919198]">Detections</span>
                <span className="text-[#F02D46] font-bold font-mono">
                  {selectedNode.detections_count ?? 12}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#919198]">Last Seen</span>
                <span className="text-[#919198]">{selectedNode.last_seen || '2 minutes ago'}</span>
              </div>
            </div>

            {/* View Correlated Incidents Button */}
            <button
              onClick={() => navigate('/incidents')}
              className="w-full py-2 px-3 rounded-xl bg-[#18181D] hover:bg-[#F02D46]/20 border border-white/10 hover:border-[#F02D46]/50 text-xs text-[#F5F5F5] hover:text-white transition-all flex items-center justify-center gap-1.5 group"
            >
              <span>View Correlated Incidents</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
