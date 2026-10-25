import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  History,
  Sliders,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { 
  NetworkGraphData, 
  DefenseSimulationResponse, 
  DefenseRecommendationResponse, 
  DefenseRecommendationItem, 
  DefenseActionType,
  DefenseHistoryItem,
  AttackPathPredictionResponse
} from '../types';
import { 
  ThreatContextPanel,
  PredictionSummaryPanel,
  DefenseRecommendationCards,
  StrategySelector,
  DefenseGraphCanvas,
  RiskReductionVisualizer,
  BusinessImpactPanel,
  DefenseApproval,
  DecisionExplanationPanel,
  SimulationHistoryDrawer
} from '../components/defense';
import { OmenSectionHeader } from '../components/ui/OmenSectionHeader';
import { OmenPanel } from '../components/ui/OmenPanel';
import { OmenButton } from '../components/ui/OmenButton';
import { OmenBadge } from '../components/ui/OmenBadge';

export const Defense: React.FC = () => {
  // Topology state
  const [topology, setTopology] = useState<NetworkGraphData | null>(null);
  const [entryNode, setEntryNode] = useState<string>('srv-web-01');
  const [crownJewelTarget, setCrownJewelTarget] = useState<string>('db-prod-01');

  // Module 3 Prediction State
  const [predictionData, setPredictionData] = useState<AttackPathPredictionResponse | null>(null);

  // Strategy & Simulation Configuration
  const [actionType, setActionType] = useState<DefenseActionType>('WORKSTATION_ISOLATION');
  const [targetEntity, setTargetEntity] = useState<string>('srv-app-01');
  const [riskWeight, setRiskWeight] = useState<number>(0.7);
  const [disruptionWeight, setDisruptionWeight] = useState<number>(0.3);

  // Loading & Results
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<DefenseSimulationResponse | null>(null);
  const [recommendations, setRecommendations] = useState<DefenseRecommendationResponse | null>(null);

  // Modals & Drawers
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [simulationHistory, setSimulationHistory] = useState<DefenseHistoryItem[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // 1. Initial Data Fetch: Topology & Attack Path Prediction
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const topo = await api.getNetworkTopology();
        setTopology(topo);

        // Fetch Module 3 prediction for active foothold -> crown jewel
        try {
          const pred = await api.predictAttackPathsV2({
            source_asset_id: 'srv-web-01',
            target_asset_id: 'db-prod-01',
            top_k: 5,
          });
          setPredictionData(pred);
        } catch (predErr) {
          console.warn('Prediction service fallback', predErr);
        }

        // Fetch recommendations from Module 4
        try {
          const recs = await api.getDefenseRecommendations({
            entry_node: 'srv-web-01',
            target_asset_id: 'db-prod-01',
            risk_weight: 0.7,
            disruption_weight: 0.3,
          });
          setRecommendations(recs);

          // If recommendations returned a primary strategy, pre-populate target
          if (recs.recommended_strategy) {
            setActionType(recs.recommended_strategy.action_type as DefenseActionType);
            setTargetEntity(recs.recommended_strategy.target_entity);
          }
        } catch (recErr) {
          console.warn('Recommendations service fallback', recErr);
        }

        // Run default baseline simulation on mount
        try {
          const defaultSim = await api.runDefenseSimulation({
            action_type: 'WORKSTATION_ISOLATION',
            target_entity: 'srv-app-01',
            entry_node: 'srv-web-01',
            target_asset_id: 'db-prod-01',
          });
          setSimResult(defaultSim);
        } catch (simErr) {
          console.warn('Initial simulation fallback', simErr);
        }
      } catch (err) {
        console.error('Failed to initialize defense engine', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // 2. Fetch history on drawer open
  const handleOpenHistory = async () => {
    setShowHistoryDrawer(true);
    try {
      const hist = await api.getDefenseSimulations(25);
      setSimulationHistory(hist);
    } catch (err) {
      console.error('Failed to load simulation history', err);
    }
  };

  // 3. Apply Recommendation Item
  const handleSelectRecommendation = (strat: DefenseRecommendationItem) => {
    setActionType(strat.action_type as DefenseActionType);
    setTargetEntity(strat.target_entity);

    // Auto-run simulation for the clicked recommendation
    handleExecuteSimulation(strat.action_type as DefenseActionType, strat.target_entity);
  };

  // 4. Run Isolated Simulation
  const handleExecuteSimulation = async (
    customAction?: DefenseActionType,
    customTarget?: string
  ) => {
    const act = customAction || actionType;
    const tgt = customTarget || targetEntity;

    setIsSimulating(true);
    setFeedbackNotice(null);

    try {
      const res = await api.runDefenseSimulation({
        action_type: act,
        target_entity: tgt,
        entry_node: entryNode,
        target_asset_id: crownJewelTarget,
        prediction_id: predictionData?.prediction_id,
      });

      setSimResult(res);
      setFeedbackNotice(`Simulation ${res.simulation_id} completed: ${res.metrics.risk_reduction_pct.toFixed(1)}% risk mitigation.`);
    } catch (err: any) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // 5. SecOps Approval & Rejection Handlers
  const handleApprovePlan = async (notes: string) => {
    if (!simResult) return;
    try {
      const res = await api.submitDefenseApproval({
        simulation_id: simResult.simulation_id,
        analyst_id: 'ANALYST-SECOPS-LEAD',
        decision: 'APPROVED',
        notes,
      });
      setFeedbackNotice(`Plan ${res.approval_id} APPROVED: Stored in security database.`);
      setSimResult((prev) => prev ? { ...prev, approval_status: 'APPROVED' } : null);
    } catch (err: any) {
      alert(`Approval Error: ${err.message}`);
    }
  };

  const handleRejectPlan = async (notes: string) => {
    if (!simResult) return;
    try {
      const res = await api.submitDefenseApproval({
        simulation_id: simResult.simulation_id,
        analyst_id: 'ANALYST-SECOPS-LEAD',
        decision: 'REJECTED',
        notes,
      });
      setFeedbackNotice(`Plan ${res.approval_id} REJECTED: Analyst requested alternative strategy.`);
      setSimResult((prev) => prev ? { ...prev, approval_status: 'REJECTED' } : null);
    } catch (err: any) {
      alert(`Rejection Error: ${err.message}`);
    }
  };

  // 6. Load Historical Simulation
  const handleLoadHistoricalSim = async (simId: string) => {
    try {
      const loaded = await api.getDefenseSimulationById(simId);
      if (loaded) {
        setSimResult(loaded);
        setActionType(loaded.action_type);
        setTargetEntity(loaded.target_entity);
        setFeedbackNotice(`Loaded historical simulation ${simId}`);
      }
    } catch (err: any) {
      alert(`Failed to load historical simulation: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 select-none">
      {/* 1. Module Header */}
      <OmenSectionHeader 
        moduleNumber="04"
        tag="AUTONOMOUS DEFENSE SIMULATION ENGINE"
        title="CONTROL THE DAMAGE. PRESERVE THE SYSTEM."
        description="Evaluate defensive responses, simulate containment, and determine the most effective strategy before intervention."
        actions={
          <div className="flex items-center gap-2">
            <OmenButton 
              variant="secondary" 
              size="sm" 
              onClick={handleOpenHistory}
              icon={<History className="w-4 h-4" />}
            >
              Audit Dossier
            </OmenButton>

            <OmenButton 
              variant="primary" 
              size="sm" 
              onClick={() => setShowApprovalModal(true)}
              disabled={!simResult}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              SecOps Approval
            </OmenButton>
          </div>
        }
      />

      {/* Real-time Status / Feedback Banner */}
      {feedbackNotice && (
        <div className="p-3 bg-surface border border-emerald-500/40 rounded-xl flex items-center justify-between font-mono text-xs text-emerald-300 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-muted hover:text-white text-[11px]"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 2. Threat Context Panel (Module 1) */}
      <ThreatContextPanel
        entryNode={entryNode}
        crownJewelTarget={crownJewelTarget}
        nodes={topology?.nodes || []}
        onSelectEntryNode={(id) => {
          setEntryNode(id);
          handleExecuteSimulation(actionType, targetEntity);
        }}
        onSelectCrownJewel={(id) => {
          setCrownJewelTarget(id);
          handleExecuteSimulation(actionType, targetEntity);
        }}
        activeAlertCount={3}
      />

      {/* 3. Selected Prediction Summary (Module 3) */}
      <PredictionSummaryPanel
        predictionId={predictionData?.prediction_id}
        totalPaths={predictionData?.total_candidate_paths || 4}
        highestRiskScore={predictionData?.candidate_paths[0]?.risk_score || 89.4}
        estimatedTimeMins={predictionData?.candidate_paths[0]?.estimated_time_mins || 22}
        chokepoints={predictionData?.critical_chokepoints || []}
        topPathNodes={predictionData?.candidate_paths[0]?.nodes || ['srv-web-01', 'srv-app-01', 'db-prod-01']}
        snapshotId={predictionData?.topology_snapshot_id || 'SNAP-TOPO-LIVE'}
      />

      {/* 4. Multi-Objective Defense Recommendation Cards */}
      <DefenseRecommendationCards
        recommendedStrategy={recommendations?.recommended_strategy}
        alternativeStrategies={recommendations?.alternative_strategies}
        onSelectStrategy={handleSelectRecommendation}
        selectedEntity={targetEntity}
      />

      {/* 5. Response Strategy Selector (Action A, B, C, D) */}
      <StrategySelector
        actionType={actionType}
        onChangeActionType={setActionType}
        targetEntity={targetEntity}
        onChangeTargetEntity={setTargetEntity}
        nodes={topology?.nodes || []}
        edges={topology?.edges || []}
        riskWeight={riskWeight}
        onChangeRiskWeight={setRiskWeight}
        disruptionWeight={disruptionWeight}
        onChangeDisruptionWeight={setDisruptionWeight}
        onExecuteSimulation={() => handleExecuteSimulation()}
        isSimulating={isSimulating}
      />

      {/* 6. Before-and-After Attack Graph (React Flow) */}
      {topology && (
        <DefenseGraphCanvas
          nodes={topology.nodes}
          edges={topology.edges}
          simulation={simResult}
          activeActionType={actionType}
          targetEntity={targetEntity}
          entryNode={entryNode}
          crownJewelTarget={crownJewelTarget}
        />
      )}

      {/* 7. Risk Reduction Visualizer & 8. Business Impact Panel */}
      {simResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <RiskReductionVisualizer
              metrics={simResult.metrics}
              actionType={simResult.action_type}
              targetName={simResult.target_name}
            />
          </div>

          <div className="lg:col-span-5">
            <BusinessImpactPanel
              impact={simResult.business_impact}
            />
          </div>
        </div>
      )}

      {/* 9. Decision Explanation Panel */}
      {simResult && (
        <DecisionExplanationPanel
          simulation={simResult}
        />
      )}

      {/* 10. Human Approval Modal Dialog */}
      <DefenseApproval
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        simulation={simResult}
        onApprove={handleApprovePlan}
        onReject={handleRejectPlan}
        onReset={() => {
          handleExecuteSimulation();
          setShowApprovalModal(false);
        }}
      />

      {/* 11. Simulation History Drawer */}
      <SimulationHistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        history={simulationHistory}
        onSelectHistoricalSimulation={handleLoadHistoricalSim}
      />
    </div>
  );
};
