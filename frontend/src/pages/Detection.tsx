import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  DetectionModelsResponse,
  DetectionMetricsResponse,
  DetectionHistoryResponse,
  DetectionRecordItem,
  StructuredThreatAlert,
  CSVUploadResponse,
} from '../types';
import { CSVUploader } from '../components/detection/CSVUploader';
import { DetectionResults } from '../components/detection/DetectionResults';
import { PredictionTable } from '../components/detection/PredictionTable';
import { ModelStatusPanel } from '../components/detection/ModelStatusPanel';
import { DetectionMetrics } from '../components/detection/DetectionMetrics';
import { AnomalyScoreChart } from '../components/detection/AnomalyScoreChart';
import { ThreatEventTable } from '../components/detection/ThreatEventTable';
import { DetectionInspector } from '../components/detection/DetectionInspector';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';
import { OmenPanel } from '../components/ui/OmenPanel';
import { OmenButton } from '../components/ui/OmenButton';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Activity,
  Layers,
  Terminal,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  Play,
  FileCode,
  Gauge,
  Sliders,
} from 'lucide-react';
import { useBackend } from '../services/BackendContext';

// Preset network events for rapid SOC validation
const PRESETS = [
  {
    name: 'Exploitation / Shellcode Attack',
    desc: 'Rapid TCP payload delivery to privileged port with high TTL (UNSW-NB15 Exploit)',
    data: {
      event_id: 'EVT-EXPLOIT-091',
      device_id: 'srv-db-01',
      proto: 'tcp',
      service: 'ssh',
      state: 'INT',
      dur: 0.00105,
      sbytes: 1420,
      dbytes: 0,
      sttl: 254,
      dttl: 0,
      rate: 12500.0,
      sload: 5400000.0,
      dload: 0.0,
    },
  },
  {
    name: 'Benign Corporate Web Flow',
    desc: 'Standard TLS session handshake over port 443 with normal symmetric byte ratio',
    data: {
      event_id: 'EVT-BENIGN-443',
      device_id: 'ws-finance-03',
      proto: 'tcp',
      service: 'http',
      state: 'FIN',
      dur: 0.245,
      sbytes: 420,
      dbytes: 3840,
      sttl: 62,
      dttl: 252,
      rate: 142.0,
      sload: 12400.0,
      dload: 115000.0,
    },
  },
  {
    name: 'Reconnaissance / Port Sweep',
    desc: 'Unsolicited high-rate UDP datagram barrage to closed destination ports',
    data: {
      event_id: 'EVT-RECON-772',
      device_id: 'srv-web-01',
      proto: 'udp',
      service: 'dns',
      state: 'CON',
      dur: 0.0002,
      sbytes: 94,
      dbytes: 0,
      sttl: 254,
      dttl: 0,
      rate: 22000.0,
      sload: 3760000.0,
      dload: 0.0,
    },
  },
];

