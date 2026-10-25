import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  Terminal, 
  Download, 
  X,
  ExternalLink,
  Info
} from 'lucide-react';
import { DetectionRecordItem, StructuredThreatAlert } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';
import { OmenButton } from '../ui/OmenButton';

interface DetectionInspectorProps {
  event: DetectionRecordItem | StructuredThreatAlert | null;
  onClose?: () => void;
}

export const DetectionInspector: React.FC<DetectionInspectorProps> = ({ event, onClose }) => {
  if (!event) {
    return (
      <OmenPanel className="p-6 text-center text-muted font-mono text-xs">
        <Info className="w-6 h-6 mx-auto mb-2 text-muted/60" />
        Select a threat event from the telemetry log to inspect neural inference metrics and feature weights.
      </OmenPanel>
    );
  }

  // Normalize between DetectionRecordItem and StructuredThreatAlert
  const isAlert = 'model_scores' in event;
  const eventId = isAlert ? event.event_id : event.detection_id;
  const status = event.threat_status;
  const category = isAlert ? event.attack_category : (event.detected_attack_cat || 'Normal Baseline');
  const severity = isAlert ? event.severity : event.alert_severity;
  const rfScore = isAlert ? event.model_scores.rf_probability : event.rf_score;
  const mlpScore = isAlert ? event.model_scores.mlp_probability : event.mlp_score;
  const anomalyScore = isAlert ? event.model_scores.anomaly_index : event.anomaly_score;
  const decisionRule = event.decision_rule;
  const evidence = isAlert ? event.supporting_evidence : event.supporting_evidence;
  const explanation = isAlert ? event.explanation : undefined;

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(event, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OMEN_FORENSIC_${eventId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <OmenPanel className="space-y-5" glowing={status === 'MALICIOUS'}>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
              FORENSIC TELEMETRY INSPECTOR
            </span>
            <OmenBadge 
              variant={status === 'MALICIOUS' ? 'crimson' : status === 'SUSPICIOUS' ? 'amber' : 'success'}
              size="sm"
            >
              {status}
            </OmenBadge>
          </div>
          <h3 className="font-heading text-lg font-bold text-primary flex items-center gap-2">
            <span>{eventId}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportJson}
            className="p-1.5 bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-chrome text-xs"
            title="Export JSON Dossier"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 bg-surface hover:bg-surface-elevated border border-border text-muted hover:text-chrome"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Model Probabilities Triad */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-background border border-border">
          <span className="font-mono text-[9px] text-muted uppercase block mb-1">RANDOM FOREST</span>
          <div className="font-heading text-base font-extrabold text-primary">
            {rfScore !== null && rfScore !== undefined ? `${(rfScore * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="w-full bg-surface-elevated h-1 mt-1.5 overflow-hidden">
            <div 
              className="bg-crimson h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, (rfScore || 0) * 100))}%` }} 
            />
          </div>
        </div>

        <div className="p-3 bg-background border border-border">
          <span className="font-mono text-[9px] text-muted uppercase block mb-1">MLP PYTORCH</span>
          <div className="font-heading text-base font-extrabold text-primary">
            {mlpScore !== null && mlpScore !== undefined ? `${(mlpScore * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="w-full bg-surface-elevated h-1 mt-1.5 overflow-hidden">
            <div 
              className="bg-crimson-glow h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, (mlpScore || 0) * 100))}%` }} 
            />
          </div>
        </div>

        <div className="p-3 bg-background border border-border">
          <span className="font-mono text-[9px] text-muted uppercase block mb-1">ISOLATION FOREST</span>
          <div className="font-heading text-base font-extrabold text-amber-400">
            {anomalyScore !== null && anomalyScore !== undefined ? anomalyScore.toFixed(3) : '—'}
          </div>
          <div className="w-full bg-surface-elevated h-1 mt-1.5 overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, (anomalyScore || 0) * 100))}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Decision Attribution & Explanation */}
      <div className="p-3 bg-background border border-border space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-muted uppercase">DECISION RULE ENGINE:</span>
          <span className="text-crimson font-bold">{decisionRule}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-muted uppercase">CLASSIFIED ATTACK CATEGORY:</span>
          <span className="text-primary font-bold">{category}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-muted uppercase">SEVERITY RATING:</span>
          <span className="text-crimson-glow font-bold">{severity}</span>
        </div>
        {explanation && (
          <p className="font-sans text-xs text-secondary mt-2 border-t border-border pt-2 leading-relaxed">
            {explanation}
          </p>
        )}
      </div>

      {/* Supporting Evidence Features */}
      {evidence && Object.keys(evidence).length > 0 && (
        <div className="space-y-2">
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">
            KEY NETWORK TELEMETRY FEATURES (UNSW-NB15)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]">
            {Object.entries(evidence).slice(0, 9).map(([key, value]) => (
              <div key={key} className="p-2 bg-surface border border-border/80 flex flex-col justify-between">
                <span className="text-muted truncate">{key}</span>
                <span className="text-primary font-bold truncate mt-0.5">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </OmenPanel>
  );
};
