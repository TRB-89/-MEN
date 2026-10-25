import React from 'react';
import { OmenPanel } from './OmenPanel';

export interface OmenMetricProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'default' | 'crimson' | 'success' | 'amber';
  cornerTicks?: boolean;
  className?: string;
}

export const OmenMetric: React.FC<OmenMetricProps> = ({
  label,
  value,
  sublabel,
  variant = 'default',
  cornerTicks = false,
  className = '',
}) => {
  const valueColor = {
    default: 'text-primary',
    crimson: 'text-crimson-glow',
    success: 'text-success',
    amber: 'text-amber-400',
  }[variant];

  return (
    <OmenPanel
      cornerTicks={cornerTicks}
      borderVariant="default"
      className={`p-4 ${className}`}
    >
      <span className="font-mono text-[9px] text-muted uppercase tracking-wider block mb-1">
        {label}
      </span>
      <span className={`font-heading text-2xl font-extrabold block ${valueColor}`}>
        {value}
      </span>
      {sublabel && (
        <span className="font-sans text-[11px] text-secondary mt-1 block">
          {sublabel}
        </span>
      )}
    </OmenPanel>
  );
};