export const Detection: React.FC = () => {
  const { triggerRefresh } = useBackend();

  // State Management
  const [modelsData, setModelsData] = useState<DetectionModelsResponse | null>(null);
  const [metricsData, setMetricsData] = useState<DetectionMetricsResponse | null>(null);
  const [historyData, setHistoryData] = useState<DetectionHistoryResponse | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<DetectionRecordItem | null>(null);
  const [activeTab, setActiveTab] = useState<'analyzer' | 'history' | 'metrics' | 'batch'>('analyzer');

  // Interactive Live Analyzer State
  const [flowInput, setFlowInput] = useState<Record<string, any>>({
    event_id: 'EVT-' + Math.floor(100000 + Math.random() * 900000),
    device_id: 'srv-web-01',
    proto: 'tcp',
    service: 'http',
    state: 'FIN',
    dur: 0.15,
    sbytes: 840,
    dbytes: 1250,
    sttl: 64,
    dttl: 64,
    rate: 180.0,
  });
  const [liveAlert, setLiveAlert] = useState<StructuredThreatAlert | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Batch CSV Upload State
  const [uploadResults, setUploadResults] = useState<CSVUploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load backend telemetry
  const fetchTelemetry = async () => {
    setIsLoading(true);
    try {
      const [models, metrics, history] = await Promise.allSettled([
        api.getDetectionModels(),
        api.getDetectionMetrics(),
        api.getDetectionHistory(50, 0),
      ]);

      if (models.status === 'fulfilled') setModelsData(models.value);
      if (metrics.status === 'fulfilled') setMetricsData(metrics.value);
      if (history.status === 'fulfilled') {
        setHistoryData(history.value);
        if (history.value.records.length > 0 && !selectedIncident) {
          setSelectedIncident(history.value.records[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load detection telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Handle live single event analysis
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const alert = await api.analyzeEvent(flowInput);
      setLiveAlert(alert);
      triggerRefresh();
      // Re-fetch history to update incident table
      const updatedHistory = await api.getDetectionHistory(50, 0);
      setHistoryData(updatedHistory);
    } catch (err: any) {
      setAnalyzeError(err.message || 'Threat analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle batch CSV upload
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const response = await api.uploadCSV(file);
      setUploadResults(response);
      triggerRefresh();
      const updatedHistory = await api.getDetectionHistory(50, 0);
      setHistoryData(updatedHistory);
    } catch (err: any) {
      setUploadError(err.message || 'Batch CSV inference analysis failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Header & Engine Banner */}
      <OmenSectionHeader 
        moduleNumber="MODULE 01"
        tag="MULTI-MODEL ML ENSEMBLE"
        title="NEURAL DETECTION"
        description="Autonomous threat detection synthesizing Random Forest attack classification, deep PyTorch Multilayer Perceptron (MLP) inference, and calibrated Isolation Forest anomaly estimation."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTelemetry}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-mono text-muted hover:text-chrome transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>REFRESH TELEMETRY</span>
            </button>
          </div>
        }
      />

      {/* 2. Neural Model Status Subsystem (Modular Component) */}
      <ModelStatusPanel modelsData={modelsData} metricsData={metricsData} />

      {/* 3. Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-2 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`px-4 py-2.5 border-b-2 font-bold uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'analyzer'
              ? 'border-crimson text-crimson-glow bg-surface/50'
              : 'border-transparent text-muted hover:text-chrome'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>LIVE ANALYZER</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 border-b-2 font-bold uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-crimson text-crimson-glow bg-surface/50'
              : 'border-transparent text-muted hover:text-chrome'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>EVENT LOG ({historyData?.records.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 border-b-2 font-bold uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'border-crimson text-crimson-glow bg-surface/50'
              : 'border-transparent text-muted hover:text-chrome'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>EVALUATION METRICS</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`px-4 py-2.5 border-b-2 font-bold uppercase transition-colors flex items-center gap-2 ${
            activeTab === 'batch'
              ? 'border-crimson text-crimson-glow bg-surface/50'
              : 'border-transparent text-muted hover:text-chrome'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>BATCH CSV INGESTION</span>
        </button>
      </div>

      {/* TAB 1: Live Interactive Analyzer */}
      {activeTab === 'analyzer' && (
        <section className="space-y-6">
          {/* Preset Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <div
                key={preset.name}
                onClick={() => {
                  setFlowInput({ ...preset.data });
                  setLiveAlert(null);
                }}
                className="p-3.5 bg-surface hover:bg-surface-elevated border border-border hover:border-chrome/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-crimson font-bold uppercase">PRESET</span>
                  <Play className="w-3 h-3 text-muted group-hover:text-chrome" />
                </div>
                <div className="font-heading text-xs font-bold text-primary mb-1">{preset.name}</div>
                <div className="font-sans text-[11px] text-secondary">{preset.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Input Form */}
            <div className="lg:col-span-5">
              <OmenPanel className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-crimson" />
                    FLOW FEATURE VECTOR (UNSW-NB15)
                  </h3>
                  <span className="font-mono text-[9px] text-muted">STANDARDIZED</span>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <label className="text-[10px] text-muted block mb-1">PROTOCOL (proto)</label>
                    <select
                      value={flowInput.proto || 'tcp'}
                      onChange={(e) => setFlowInput({ ...flowInput, proto: e.target.value })}
                      className="w-full bg-surface-elevated border border-border px-3 py-1.5 text-chrome focus:border-crimson outline-none font-mono text-xs"
                    >
                      <option value="tcp">tcp</option>
                      <option value="udp">udp</option>
                      <option value="unas">unas</option>
                      <option value="arp">arp</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">SERVICE (service)</label>
                    <select
                      value={flowInput.service || '-'}
                      onChange={(e) => setFlowInput({ ...flowInput, service: e.target.value })}
                      className="w-full bg-surface-elevated border border-border px-3 py-1.5 text-chrome focus:border-crimson outline-none font-mono text-xs"
                    >
                      <option value="-">- (generic)</option>
                      <option value="http">http</option>
                      <option value="dns">dns</option>
                      <option value="ssh">ssh</option>
                      <option value="ftp">ftp</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">SOURCE BYTES</label>
                    <input
                      type="number"
                      value={flowInput.sbytes !== undefined ? flowInput.sbytes : 800}
                      onChange={(e) => setFlowInput({ ...flowInput, sbytes: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-surface-elevated border border-border px-3 py-1.5 text-chrome focus:border-crimson outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">DEST BYTES</label>
                    <input
                      type="number"
                      value={flowInput.dbytes !== undefined ? flowInput.dbytes : 1200}
                      onChange={(e) => setFlowInput({ ...flowInput, dbytes: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-surface-elevated border border-border px-3 py-1.5 text-chrome focus:border-crimson outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">SOURCE TTL</label>
                    <input
                      type="number"
                      value={flowInput.sttl !== undefined ? flowInput.sttl : 64}
                      onChange={(e) => setFlowInput({ ...flowInput, sttl: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-surface-elevated border border-border px-3 py-1.5 text-chrome focus:border-crimson outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">RATE (packets/sec)</label>
                    <input
                      type="number"
                      value={flowInput.rate !== undefined ? flowInput.rate : 150}
                      onChange={(e) => setFlowInput({ ...flowInput, rate: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface-elevated border border-border px-3 py-1.5 text-chrome focus:border-crimson outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                {analyzeError && (
                  <div className="p-3 bg-crimson/15 border border-crimson text-crimson-glow text-xs font-mono">
                    {analyzeError}
                  </div>
                )}

                <OmenButton
                  variant="primary"
                  className="w-full"
                  onClick={handleAnalyze}
                  loading={isAnalyzing}
                  icon={<Play className="w-3.5 h-3.5" />}
                >
                  Analyze Flow Event
                </OmenButton>
              </OmenPanel>
            </div>

            {/* Right: Real-time Analysis Output & Gauge */}
            <div className="lg:col-span-7">
              <DetectionInspector event={liveAlert} />
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: Detection History Log & Inspector */}
      {activeTab === 'history' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ThreatEventTable 
              records={historyData?.records || []}
              selectedId={selectedIncident?.detection_id}
              onSelectEvent={setSelectedIncident}
              isLoading={isLoading}
            />
          </div>

          <div className="lg:col-span-5">
            <DetectionInspector 
              event={selectedIncident} 
              onClose={() => setSelectedIncident(null)}
            />
          </div>
        </section>
      )}

      {/* TAB 3: Model Evaluation Metrics & Anomaly Gauge */}
      {activeTab === 'metrics' && (
        <section className="space-y-6">
          <DetectionMetrics metricsData={metricsData} />

          {metricsData?.models?.isolation_forest && (
            <div className="max-w-md">
              <AnomalyScoreChart 
                score={0.62} 
                threshold={metricsData.models.isolation_forest.threshold || 0.5} 
              />
            </div>
          )}
        </section>
      )}

      {/* TAB 4: Batch CSV Inference */}
      {activeTab === 'batch' && (
        <section className="space-y-6">
          <CSVUploader
            onUpload={handleUpload}
            isLoading={isUploading}
            error={uploadError}
            onClearError={() => setUploadError(null)}
          />

          {uploadResults && (
            <div className="space-y-6 animate-fade-in">
              <DetectionResults results={uploadResults} onReset={() => setUploadResults(null)} />
              {uploadResults.preview_predictions && uploadResults.preview_predictions.length > 0 && (
                <PredictionTable
                  predictions={uploadResults.preview_predictions}
                  title={`BATCH INFERENCE PREVIEWS (${uploadResults.preview_predictions.length} FLOWS)`}
                />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
