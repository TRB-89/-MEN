import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Activity, 
  Network, 
  GitBranch, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Home, 
  X,
  ChevronRight,
  Terminal,
  Radio
} from 'lucide-react';
import { useBackend } from '../../services/BackendContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { health, isOnline } = useBackend();

  const navItems = [
    { num: '00', label: 'SOC Console', to: '/console', icon: Activity, tag: 'COMMAND' },
    { num: '01', label: 'Neural Detection', to: '/detection', icon: Cpu, tag: 'ML_ENGINE' },
    { num: '02', label: 'Attack Graph', to: '/network', icon: Network, tag: 'TOPOLOGY' },
    { num: '03', label: 'Path Prediction', to: '/prediction', icon: GitBranch, tag: 'FORECAST' },
    { num: '04', label: 'Defense Sim', to: '/defense', icon: ShieldCheck, tag: 'ZERO_TRUST' },
    { num: '05', label: 'Incident Memory', to: '/incidents', icon: Database, tag: 'ARCHIVE' },
    { num: '06', label: 'System & ML', to: '/settings', icon: Terminal, tag: 'TELEMETRY' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-background/90 z-40 lg:hidden backdrop-blur-md transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface border-r border-border flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Heading */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-surface-elevated/40">
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-crimson shadow-crimson-sm inline-block" />
                <h1 className="font-heading text-2xl font-extrabold tracking-wider text-primary">
                  ØMEN
                </h1>
                <span className="font-mono text-[9px] text-muted border border-border px-1.5 py-0.5">
                  SYS_V1.04
                </span>
              </div>
              <p className="font-mono text-[10px] tracking-widest text-muted mt-1 uppercase">
                AUTONOMOUS CTI & DEFENSE
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-muted hover:text-chrome p-1 border border-border"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Return to Landing Page */}
          <div className="px-3 pt-3">
            <button
              onClick={() => {
                navigate('/');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-background hover:bg-surface-elevated border border-border font-mono text-[11px] text-secondary hover:text-chrome transition-colors"
            >
              <div className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-muted" />
                <span>LANDING PAGE</span>
              </div>
              <ChevronRight className="w-3 h-3 text-muted" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-2 py-1 font-mono text-[10px] text-muted uppercase tracking-widest">
              OPERATIONAL MODULES
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 border transition-all duration-200 group ${
                      isActive
                        ? 'border-crimson bg-background text-primary font-bold shadow-crimson-sm border-l-4'
                        : 'border-transparent text-secondary hover:text-chrome hover:border-border hover:bg-surface-elevated/50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted group-hover:text-chrome transition-colors" />
                    <div>
                      <span className="font-mono text-xs uppercase tracking-wider block">
                        {item.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-muted opacity-70 block">
                      {item.num}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System & Model Telemetry Footer */}
        <div className="p-4 m-3 border border-border bg-background tech-corner-tl tech-corner-br">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-crimson" />
              ENGINE HEALTH
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-success animate-pulse' : 'bg-critical'
                }`}
              />
              <span className="font-mono text-[10px] text-chrome uppercase font-bold">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="space-y-1 font-mono text-[10px] pt-1 border-t border-border/80">
            <div className="flex justify-between text-muted">
              <span>MODELS:</span>
              <span className="text-chrome font-bold">RF / MLP / ISO</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>DATASET:</span>
              <span className="text-chrome">UNSW-NB15</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>HOST:</span>
              <span className="text-chrome">127.0.0.1:8000</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
