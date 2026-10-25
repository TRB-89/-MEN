import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Terminal, 
  Cpu, 
  Network, 
  GitBranch, 
  ShieldAlert, 
  Database, 
  Activity, 
  Settings, 
  Home, 
  Server, 
  FileText, 
  ArrowRight, 
  CornerDownLeft, 
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { NetworkNode, IncidentRecord } from '../../types';

interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'TOPOLOGY ASSET' | 'INCIDENT DOSSIER' | 'SIMULATION';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'crimson' | 'green' | 'chrome';
  icon: React.ElementType;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [networkAssets, setNetworkAssets] = useState<NetworkNode[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Listen for global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open and preload real API items
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Preload real backend assets and incidents
      api.getNetworkAssets().then((res) => {
        if (res && res.assets) setNetworkAssets(res.assets.slice(0, 15));
      }).catch(() => {});

      api.getIncidents(undefined, undefined, 10, 0).then((res) => {
        if (res && res.incidents) setIncidents(res.incidents);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Static Navigation Routes
  const staticCommands: CommandItem[] = [
    {
      id: 'cmd-home',
      category: 'NAVIGATION',
      title: 'BLACKSITE HERO // HOMEPAGE',
      subtitle: 'Predict the Unknown. Control the Threat.',
      icon: Home,
      action: () => { navigate('/'); setIsOpen(false); },
    },
    {
      id: 'cmd-mod1',
      category: 'NAVIGATION',
      title: 'MODULE 01 — NEURAL THREAT DETECTION',
      subtitle: 'Random Forest, PyTorch MLP, and Isolation Forest consensus',
      badge: 'ONLINE',
      badgeColor: 'green',
      icon: Cpu,
      action: () => { navigate('/detection'); setIsOpen(false); },
    },
    {
      id: 'cmd-mod2',
      category: 'NAVIGATION',
      title: 'MODULE 02 — ATTACK GRAPH INTELLIGENCE',
      subtitle: 'NetworkX topological zero-trust infrastructure map',
      badge: 'TOPOLOGY',
      badgeColor: 'chrome',
      icon: Network,
      action: () => { navigate('/network'); setIsOpen(false); },
    },
    {
      id: 'cmd-mod3',
      category: 'NAVIGATION',
      title: 'MODULE 03 — ATTACK PATH PREDICTION',
      subtitle: 'Foresee high-probability lateral movement corridors',
      badge: 'PREDICTIVE',
      badgeColor: 'crimson',
      icon: GitBranch,
      action: () => { navigate('/prediction'); setIsOpen(false); },
    },
    {
      id: 'cmd-mod4',
      category: 'NAVIGATION',
      title: 'MODULE 04 — DEFENSE SIMULATION',
      subtitle: 'Autonomous blast radius containment and zero-trust quarantine',
      badge: 'SIMULATION',
      badgeColor: 'crimson',
      icon: ShieldAlert,
      action: () => { navigate('/defense'); setIsOpen(false); },
    },
    {
      id: 'cmd-mod5',
      category: 'NAVIGATION',
      title: 'MODULE 05 — INCIDENT MEMORY & ARCHIVES',
      subtitle: 'Immutable forensic records and MITRE ATT&CK dossiers',
      badge: 'SQLITE',
      badgeColor: 'chrome',
      icon: Database,
      action: () => { navigate('/incidents'); setIsOpen(false); },
    },
    {
      id: 'cmd-mod6',
      category: 'NAVIGATION',
      title: 'MODULE 06 — SOC COMMAND CENTER',
      subtitle: 'Unified DEFCON response posture and ingestion radar',
      badge: 'CONSOLE',
      badgeColor: 'green',
      icon: Activity,
      action: () => { navigate('/console'); setIsOpen(false); },
    },
    {
      id: 'cmd-sys',
      category: 'NAVIGATION',
      title: 'SYSTEM TELEMETRY & API CONFIG',
      subtitle: 'Inspect live FastAPI daemon connectivity and engine statuses',
      icon: Settings,
      action: () => { navigate('/system'); setIsOpen(false); },
    },
  ];

  // Dynamic Asset Items from live API
  const assetCommands: CommandItem[] = networkAssets.map((asset) => ({
    id: `asset-${asset.id}`,
    category: 'TOPOLOGY ASSET',
    title: `${asset.name} [${asset.id}]`,
    subtitle: `IP: ${asset.ip} • Zone: ${asset.zone} • Criticality: ${asset.criticality}`,
    badge: asset.security_status,
    badgeColor: asset.security_status === 'COMPROMISED' ? 'crimson' : 'chrome',
    icon: Server,
    action: () => {
      navigate('/network');
      setIsOpen(false);
    },
  }));

  // Dynamic Incident Items from live API
  const incidentCommands: CommandItem[] = incidents.map((inc) => ({
    id: `inc-${inc.id}`,
    category: 'INCIDENT DOSSIER',
    title: `${inc.title} (${inc.id})`,
    subtitle: `MITRE: ${inc.mitre_technique || 'T1059'} • Severity: ${inc.severity} • Status: ${inc.status}`,
    badge: inc.severity,
    badgeColor: inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'crimson' : 'chrome',
    icon: FileText,
    action: () => {
      navigate('/incidents');
      setIsOpen(false);
    },
  }));

  const allItems = [...staticCommands, ...assetCommands, ...incidentCommands];

  // Filter based on user query
  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-6">
          {/* Backdrop with heavy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#050506]/85 backdrop-blur-md"
          />

          {/* Command Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-[#101013] border border-[#E2E2E5]/15 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden font-technical z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#E2E2E5]/10 bg-[#19191D]/50 gap-3">
              <Search className="w-4 h-4 text-[#F02D46] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, modules, network assets, or incident records..."
                className="w-full bg-transparent text-[#F5F5F5] placeholder-[#919198] text-xs font-technical tracking-wider focus:outline-none"
              />
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] text-[#919198] border border-[#E2E2E5]/15 bg-[#101013]">
                ESC
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#919198] hover:text-[#E2E2E5] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="max-h-[380px] overflow-y-auto p-2 space-y-1 divide-y divide-[#E2E2E5]/5"
            >
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-[#919198] text-xs space-y-1 font-mono">
                  <Terminal className="w-6 h-6 mx-auto mb-2 text-[#F02D46]/70" />
                  <p>NO CYBER INTELLIGENCE ARTIFACTS MATCHING QUERY</p>
                  <p className="text-[10px] text-[#919198]/60">Check asset hostname or technique identifier</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#19191D] border-l-2 border-[#F02D46] pl-3.5 shadow-[inset_0_0_15px_rgba(240,45,70,0.08)]'
                          : 'hover:bg-[#19191D]/50 border-l-2 border-transparent pl-3.5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg border transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-[#B10F29]/20 border-[#F02D46]/60 text-[#F02D46]'
                              : 'bg-[#101013] border-[#E2E2E5]/10 text-[#919198]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-xs font-bold text-[#F5F5F5] truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded border font-mono tracking-wider ${
                                  item.badgeColor === 'crimson'
                                    ? 'bg-[#B10F29]/20 border-[#F02D46]/40 text-[#F02D46]'
                                    : item.badgeColor === 'green'
                                    ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]'
                                    : 'bg-[#E2E2E5]/10 border-[#E2E2E5]/20 text-[#E2E2E5]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#919198] truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-[9px] uppercase tracking-widest text-[#919198]/60 font-mono hidden md:inline-block">
                          {item.category}
                        </span>
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-[#F02D46]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="px-4 py-2.5 bg-[#050506] border-t border-[#E2E2E5]/10 flex items-center justify-between text-[10px] text-[#919198] font-mono">
              <div className="flex items-center gap-4">
                <span>[↑↓] NAVIGATE</span>
                <span>[↵] EXECUTE</span>
                <span>[ESC] CLOSE</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#F02D46]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F02D46] animate-pulse" />
                <span>ØMEN LIVE CONSOLE ACCESS</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
