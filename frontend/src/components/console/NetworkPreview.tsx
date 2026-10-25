import React from 'react';
import { 
  Network, 
  ChevronRight, 
  GitBranch, 
  Server,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NetworkGraphData, AttackPath } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';

interface NetworkPreviewProps {
  topology: NetworkGraphData | null;
  predictedPath: AttackPath | null;
}

export const NetworkPreview: React.FC<NetworkPreviewProps> = ({ topology, predictedPath }) => {
  const navigate = useNavigate();

  return (
    <OmenPanel className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted">
            ENTERPRISE NETWORK TOPOLOGY RADAR
          </h3>
        </div>
        <button
          onClick={() => navigate('/network')}
          className="font-mono text-[11px] text-chrome hover:text-white flex items-center gap-1 group"
        >
          <span>OPEN FULL GRAPH</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Mini Topology Grid Preview */}
      <div className="p-4 bg-background border border-border/70 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 font-mono text-xs">
        {topology?.nodes.map((node) => {
          const isCompromised = node.compromised;
          const isCritical = node.criticality === 'CRITICAL';
          const isIsolated = node.isolated;

          return (
            <div
              key={node.id}
              onClick={() => navigate('/network')}
              className={`chamfer-tr p-3 border transition-colors cursor-pointer ${
                isCompromised
                  ? 'border-crimson bg-crimson/15 text-white'
                  : isIsolated
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                  : isCritical
                  ? 'border-chrome bg-surface-elevated text-chrome font-bold'
                  : 'border-border bg-surface text-secondary hover:border-chrome/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted">{node.zone}</span>
                {isCompromised && (
                  <span className="w-1.5 h-1.5 bg-crimson rounded-full animate-ping" />
                )}
                {isIsolated && (
                  <Lock className="w-2.5 h-2.5 text-amber-400" />
                )}
              </div>
              <div className="font-bold truncate text-[11px] text-primary">{node.name}</div>
              <div className="text-[9px] text-muted">{node.ip}</div>
            </div>
          );
        })}
      </div>

      {/* Attack Path Lateral Movement Forecast Banner */}
      {predictedPath && (
        <div className="p-4 bg-surface-elevated border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-crimson/20 border border-crimson flex items-center justify-center shrink-0">
              <GitBranch className="w-4 h-4 text-crimson-glow" />
            </div>
            <div>
              <span className="text-[10px] text-muted uppercase block">
                ACTIVE LATERAL TRAVERSAL FORECAST
              </span>
              <span className="text-primary font-bold">
                {predictedPath.nodes.join(' → ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] shrink-0">
            <div>
              <span className="text-muted block text-[10px]">RISK SCORE</span>
              <span className="text-crimson-glow font-bold">{predictedPath.risk_score.toFixed(1)}/100</span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">EST. BREACH TIME</span>
              <span className="text-chrome font-bold">{predictedPath.estimated_time_mins} MINS</span>
            </div>
            <button
              onClick={() => navigate('/prediction')}
              className="px-2.5 py-1 bg-surface hover:bg-surface-elevated border border-border text-chrome hover:text-white"
            >
              INVESTIGATE
            </button>
          </div>
        </div>
      )}
    </OmenPanel>
  );
};
