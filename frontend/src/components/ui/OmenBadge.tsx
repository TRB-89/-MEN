import React from 'react';

export interface OmenBadgeProps {
  children: React.ReactNode;
  variant?: 'crimson' | 'chrome' | 'amber' | 'success' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const OmenBadge: React.FC<OmenBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    crimson: 'bg-crimson/20 border-crimson text-crimson-glow',
    chrome: 'bg-surface-elevated border-border-chrome text-primary font-bold',
    amber: 'bg-amber-950/40 border-amber-700 text-amber-400',
    success: 'bg-success/20 border-success/40 text-success',
    neutral: 'bg-surface-elevated border-border text-secondary',
  };

  const sizeStyles = {
    sm: 'text-[9px] px-2 py-0.5',
    md: 'text-[10px] px-2.5 py-0.5',
    lg: 'text-[11px] px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-bold tracking-wider uppercase border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'crimson'
              ? 'bg-crimson animate-ping'
              : variant === 'success'
              ? 'bg-success animate-ping'
              : 'bg-amber-400 animate-ping'
          }`}
        />
      )}
      {children}
    </span>
  );
};
