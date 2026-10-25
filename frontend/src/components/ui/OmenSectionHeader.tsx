import React from 'react';

export interface OmenSectionHeaderProps {
  moduleNumber?: string;
  tag?: string;
  title: string;
  subtitle?: string;
  description?: string;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const OmenSectionHeader: React.FC<OmenSectionHeaderProps> = ({
  moduleNumber,
  tag,
  title,
  subtitle,
  description,
  action,
  actions,
  className = '',
}) => {
  const displaySubtitle = subtitle || description;
  const displayActions = actions || action;

  // Format module number if it already has "MODULE"
  const formattedModuleNumber = moduleNumber?.replace(/^MODULE\s+/i, '');

  return (
    <div className={`border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 ${className}`}>
      <div>
        {(moduleNumber || tag) && (
          <div className="flex items-center gap-2 mb-2 font-mono text-xs">
            {formattedModuleNumber && (
              <span className="text-crimson font-bold uppercase tracking-widest">
                MODULE {formattedModuleNumber}
              </span>
            )}
            {moduleNumber && tag && <span className="text-muted">•</span>}
            {tag && <span className="text-muted tracking-wide">{tag}</span>}
          </div>
        )}
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-primary">
          {title}
        </h1>
        {displaySubtitle && (
          <p className="font-sans text-sm text-secondary mt-2 max-w-2xl leading-relaxed">
            {displaySubtitle}
          </p>
        )}
      </div>

      {displayActions && <div className="flex items-center gap-3 shrink-0">{displayActions}</div>}
    </div>
  );
};
