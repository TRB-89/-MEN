import React from 'react';

export interface OmenPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  chamfer?: 'tr' | 'bl' | 'both' | 'card' | 'none';
  cornerTicks?: boolean;
  borderVariant?: 'default' | 'hairline' | 'crimson' | 'none';
  glow?: 'none' | 'crimson' | 'magenta';
  glowing?: boolean;
}

export const OmenPanel: React.FC<OmenPanelProps> = ({
  children,
  chamfer = 'none',
  cornerTicks = false,
  borderVariant = 'default',
  glow = 'none',
  glowing = false,
  className = '',
  ...props
}) => {
  const activeGlow = glowing ? 'crimson' : glow;

  const chamferClass = {
    tr: 'chamfer-tr',
    bl: 'chamfer-bl',
    both: 'chamfer-both',
    card: 'chamfer-card',
    none: '',
  }[chamfer];

  const borderClass = {
    default: 'border border-border',
    hairline: 'border border-border-hairline',
    crimson: 'border border-crimson-subtle',
    none: '',
  }[borderVariant];

  const glowClass = {
    none: '',
    crimson: 'shadow-crimson-sm border-crimson/40',
    magenta: 'shadow-magenta-sm border-magenta/40',
  }[activeGlow];

  return (
    <div
      className={`bg-surface relative ${chamferClass} ${borderClass} ${glowClass} ${
        cornerTicks ? 'tech-corner-tl tech-corner-br' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
