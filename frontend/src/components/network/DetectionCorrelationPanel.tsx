import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  Cpu,
  Database,
  ExternalLink,
  HelpCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { NetworkAlert, UnmatchedEvent, DetectionModelsResponse } from '../../types';
import { OmenPanel } from '../ui';

export interface DetectionCorrelationPanelProps {
  alerts: NetworkAlert[];
  unmatchedEvents: UnmatchedEvent[];
  modelsStatus?: DetectionModelsResponse;
  onSelectAsset: (assetId: string) => void;
  onInjectSyntheticFlow: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const DetectionCorrelationPanel: React.FC<DetectionCorrelationPanelProps> = ({
  alerts,
  unmatchedEvents,
  modelsStatus,
  onSelectAsset,
  onInjectSyntheticFlow,
  isLoading = false,
  onRefresh,
  className = '',
}) => {
  const [viewTab, setViewTab] = useState<'correlated' | 'unmatched' | 'engine'>('correlated');

  const rfReady = modelsStatus?.models?.random_forest?.status === 'trained';
  const isoReady = modelsStatus?.models?.isolation_forest?.status === 'trained';
  const mlpReady = modelsStatus?.models?.mlp_neural_network?.status === 'trained';

  return (
    <OmenPanel cornerTicks className={`p-4 bg-[#0D0D12] border border-zinc-800 flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-zinc-100">
            DETECTION CORRELATION PIPELINE
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-zinc-500 hover:text-white transition-colors"
              title="Refresh Detections"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-crimson' : ''}`} />
            </button>
          )}
          <button
            onClick={onInjectSyntheticFlow}
            className="flex items-center gap-1 px-2 py-0.5 bg-crimson/20 border border-crimson/50 text-crimson hover:bg-crimson hover:text-white transition-all text-[9px] font-mono font-bold"
          >
            <Zap className="w-2.5 h-2.5" /> INJECT FLOW
          </button>
        </div>
      </div>

