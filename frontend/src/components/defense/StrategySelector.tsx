import React from 'react';
import { 
  Lock, 
  Network, 
  KeyRound, 
  Eye, 
  Sliders, 
  Play, 
  ShieldCheck,
  Info
} from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenButton } from '../ui/OmenButton';
import { NetworkNode, NetworkEdge, DefenseActionType } from '../../types';

export interface StrategySelectorProps {
  actionType: DefenseActionType;
  onChangeActionType: (type: DefenseActionType) => void;
  targetEntity: string;
  onChangeTargetEntity: (entity: string) => void;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  riskWeight: number;
  onChangeRiskWeight: (val: number) => void;
  disruptionWeight: number;
  onChangeDisruptionWeight: (val: number) => void;
  onExecuteSimulation: () => void;
  isSimulating: boolean;
  className?: string;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({
  actionType,
  onChangeActionType,
  targetEntity,
  onChangeTargetEntity,
  nodes,
  edges,
  riskWeight,
  onChangeRiskWeight,
  disruptionWeight,
  onChangeDisruptionWeight,
  onExecuteSimulation,
  isSimulating,
  className = '',
}) => {
  const isEdgeBased = actionType === 'CONNECTION_RESTRICTION' || actionType === 'SESSION_REVOCATION';

  return (
    <OmenPanel className={`space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-chrome">
            RESPONSE STRATEGY & PARAMETER CONFIGURATION
          </h3>
        </div>
        <span className="font-mono text-[10px] text-muted">
          SANDBOX ISOLATED // ZERO PRODUCTION TOUCH
        </span>
      </div>

      {/* 4 Action Archetype Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => {
            onChangeActionType('WORKSTATION_ISOLATION');
            if (isEdgeBased && nodes.length > 0) onChangeTargetEntity(nodes[0].id);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            actionType === 'WORKSTATION_ISOLATION'
              ? 'border-crimson bg-crimson/15 shadow-[0_0_15px_rgba(177,15,41,0.25)] text-primary'
              : 'border-border bg-background hover:border-chrome/40 text-secondary'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-crimson" />
            <span className="font-heading text-xs font-bold uppercase">ACTION A</span>
          </div>
          <div className="font-sans text-xs font-semibold text-primary">Node Isolation</div>
          <div className="font-mono text-[10px] text-muted mt-0.5">Sever all ingress/egress</div>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeActionType('CONNECTION_RESTRICTION');
            if (!isEdgeBased && edges.length > 0) onChangeTargetEntity(`${edges[0].source}->${edges[0].target}`);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            actionType === 'CONNECTION_RESTRICTION'
              ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-primary'
              : 'border-border bg-background hover:border-chrome/40 text-secondary'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-amber-400" />
            <span className="font-heading text-xs font-bold uppercase">ACTION B</span>
          </div>
          <div className="font-sans text-xs font-semibold text-primary">Connection Restriction</div>
          <div className="font-mono text-[10px] text-muted mt-0.5">Sever specific directed edge</div>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeActionType('SESSION_REVOCATION');
            if (!isEdgeBased && edges.length > 0) onChangeTargetEntity(`${edges[0].source}->${edges[0].target}`);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            actionType === 'SESSION_REVOCATION'
              ? 'border-purple-500 bg-purple-500/15 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-primary'
              : 'border-border bg-background hover:border-chrome/40 text-secondary'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <span className="font-heading text-xs font-bold uppercase">ACTION C</span>
          </div>
          <div className="font-sans text-xs font-semibold text-primary">Session Revocation</div>
          <div className="font-mono text-[10px] text-muted mt-0.5">Revoke token/permission edge</div>
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeActionType('ENHANCED_MONITORING');
            if (isEdgeBased && nodes.length > 0) onChangeTargetEntity(nodes[0].id);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            actionType === 'ENHANCED_MONITORING'
              ? 'border-cyan-500 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-primary'
              : 'border-border bg-background hover:border-chrome/40 text-secondary'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="font-heading text-xs font-bold uppercase">ACTION D</span>
          </div>
          <div className="font-sans text-xs font-semibold text-primary">Enhanced Monitoring</div>
          <div className="font-mono text-[10px] text-muted mt-0.5">0% downtime honeypot/sensor</div>
        </button>
      </div>

      {/* Target Selector & Objective Weight Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Target Entity Select */}
        <div className="md:col-span-6 space-y-1.5 font-mono text-xs">
          <label className="text-[10px] text-muted uppercase flex items-center justify-between">
            <span>TARGET ENTITY FOR {actionType.replace('_', ' ')}</span>
            <span className="text-secondary font-bold">
              {isEdgeBased ? 'DIRECTED EDGE' : 'NETWORK NODE'}
            </span>
          </label>

          {isEdgeBased ? (
            <select
              value={targetEntity}
              onChange={(e) => onChangeTargetEntity(e.target.value)}
              className="w-full bg-background border border-border text-primary font-mono text-xs p-2.5 rounded-lg focus:border-crimson focus:outline-none"
            >
              {edges.map((edge) => {
                const edgeKey = `${edge.source}->${edge.target}`;
                return (
                  <option key={edge.id || edgeKey} value={edgeKey}>
                    {edge.source} ➔ {edge.target} ({edge.protocol || 'TCP'}:{edge.port || 443} - {edge.relationship_type || 'COMMUNICATES_WITH'})
                  </option>
                );
              })}
            </select>
          ) : (
            <select
              value={targetEntity}
              onChange={(e) => onChangeTargetEntity(e.target.value)}
              className="w-full bg-background border border-border text-primary font-mono text-xs p-2.5 rounded-lg focus:border-crimson focus:outline-none"
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.id}) • {node.zone} • {node.criticality}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Weights Configuration */}
        <div className="md:col-span-3 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted">RISK WEIGHT: {riskWeight.toFixed(2)}</span>
            <span className="text-muted">DISRUPTION: {disruptionWeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={riskWeight}
            onChange={(e) => {
              const rw = parseFloat(e.target.value);
              onChangeRiskWeight(rw);
              onChangeDisruptionWeight(parseFloat((1 - rw).toFixed(2)));
            }}
            className="w-full accent-crimson cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted">
            <span>Favor Availability</span>
            <span>Favor Containment</span>
          </div>
        </div>

        {/* Execute Simulation CTA */}
        <div className="md:col-span-3">
          <OmenButton
            variant="primary"
            size="md"
            className="w-full"
            onClick={onExecuteSimulation}
            loading={isSimulating}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Run Isolated Simulation
          </OmenButton>
        </div>
      </div>
    </OmenPanel>
  );
};
