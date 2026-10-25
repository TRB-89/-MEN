import React from 'react';
import { Loader2, AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { OmenButton } from './OmenButton';

export const OmenLoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'ACQUIRING NEURAL METRICS & AUDIT LOGS...',
  className = '',
}) => {
  return (
    <div className={`h-64 flex flex-col items-center justify-center border border-border bg-surface p-8 text-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border border-border border-t-crimson animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-crimson animate-ping" />
        </div>
      </div>
      <p className="font-mono text-xs text-chrome tracking-widest uppercase">
        {message}
      </p>
    </div>
  );
};

export const OmenEmptyState: React.FC<{
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({
  title = 'NO ACTIVE INCIDENTS OR EVENTS',
  description = 'No threat data has been recorded matching current filters.',
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`h-64 flex flex-col items-center justify-center border border-dashed border-border bg-surface/50 p-8 text-center space-y-3 ${className}`}>
      <div className="text-muted">
        {icon || <Inbox className="w-8 h-8 opacity-60" />}
      </div>
      <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
        {title}
      </h3>
      <p className="font-sans text-xs text-secondary max-w-sm">
        {description}
      </p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export const OmenErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'TELEMETRY CONNECTION ANOMALY',
  message = 'Failed to acquire response from backend intelligence service.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 border border-crimson/50 bg-crimson/10 text-center space-y-4 ${className}`}>
      <div className="flex items-center justify-center gap-2 text-crimson-glow">
        <AlertTriangle className="w-5 h-5" />
        <h3 className="font-heading text-sm font-bold uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <p className="font-sans text-xs text-secondary max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <OmenButton
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          RETRY REQUEST
        </OmenButton>
      )}
    </div>
  );
};
