import React, { useState } from 'react';
import {
  Network,
  Lock,
  Unlock,
  Info,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Route,
  Activity,
  Layers,
  FileCode,
} from 'lucide-react';
import { NetworkNode } from '../../types';
import { OmenButton, OmenBadge, OmenPanel } from '../ui';

export interface AssetInspectorProps {
  selectedNode: NetworkNode | null;
  isolatedNodes: string[];
  onToggleIsolation: (nodeId: string) => void;
  className?: string;
  onSelectNeighbor?: (nodeId: string) => void;
}

export const AssetInspector: React.FC<AssetInspectorProps> = ({
  selectedNode,
  isolatedNodes,
  onToggleIsolation,
  className = '',
  onSelectNeighbor,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'topology' | 'routes'>('overview');

  if (!selectedNode) {
    return (
      <OmenPanel className={`p-8 text-center text-zinc-500 flex flex-col items-center justify-center space-y-3 bg-[#0D0D12] border border-zinc-800 ${className}`}>
        <Info className="w-8 h-8 text-zinc-600 animate-pulse" />
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          SELECT ANY GRAPH NODE TO INSPECT TELEMETRY
        </p>
        <span className="text-[10px] text-zinc-600 max-w-xs font-sans">
          Click on any workstation, server, database, or identity to reveal topological relationships, security events, and vulnerability paths.
        </span>
      </OmenPanel>
    );
  }

  const isIsolated = isolatedNodes.includes(selectedNode.id) || selectedNode.isolated || selectedNode.security_status === 'ISOLATED';
  const isCompromised = selectedNode.security_status === 'COMPROMISED' || selectedNode.compromised;
  const isSuspicious = selectedNode.security_status === 'SUSPICIOUS';
  const alerts = selectedNode.associated_alerts || [];

  return (
    <OmenPanel cornerTicks className={`p-4 space-y-4 bg-[#0D0D12] border border-zinc-800 flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-zinc-200">
            ASSET INTELLIGENCE
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {isIsolated && (
            <span className="px-2 py-0.5 bg-zinc-800 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
              ISOLATED
            </span>
          )}
          {isCompromised && (
            <OmenBadge variant="crimson" pulse>
              COMPROMISED
            </OmenBadge>
          )}
          {isSuspicious && !isCompromised && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[9px] font-mono font-bold animate-pulse">
              SUSPICIOUS
            </span>
          )}
          {!isCompromised && !isSuspicious && !isIsolated && (
            <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
              SECURE
            </span>
          )}
        </div>
      </div>

      {/* Asset Identifier & Key Metrics */}
      <div className="shrink-0 space-y-1">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">
          PRIMARY IDENTIFIER
        </span>
        <div className="font-heading text-base font-bold text-white tracking-wide truncate">
          {selectedNode.name}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-crimson font-bold">{selectedNode.id}</span>
          <span>•</span>
          <span className="text-zinc-300">{selectedNode.ip || 'UNASSIGNED_IP'}</span>
          <span>•</span>
          <span className="text-zinc-500 uppercase">{selectedNode.zone}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-800 text-[10px] font-mono uppercase shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'overview'
              ? 'border-crimson text-white bg-crimson/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-1.5 border-b-2 font-semibold transition-all flex items-center gap-1 ${
            activeTab === 'alerts'
              ? 'border-crimson text-white bg-crimson/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Alerts
          {alerts.length > 0 && (
            <span className="px-1 py-0.2 bg-crimson text-white text-[8px] rounded-full font-bold">
              {alerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('topology')}
          className={`px-3 py-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'topology'
              ? 'border-crimson text-white bg-crimson/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Neighbors ({((selectedNode.in_neighbors?.length || 0) + (selectedNode.out_neighbors?.length || 0))})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-3 py-1.5 border-b-2 font-semibold transition-all ${
            activeTab === 'routes'
              ? 'border-crimson text-white bg-crimson/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Jewels
        </button>
      </div>

      {/* Tab Contents (Scrollable) */}
      <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1 custom-scrollbar">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Attribute Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#121218] border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block uppercase">ASSET CLASS</span>
                <span className="text-zinc-200 font-bold uppercase">{selectedNode.device_type}</span>
              </div>
              <div className="p-2 bg-[#121218] border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block uppercase">CRITICALITY</span>
                <span
                  className={`font-bold ${
                    selectedNode.criticality === 'CRITICAL'
                      ? 'text-crimson'
                      : selectedNode.criticality === 'HIGH'
                      ? 'text-amber-400'
                      : 'text-zinc-300'
                  }`}
                >
                  {selectedNode.criticality}
                </span>
              </div>
              <div className="p-2 bg-[#121218] border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block uppercase">SUBNET</span>
                <span className="text-zinc-300 text-[11px]">{selectedNode.subnet || 'N/A'}</span>
              </div>
              <div className="p-2 bg-[#121218] border border-zinc-800">
                <span className="text-[9px] text-zinc-500 block uppercase">LAST SEEN</span>
                <span className="text-zinc-400 text-[10px]">
                  {selectedNode.last_activity ? new Date(selectedNode.last_activity).toLocaleTimeString() : 'RECENT'}
                </span>
              </div>
            </div>

            {/* Vulnerability Index Score Bar */}
            <div className="p-3 bg-[#121218] border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-semibold">VULNERABILITY INDEX:</span>
                <span className="text-crimson font-bold text-sm">
                  {(selectedNode.vuln_score * 10).toFixed(1)} / 10.0
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 border border-zinc-800 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-crimson h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, selectedNode.vuln_score * 100)}%` }}
                />
              </div>
            </div>

            {/* Known Exploits & Vulnerabilities */}
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-crimson" />
                EXPLOIT VULNERABILITIES ({selectedNode.vulnerabilities.length})
              </span>
              <div className="space-y-1">
                {selectedNode.vulnerabilities.length > 0 ? (
                  selectedNode.vulnerabilities.map((cve, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-[#14141B] border border-zinc-800/80 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-zinc-200">{cve}</span>
                      <span className="text-[8px] px-1 py-0.2 bg-crimson/20 border border-crimson/40 text-crimson font-bold">
                        EXPLOITABLE
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-[#14141B] border border-zinc-800/60 text-zinc-500 text-[11px]">
                    No known CVE vulnerabilities documented.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CORRELATED DETECTION ALERTS (Module 1 -> Module 2) */}
        {activeTab === 'alerts' && (
          <div className="space-y-2.5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-semibold">
              CORRELATED THREAT ALERTS ({alerts.length})
            </span>
            {alerts.length > 0 ? (
              alerts.map((al, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#141014] border border-crimson/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-crimson flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {al.threat_status}
                    </span>
                    <span className="px-1.5 py-0.2 bg-crimson text-white text-[9px] font-bold">
                      {al.severity}
                    </span>
                  </div>

                  <div className="text-zinc-300 font-semibold text-[11px]">
                    {al.attack_category || 'Anomalous Lateral Behavior'}
                  </div>

                  <div className="text-[10px] text-zinc-400">
                    Rule: <span className="text-zinc-200">{al.decision_rule}</span>
                  </div>

                  {/* Model Scores consensus display */}
                  {al.model_scores && (
                    <div className="grid grid-cols-2 gap-1 p-1.5 bg-[#0A0A0E] border border-zinc-800 text-[9px]">
                      <div>
                        <span className="text-zinc-500">RF Conf: </span>
                        <span className="text-white font-bold">
                          {al.model_scores.rf_probability !== null && al.model_scores.rf_probability !== undefined
                            ? `${(al.model_scores.rf_probability * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Anomaly Idx: </span>
                        <span className="text-amber-400 font-bold">
                          {al.model_scores.anomaly_index !== null && al.model_scores.anomaly_index !== undefined
                            ? al.model_scores.anomaly_index.toFixed(2)
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="text-[9px] text-zinc-500 flex justify-between">
                    <span>ID: {al.detection_id}</span>
                    <span>{new Date(al.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#121218] border border-zinc-800 text-center text-zinc-500 text-xs">
                No active threat detections currently correlated with this asset.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NEIGHBORS & TOPOLOGY */}
        {activeTab === 'topology' && (
          <div className="space-y-3">
            {/* Inbound Connections */}
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1 font-semibold flex items-center gap-1">
                <ArrowLeft className="w-3 h-3 text-cyan-400" />
                INBOUND TRAFFIC SOURCES ({selectedNode.in_neighbors?.length || 0})
              </span>
              <div className="space-y-1">
                {(selectedNode.in_neighbors || []).length > 0 ? (
                  selectedNode.in_neighbors!.map((inN, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectNeighbor && onSelectNeighbor(inN.neighbor_id)}
                      className="p-2 bg-[#121218] border border-zinc-800/80 hover:border-zinc-500 flex items-center justify-between text-[11px] cursor-pointer"
                    >
                      <span className="text-cyan-400 font-bold">{inN.neighbor_id}</span>
                      <span className="text-zinc-400 text-[10px]">
                        {inN.protocol}:{inN.port} ({inN.relationship_type})
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-[#121218] border border-zinc-800/50 text-zinc-500 text-[10px]">
                    No incoming ingress edges configured.
                  </div>
                )}
              </div>
            </div>

            {/* Outbound Connections */}
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1 font-semibold flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-crimson" />
                OUTBOUND DESTINATIONS ({selectedNode.out_neighbors?.length || 0})
              </span>
              <div className="space-y-1">
                {(selectedNode.out_neighbors || []).length > 0 ? (
                  selectedNode.out_neighbors!.map((outN, idx) => (
                    <div
                      key={idx}
                      onClick={() => onSelectNeighbor && onSelectNeighbor(outN.neighbor_id)}
                      className="p-2 bg-[#121218] border border-zinc-800/80 hover:border-zinc-500 flex items-center justify-between text-[11px] cursor-pointer"
                    >
                      <span className="text-crimson font-bold">{outN.neighbor_id}</span>
                      <span className="text-zinc-400 text-[10px]">
                        {outN.protocol}:{outN.port} ({outN.relationship_type})
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-[#121218] border border-zinc-800/50 text-zinc-500 text-[10px]">
                    Terminal sink node (zero outgoing traversal edges).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REACHABLE CROWN JEWELS */}
        {activeTab === 'routes' && (
          <div className="space-y-2.5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-semibold flex items-center gap-1">
              <Route className="w-3 h-3 text-amber-400" />
              REACHABLE CROWN JEWEL TARGETS
            </span>
            {(selectedNode.permitted_routes || []).length > 0 ? (
              selectedNode.permitted_routes!.map((route, idx) => (
                <div key={idx} className="p-2.5 bg-[#121218] border border-zinc-800 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-300">{route.target}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {route.hops} HOPS
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1 overflow-x-auto py-1">
                    {route.path.map((hop, hIdx) => (
                      <React.Fragment key={hIdx}>
                        <span className={hIdx === 0 ? 'text-cyan-400' : hIdx === route.path.length - 1 ? 'text-amber-300 font-bold' : 'text-zinc-300'}>
                          {hop}
                        </span>
                        {hIdx < route.path.length - 1 && <span className="text-zinc-600">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#121218] border border-zinc-800 text-center text-zinc-500 text-xs">
                No direct or lateral route permitted from this host to crown jewel assets.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Isolation Action Button */}
      <div className="pt-2 border-t border-zinc-800 shrink-0">
        <OmenButton
          variant={isIsolated ? 'secondary' : 'primary'}
          size="md"
          onClick={() => onToggleIsolation(selectedNode.id)}
          icon={isIsolated ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          className="w-full text-xs font-mono font-bold tracking-wider"
        >
          {isIsolated ? 'RESTORE FROM QUARANTINE' : 'EXECUTE ZERO-TRUST QUARANTINE'}
        </OmenButton>
        <p className="text-[9px] text-zinc-500 mt-1.5 text-center font-mono">
          Simulated NetworkX topology edge severance; live non-destructive.
        </p>
      </div>
    </OmenPanel>
  );
};
