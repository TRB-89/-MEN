import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { DefenseSimulationResult, NetworkGraphData } from '../types';
import { ResponseRecommendation } from '../components/defense/ResponseRecommendation';
import { DefenseApproval } from '../components/defense/DefenseApproval';
import { BeforeAfterGraph } from '../components/defense/BeforeAfterGraph';
import { SimulationOutcome } from '../components/defense/SimulationOutcome';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';
import { OmenPanel } from '../components/ui/OmenPanel';
import { OmenButton } from '../components/ui/OmenButton';

export const Defense: React.FC = () => {
  const [topology, setTopology] = useState<NetworkGraphData | null>(null);
  const [entryNode, setEntryNode] = useState<string>('srv-web-01');
  const [selectedNodesToIsolate, setSelectedNodesToIsolate] = useState<string[]>(['srv-app-01']);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<DefenseSimulationResult | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);

  // Load topology
  useEffect(() => {
    api.getNetworkTopology()
      .then((data) => setTopology(data))
      .catch((err) => console.error(err));
  }, []);

  const handleToggleNode = (nodeId: string) => {
    setSelectedNodesToIsolate((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  const handleApplyPreset = (presetNodes: string[], entry: string) => {
    setSelectedNodesToIsolate(presetNodes);
    setEntryNode(entry);
    setSimResult(null);
  };

  const handleRunSimulation = async () => {
    if (selectedNodesToIsolate.length === 0) {
      alert('Select at least one device to isolate in the simulation.');
      return;
    }

    setIsSimulating(true);
    setShowApprovalModal(false);
    try {
      const res = await api.simulateIsolation(selectedNodesToIsolate, entryNode);
      setSimResult(res);
    } catch (err: any) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run initial simulation on mount
  useEffect(() => {
    if (entryNode && selectedNodesToIsolate.length > 0) {
      api.simulateIsolation(selectedNodesToIsolate, entryNode)
        .then((res) => setSimResult(res))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Module Header */}
      <OmenSectionHeader 
        moduleNumber="MODULE 04"
        tag="ZERO-TRUST MICROSEGMENTATION"
        title="NEUTRALIZE THE INEVITABLE."
        description="Simulate autonomous containment and blast radius reduction. Model microsegmentation and device quarantine without impacting production networks or operational uptime."
        actions={
          <OmenButton 
            variant="primary" 
            size="sm" 
            onClick={() => setShowApprovalModal(true)}
            loading={isSimulating}
            disabled={selectedNodesToIsolate.length === 0}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Execute Simulation
          </OmenButton>
        }
      />

      {/* 2. Detected Threat Context & Autonomous Recommendations */}
      <ResponseRecommendation 
        onApplyPreset={handleApplyPreset}
      />

      {/* 3. Before vs After Containment Comparison & Outcome */}
      {simResult && (
        <div className="space-y-6">
          <SimulationOutcome 
            result={simResult}
            onReset={() => setSimResult(null)}
          />

          <BeforeAfterGraph 
            result={simResult}
          />
        </div>
      )}

      {/* 4. Device Quarantine Checklist & Disruption Estimation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device Selection Matrix */}
        <div className="lg:col-span-7">
          <OmenPanel className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-crimson" />
                <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted">
                  ZERO-TRUST DEVICE QUARANTINE SELECTOR
                </h3>
              </div>
              <span className="font-mono text-[10px] text-muted">
                {selectedNodesToIsolate.length} DEVICES STAGED
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto font-mono text-xs">
              {topology?.nodes.map((node) => {
                const isSelected = selectedNodesToIsolate.includes(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => handleToggleNode(node.id)}
                    className={`p-3 border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-crimson bg-crimson/15 shadow-crimson-sm'
                        : 'border-border bg-background hover:border-chrome/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="accent-crimson w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-primary font-bold block">{node.name}</span>
                        <span className="text-[10px] text-muted">{node.id} • {node.ip} • {node.zone}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${
                        node.criticality === 'CRITICAL'
                          ? 'bg-crimson/20 border-crimson text-crimson-glow'
                          : 'bg-surface-elevated border-border text-secondary'
                      }`}>
                        {node.criticality}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </OmenPanel>
        </div>

        {/* Disruption Estimation */}
        <div className="lg:col-span-5">
          <OmenPanel className="space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted">
                  BUSINESS DISRUPTION IMPACT
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 bg-amber-950/40 border border-amber-700/60 text-amber-400 font-bold">
                  EST: MINIMAL IMPACT
                </span>
              </div>

              <p className="font-sans text-xs text-secondary leading-relaxed">
                Quarantine isolates network ingress and lateral SMB/SSH ports while retaining essential monitoring
                and telemetry feedback loops.
              </p>

              <div className="p-3 bg-surface-elevated border border-border font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">ENTRY VECTOR:</span>
                  <span className="text-primary font-bold">{entryNode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">QUARANTINE TARGETS:</span>
                  <span className="text-crimson font-bold">{selectedNodesToIsolate.length} NODES</span>
                </div>
              </div>
            </div>

            <OmenButton 
              variant="primary" 
              className="w-full mt-4" 
              onClick={() => setShowApprovalModal(true)}
              loading={isSimulating}
              disabled={selectedNodesToIsolate.length === 0}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Confirm Containment Simulation
            </OmenButton>
          </OmenPanel>
        </div>
      </div>

      {/* 5. Autonomous Approval Modal */}
      <DefenseApproval 
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleRunSimulation}
        selectedNodes={selectedNodesToIsolate}
        entryNode={entryNode}
      />
    </div>
  );
};