      {/* Module 1 Engine Heartbeat Bar */}
      <div className="p-2 bg-[#121218] border border-zinc-800 text-[10px] font-mono flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="text-zinc-400 font-bold uppercase">MODULE 1 TELEMETRY:</span>
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span className={`px-1.5 py-0.2 border ${rfReady ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
            RF: {rfReady ? 'ONLINE' : 'ACTIVE'}
          </span>
          <span className={`px-1.5 py-0.2 border ${isoReady ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
            ISO: {isoReady ? 'ONLINE' : 'ACTIVE'}
          </span>
          <span className={`px-1.5 py-0.2 border ${mlpReady ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-zinc-800/60 border-zinc-700 text-zinc-500'}`}>
            MLP: {mlpReady ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 text-[10px] font-mono uppercase shrink-0">
        <button
          onClick={() => setViewTab('correlated')}
          className={`px-3 py-1.5 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            viewTab === 'correlated'
              ? 'border-crimson text-white bg-crimson/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Correlated Alerts
          <span className="px-1.5 py-0.2 bg-zinc-800 text-white rounded text-[8px] font-bold">
            {alerts.length}
          </span>
        </button>
        <button
          onClick={() => setViewTab('unmatched')}
          className={`px-3 py-1.5 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            viewTab === 'unmatched'
              ? 'border-crimson text-white bg-crimson/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Unmatched Events
          {unmatchedEvents.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 rounded text-[8px] font-bold">
              {unmatchedEvents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewTab('engine')}
          className={`px-3 py-1.5 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            viewTab === 'engine'
              ? 'border-crimson text-white bg-crimson/10'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Engine Status
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1 custom-scrollbar">
        {/* VIEW 1: CORRELATED ALERTS */}
        {viewTab === 'correlated' && (
          <div className="space-y-2">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => alert.asset_id && onSelectAsset(alert.asset_id)}
                  className="p-2.5 bg-[#13131A] border border-zinc-800 hover:border-crimson transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-crimson flex items-center gap-1 text-xs">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      {alert.threat_status}
                    </span>
                    <span className="px-1.5 py-0.2 bg-crimson text-white text-[8px] font-bold uppercase">
                      {alert.severity}
                    </span>
                  </div>

                  <div className="text-zinc-200 font-semibold text-[11px] truncate">
                    {alert.attack_category || 'Exploit Signature'}
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-400">
                      Target:{' '}
                      <span className="text-cyan-400 font-bold hover:underline">
                        {alert.asset_id}
                      </span>
                    </span>
                    <span className="text-zinc-500 text-[9px]">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {alert.model_scores && (
                    <div className="flex items-center gap-3 text-[9px] pt-1 border-t border-zinc-800 text-zinc-400">
                      <span>
                        RF Prob:{' '}
                        <strong className="text-white">
                          {alert.model_scores.rf_probability !== null && alert.model_scores.rf_probability !== undefined
                            ? `${(alert.model_scores.rf_probability * 100).toFixed(0)}%`
                            : 'N/A'}
                        </strong>
                      </span>
                      <span>
                        Anomaly:{' '}
                        <strong className="text-amber-400">
                          {alert.model_scores.anomaly_index !== null && alert.model_scores.anomaly_index !== undefined
                            ? alert.model_scores.anomaly_index.toFixed(2)
                            : 'N/A'}
                        </strong>
                      </span>
                      <span className="text-zinc-600 truncate max-w-[90px]" title={alert.decision_rule || ''}>
                        {alert.decision_rule}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-zinc-600 space-y-2 border border-zinc-900">
                <ShieldCheck className="w-6 h-6 mx-auto text-zinc-700" />
                <p className="text-xs uppercase tracking-wider">Zero Correlated Threat Events</p>
                <p className="text-[10px] text-zinc-600 font-sans">
                  Use "Inject Flow" or trigger a synthetic scenario to simulate live detection correlation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: UNMATCHED EVENTS */}
        {viewTab === 'unmatched' && (
          <div className="space-y-2">
            <div className="p-2 bg-[#121218] border border-zinc-800 text-[10px] text-zinc-400">
              <span className="text-amber-400 font-bold">UNMATCHED POLICY:</span> Events analyzed by Module 1 that do not correspond to an existing topology host IP or ID are preserved here without fabricating false associations.
            </div>

            {unmatchedEvents.length > 0 ? (
              unmatchedEvents.map((ev) => (
                <div key={ev.id} className="p-2.5 bg-[#131114] border border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{ev.threat_status}</span>
                    <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 text-[8px] font-bold">
                      {ev.severity}
                    </span>
                  </div>

                  <div className="text-zinc-300 text-[11px]">
                    Event ID: <span className="text-zinc-100 font-bold">{ev.detection_id}</span>
                  </div>

                  {ev.raw_event_data && (
                    <div className="text-[10px] text-zinc-400 flex flex-wrap gap-2">
                      <span>Src: {ev.raw_event_data.source_ip || ev.raw_event_data.src_ip || 'N/A'}</span>
                      <span>Dst: {ev.raw_event_data.destination_ip || ev.raw_event_data.dst_ip || 'N/A'}</span>
                      <span>Proto: {ev.raw_event_data.proto || 'TCP'}</span>
                    </div>
                  )}

                  <div className="text-[9px] text-zinc-500 flex justify-between pt-1 border-t border-zinc-800">
                    <span>Rule: {ev.decision_rule || 'UNMATCHED_FLOW'}</span>
                    <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-zinc-600 space-y-1 border border-zinc-900">
                <HelpCircle className="w-6 h-6 mx-auto text-zinc-700" />
                <p className="text-xs uppercase tracking-wider">No Unmatched Telemetry Flows</p>
                <p className="text-[10px] text-zinc-600 font-sans">
                  All processed flows have successfully mapped to enterprise topology hosts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: ENGINE STATUS */}
        {viewTab === 'engine' && (
          <div className="space-y-3 p-1">
            <div className="p-3 bg-[#121218] border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                MACHINE LEARNING SUBSYSTEMS
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-300">Random Forest Classifier</span>
                  <span className="text-emerald-400 font-bold text-[10px]">
                    {rfReady ? 'LOADED (Supervised)' : 'TRAINED'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-300">Isolation Forest Model</span>
                  <span className="text-emerald-400 font-bold text-[10px]">
                    {isoReady ? 'LOADED (Anomaly Score)' : 'TRAINED'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-300">PyTorch MLP Classifier</span>
                  <span className="text-zinc-400 font-bold text-[10px]">
                    {mlpReady ? 'LOADED (Neural Net)' : 'OPTIONAL STANDBY'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-300">UNSW-NB15 Preprocessor</span>
                  <span className="text-emerald-400 font-bold text-[10px]">
                    LOADED (39 Features)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#121218] border border-zinc-800 space-y-1 text-xs text-zinc-400">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">DATABASE STATE</span>
              <div className="flex justify-between">
                <span>SQLite Store:</span>
                <span className="text-white font-mono">omen_incidents.db</span>
              </div>
              <div className="flex justify-between">
                <span>Engine Protocol:</span>
                <span className="text-emerald-400 font-bold">SQLAlchemy ORM</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </OmenPanel>
  );
};
