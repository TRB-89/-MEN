import React from 'react';
import { 
  Cpu, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DetectionModelsResponse } from '../../types';
import { OmenPanel } from '../ui/OmenPanel';
import { OmenBadge } from '../ui/OmenBadge';

interface ModelHealthProps {
  models: DetectionModelsResponse | null;
}

export const ModelHealth: React.FC<ModelHealthProps> = ({ models }) => {
  const navigate = useNavigate();

  const modelList = [
    {
      name: 'RANDOM FOREST',
      key: 'random_forest' as const,
      role: 'SUPERVISED ATTACK CLASSIFIER',
      type: '100 TREES ENSEMBLE',
      status: models?.models.random_forest.status || 'not_trained',
    },
    {
      name: 'MLP NEURAL NETWORK',
      key: 'mlp_neural_network' as const,
      role: 'DEEP TENSOR PERCEPTRON',
      type: 'PYTORCH 3-LAYER [128→64]',
      status: models?.models.mlp_neural_network.status || 'not_trained',
    },
    {
      name: 'ISOLATION FOREST',
      key: 'isolation_forest' as const,
      role: 'UNSUPERVISED ZERO-DAY ANOMALY',
      type: '150 ISOLATION TREES',
      status: models?.models.isolation_forest.status || 'not_trained',
    },
  ];

  return (
    <OmenPanel className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted">
            NEURAL ENGINE STATUS // LOCAL PYTORCH
          </h3>
        </div>
        <button
          onClick={() => navigate('/detection')}
          className="font-mono text-[11px] text-chrome hover:text-white flex items-center gap-1 group"
        >
          <span>ENGINE BENCHMARKS</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modelList.map((m) => {
          const isTrained = m.status === 'trained';

          return (
            <div
              key={m.name}
              onClick={() => navigate('/detection')}
              className="p-3.5 bg-background border border-border hover:border-chrome/50 transition-colors cursor-pointer space-y-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">{m.name}</span>
                <OmenBadge variant={isTrained ? 'success' : 'amber'} size="sm">
                  {isTrained ? 'WEIGHTS ACTIVE' : 'UNINITIALIZED'}
                </OmenBadge>
              </div>

              <div className="text-[10px] text-muted">{m.role}</div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px]">
                <span className="text-secondary">{m.type}</span>
                <span className={isTrained ? 'text-success font-bold' : 'text-amber-400'}>
                  {isTrained ? 'LOCAL CPU' : 'AWAITING TRAIN'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </OmenPanel>
  );
};
