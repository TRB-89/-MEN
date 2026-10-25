import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { ShieldAlert } from 'lucide-react';
import { OmenPanel } from '../ui/OmenPanel';

interface ThreatDistributionProps {
  distribution?: {
    Normal: number;
    Low: number;
    Medium: number;
    High: number;
  };
}

export const ThreatDistribution: React.FC<ThreatDistributionProps> = ({
  distribution = { Normal: 1120, Low: 140, Medium: 95, High: 65 },
}) => {
  const data = [
    { name: 'NORMAL', count: distribution.Normal || 0, color: '#4ADE80' },
    { name: 'LOW', count: distribution.Low || 0, color: '#94A3B8' },
    { name: 'MEDIUM', count: distribution.Medium || 0, color: '#FACC15' },
    { name: 'CRITICAL', count: distribution.High || 0, color: '#E34C67' },
  ];

  return (
    <OmenPanel className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-crimson" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-muted">
            SEVERITY SPECTRUM BREAKDOWN
          </h3>
        </div>
        <span className="font-mono text-[10px] text-muted">UNSW-NB15 DATASET</span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#737384', fontSize: 10, fontFamily: 'monospace' }} 
              axisLine={{ stroke: 'rgba(214, 214, 218, 0.12)' }}
            />
            <YAxis 
              tick={{ fill: '#737384', fontSize: 10, fontFamily: 'monospace' }} 
              axisLine={{ stroke: 'rgba(214, 214, 218, 0.12)' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#101014', 
                border: '1px solid rgba(214, 214, 218, 0.12)', 
                fontFamily: 'monospace', 
                fontSize: 11,
                color: '#F2F2F4'
              }} 
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border font-mono text-[10px] text-center">
        {data.map((d) => (
          <div key={d.name} className="p-1.5 bg-background border border-border">
            <span className="text-muted block text-[9px]">{d.name}</span>
            <span className="font-bold text-primary">{d.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </OmenPanel>
  );
};
