import React from 'react';
import { Cpu } from 'lucide-react';
import { DetectionModelsResponse, DetectionMetricsResponse } from '../../types';
import { OmenPanel, OmenBadge } from '../ui';

export interface ModelStatusPanelProps {
  modelsData: DetectionModelsResponse | null;
  metricsData: DetectionMetricsResponse | null;
  className?: string;
}

export const ModelStatusPanel: React.FC<ModelStatusPanelProps> = ({
  modelsData,
  metricsData,
  className = '',
}) => {
  const renderModelBadge = (status?: string) => {
    const isTrained = status === 'trained';
    return (
      <OmenBadge variant={isTrained ? 'success' : 'neutral'} pulse={isTrained}>
        {isTrained ? 'ONLINE // TRAINED' : 'MODEL NOT TRAINED'}
      </OmenBadge>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
          <Cpu className="w-4 h-4 text-crimson" />
          NEURAL MODEL SUBSYSTEM STATUS
        </h2>
        <span className="font-mono text-[11px] text-muted">
          BENCHMARK: UNSW-NB15 (191 TRANSFORMED FEATURES)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Random Forest Card */}
        <OmenPanel className="p-5 hover:border-chrome/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
              SUPERVISED BASELINE
            </span>
            {renderModelBadge(modelsData?.models?.random_forest?.status)}
          </div>
          <h3 className="font-heading text-base font-bold text-primary tracking-wide mb-1">
            RANDOM FOREST
          </h3>
          <p className="font-sans text-xs text-secondary mb-4 leading-relaxed">
            Scikit-learn ensemble with 60 estimators, max depth 16, evaluating flow features against labeled attack archetypes.
          </p>
          <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-muted block text-[10px]">HOLDOUT ACC</span>
              <span className="text-chrome font-bold">
                {metricsData?.models?.random_forest
                  ? `${(metricsData.models.random_forest.accuracy * 100).toFixed(2)}%`
                  : 'NOT EVALUATED'}
              </span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">ROC-AUC</span>
              <span className="text-chrome font-bold">
                {metricsData?.models?.random_forest
                  ? metricsData.models.random_forest.roc_auc.toFixed(4)
                  : 'NOT EVALUATED'}
              </span>
            </div>
          </div>
        </OmenPanel>

        {/* PyTorch MLP Card */}
        <OmenPanel className="p-5 hover:border-chrome/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
              DEEP NEURAL NETWORK
            </span>
            {renderModelBadge(modelsData?.models?.mlp_neural_network?.status)}
          </div>
          <h3 className="font-heading text-base font-bold text-primary tracking-wide mb-1">
            PYTORCH MLP
          </h3>
          <p className="font-sans text-xs text-secondary mb-4 leading-relaxed">
            Dense Neural Architecture (191 → 128 → 64 → 1) with ReLU, Dropout(0.3/0.2) & BCEWithLogitsLoss.
          </p>
          <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-muted block text-[10px]">HOLDOUT RECALL</span>
              <span className="text-chrome font-bold">
                {metricsData?.models?.mlp_neural_network
                  ? `${(metricsData.models.mlp_neural_network.recall * 100).toFixed(2)}%`
                  : 'NOT EVALUATED'}
              </span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">HOLDOUT F1</span>
              <span className="text-chrome font-bold">
                {metricsData?.models?.mlp_neural_network
                  ? `${(metricsData.models.mlp_neural_network.f1_score * 100).toFixed(2)}%`
                  : 'NOT EVALUATED'}
              </span>
            </div>
          </div>
        </OmenPanel>

        {/* Isolation Forest Card */}
        <OmenPanel className="p-5 hover:border-chrome/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
              UNSUPERVISED ANOMALY
            </span>
            {renderModelBadge(modelsData?.models?.isolation_forest?.status)}
          </div>
          <h3 className="font-heading text-base font-bold text-primary tracking-wide mb-1">
            ISOLATION FOREST
          </h3>
          <p className="font-sans text-xs text-secondary mb-4 leading-relaxed">
            Outlier isolation fitted strictly on normal network baselines, generating calibrated anomaly scores.
          </p>
          <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>
              <span className="text-muted block text-[10px]">CALIBRATED THRESHOLD</span>
              <span className="text-chrome font-bold">
                {modelsData?.models?.isolation_forest?.threshold !== undefined
                  ? Number(modelsData.models.isolation_forest.threshold).toFixed(4)
                  : '0.5000'}
              </span>
            </div>
            <div>
              <span className="text-muted block text-[10px]">FIT BASELINE</span>
              <span className="text-chrome font-bold">NORMAL TRAFFIC ONLY</span>
            </div>
          </div>
        </OmenPanel>
      </div>
    </div>
  );
};
