import React from 'react';
import { Loader2 } from 'lucide-react';

export interface OmenButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  chamfer?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const OmenButton: React.FC<OmenButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  chamfer = true,
  isLoading = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const activeLoading = loading || isLoading;
  const baseStyles = 'inline-flex items-center justify-center font-mono font-bold tracking-wider transition-all duration-200 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-[11px] px-3 py-1.5 gap-1.5',
    md: 'text-xs px-5 py-2.5 gap-2',
    lg: 'text-sm px-7 py-3.5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-crimson hover:bg-crimson-hover text-white shadow-crimson-sm border border-crimson',
    secondary: 'bg-surface-elevated hover:bg-surface border border-border text-primary hover:border-chrome/60',
    ghost: 'bg-transparent hover:bg-surface border border-transparent hover:border-border text-secondary hover:text-primary',
    danger: 'bg-rose-950/40 hover:bg-rose-900/60 border border-crimson text-crimson-glow',
  };

  const chamferClass = chamfer ? 'chamfer-tr' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${chamferClass} ${className}`}
      disabled={disabled || activeLoading}
      {...props}
    >
      {activeLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
