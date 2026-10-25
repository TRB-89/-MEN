import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Cpu, 
  Network, 
  GitBranch, 
  ShieldAlert, 
  Database, 
  Settings, 
  CornerDownLeft,
  Server,
  Layers,
  FileText,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';
import { NetworkNode, IncidentRecord } from '../../types';

export const CommandPaletteHUD: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'Navigation' | 'Assets' | 'Incidents' | 'Simulations' | 'System'>('Navigation');
  const [query, setQuery] = useState('');
  const [hoveredIdx, setHoveredIdx] = useState<number>(0);
  const [networkAssets, setNetworkAssets] = useState<NetworkNode[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);

  useEffect(() => {
    if (typeof api.getNetworkAssets === 'function') {
      api.getNetworkAssets().then((res) => {
        if (res && res.assets) setNetworkAssets(res.assets.slice(0, 8));
      }).catch(() => {});
    }

    if (typeof api.getIncidents === 'function') {
      api.getIncidents(undefined, undefined, 8, 0).then((res) => {
        if (res && res.incidents) setIncidents(res.incidents);
      }).catch(() => {});
    }
  }, []);

  const navigationCommands = [
    {
      id: 'm1',
      title: 'Open Neural Detection',
      shortcut: '/m1',
      icon: Cpu,
      action: () => navigate('/detection'),
    },
    {
      id: 'm2',
      title: 'Open Attack Graph',
      shortcut: '/m2',
      icon: Network,
      action: () => navigate('/network'),
    },
    {
      id: 'm3',
      title: 'Open Attack Path Prediction',
      shortcut: '/m3',
      icon: GitBranch,
      action: () => navigate('/prediction'),
    },
    {
      id: 'm4',
      title: 'Open Defense Simulation',
      shortcut: '/m4',
      icon: ShieldAlert,
      action: () => navigate('/defense'),
    },
    {
      id: 'assets',
      title: 'Search Assets',
      shortcut: '⌘ A',
      icon: Server,
      action: () => {
        setActiveCategory('Assets');
      },
    },
    {
      id: 'incidents',
      title: 'Search Incidents',
      shortcut: '⌘ I',
      icon: FileText,
      action: () => {
        setActiveCategory('Incidents');
      },
    },
    {
      id: 'history',
      title: 'Open Simulation History',
      shortcut: '⌘ H',
      icon: Database,
      action: () => navigate('/history'),
    },
  ];

  // Dynamic items based on active category or search query
  const displayedItems = (() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      const all = [
        ...navigationCommands.map((c) => ({ ...c, cat: 'Navigation' })),
        ...networkAssets.map((a) => ({
          id: `a-${a.id}`,
          title: `${a.name} (${a.id})`,
          shortcut: a.criticality,
          icon: Server,
          action: () => navigate('/network'),
          cat: 'Assets',
        })),
        ...incidents.map((i) => ({
          id: `i-${i.id}`,
          title: `${i.title} [${i.id}]`,
          shortcut: i.severity,
          icon: FileText,
          action: () => navigate('/incidents'),
          cat: 'Incidents',
        })),
      ];
      return all.filter((item) => item.title.toLowerCase().includes(q) || item.shortcut.toLowerCase().includes(q));
    }

    if (activeCategory === 'Assets') {
      return networkAssets.map((a) => ({
        id: `a-${a.id}`,
        title: `${a.name} [${a.ip}]`,
        shortcut: a.security_status,
        icon: Server,
        action: () => navigate('/network'),
      }));
    }

    if (activeCategory === 'Incidents') {
      return incidents.map((i) => ({
        id: `i-${i.id}`,
        title: `${i.id} - ${i.title}`,
        shortcut: i.severity,
        icon: FileText,
        action: () => navigate('/incidents'),
      }));
    }

    if (activeCategory === 'Simulations') {
      return [
        {
          id: 'sim-isolate',
          title: 'Simulate Workstation Isolation (WS-001)',
          shortcut: 'Action A',
          icon: ShieldAlert,
          action: () => navigate('/defense'),
        },
        {
          id: 'sim-quarantine',
          title: 'Simulate Microsegment Quarantine (Zone DMZ)',
          shortcut: 'Action B',
          icon: ShieldAlert,
          action: () => navigate('/defense'),
        },
      ];
    }

    if (activeCategory === 'System') {
      return [
        {
          id: 'sys-status',
          title: 'FastAPI Daemon & Model Telemetry',
          shortcut: 'DEFCON 3',
          icon: Settings,
          action: () => navigate('/system'),
        },
        {
          id: 'sys-history',
          title: 'SQLite Incident Dossier Store',
          shortcut: 'v1.04',
          icon: Database,
          action: () => navigate('/history'),
        },
      ];
    }

    return navigationCommands;
  })();

  const categories = [
    { name: 'Navigation', icon: Activity },
    { name: 'Assets', icon: Server },
    { name: 'Incidents', icon: FileText },
    { name: 'Simulations', icon: ShieldAlert },
    { name: 'System', icon: Settings },
  ] as const;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header (02 CTRL + K COMMAND PALETTE) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-technical text-xs font-bold text-[#F02D46] px-2 py-0.5 rounded bg-[#F02D46]/10 border border-[#F02D46]/30">
            02
          </span>
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              CTRL + K COMMAND PALETTE
            </h3>
            <p className="font-technical text-[10px] text-[#919198]">
              Quick navigation, asset search, incident access
            </p>
          </div>
        </div>
      </div>

      {/* Main HUD Container */}
      <div className="rounded-2xl bg-[#101013]/90 backdrop-blur-xl border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.7)] overflow-hidden font-technical">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#141418]/60 gap-3">
          <Search className="w-4 h-4 text-[#F02D46] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, assets, incidents..."
            className="w-full bg-transparent text-[#F5F5F5] placeholder-[#919198] text-xs font-technical tracking-wider focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-[#0A0A0D] border border-white/15 text-[10px] text-[#919198] font-mono shrink-0">
            Ctrl + K
          </kbd>
        </div>

        {/* 3-Column Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[290px] divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Left Category Sidebar (Cols 1-3) */}
          <div className="md:col-span-3 p-2 space-y-1 bg-[#0A0A0D]/50">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.name && !query;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setQuery('');
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all duration-150 ${
                    isActive
                      ? 'bg-[#F02D46]/15 border border-[#F02D46]/40 text-[#F5F5F5] font-bold shadow-[0_0_12px_rgba(240,45,70,0.15)]'
                      : 'text-[#919198] hover:text-[#F5F5F5] hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F02D46]' : 'text-[#919198]'}`} />
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Middle Command List (Cols 4-8) */}
          <div className="md:col-span-6 p-2 space-y-1 max-h-[300px] overflow-y-auto">
            {displayedItems.length === 0 ? (
              <div className="py-12 text-center text-[#919198] text-xs font-mono">
                NO COMMAND MATCHES
              </div>
            ) : (
              displayedItems.map((item, idx) => {
                const Icon = item.icon;
                const isHovered = hoveredIdx === idx;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all duration-150 ${
                      isHovered
                        ? 'bg-[#18181D] text-[#F5F5F5] border border-[#F02D46]/30'
                        : 'text-[#919198] hover:text-[#F5F5F5] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isHovered ? 'text-[#F02D46]' : 'text-[#919198]'}`} />
                      <span className="truncate font-sans font-medium">{item.title}</span>
                    </div>
                    <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0D] border border-white/10 text-[#A1A1AA] shrink-0">
                      {item.shortcut}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Visual Telemetry Preview (Cols 9-12) */}
          <div className="md:col-span-3 p-4 bg-[#0A0A0D]/70 flex flex-col justify-between items-center text-center">
            <div className="w-full">
              <span className="font-technical text-[10px] uppercase tracking-wider text-[#919198] block mb-2">
                ØMEN CONSOLE
              </span>
              {/* Red Point-cloud / Wireframe Sphere visual */}
              <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(240,45,70,0.3),transparent_70%)] animate-pulse" />
                <svg className="w-24 h-24 text-[#F02D46]" viewBox="0 0 100 100" fill="none">
                  {/* Point Cloud mesh nodes */}
                  <circle cx="50" cy="50" r="32" stroke="#F02D46" strokeWidth="0.8" strokeDasharray="3 3" />
                  <ellipse cx="50" cy="50" rx="32" ry="12" stroke="rgba(240,45,70,0.6)" strokeWidth="0.8" />
                  <ellipse cx="50" cy="50" rx="12" ry="32" stroke="rgba(240,45,70,0.6)" strokeWidth="0.8" />
                  {/* Red constellation dots */}
                  <circle cx="30" cy="45" r="2.5" fill="#F02D46" />
                  <circle cx="70" cy="55" r="2.5" fill="#F02D46" />
                  <circle cx="50" cy="20" r="2" fill="#FFF" />
                  <circle cx="50" cy="80" r="2" fill="#F02D46" />
                  <circle cx="40" cy="65" r="2" fill="#FFF" />
                  <circle cx="65" cy="35" r="3" fill="#F02D46" className="drop-shadow-[0_0_6px_#F02D46]" />
                  <circle cx="50" cy="50" r="4" fill="#FFF" className="drop-shadow-[0_0_8px_#F02D46]" />
                </svg>
              </div>
            </div>

            {/* Status tags */}
            <div className="w-full grid grid-cols-2 gap-1.5 font-technical text-[9px] text-[#919198]">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[#E2E2E6]">PREDICT</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[#E2E2E6]">ANALYZE</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[#E2E2E6]">SIMULATE</span>
              <span className="px-1.5 py-0.5 rounded bg-[#F02D46]/20 border border-[#F02D46]/40 text-[#F02D46] font-bold">DEFEND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
