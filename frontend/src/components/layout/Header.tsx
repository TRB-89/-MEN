import React, { useState, useEffect } from 'react';
import { Menu, Terminal, RefreshCw, AlertTriangle, Server, Search } from 'lucide-react';
import { useBackend } from '../../services/BackendContext';
import { ConnectBackendModal } from '../common/ConnectBackendModal';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenMobileNav }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const {
    health,
    isOnline,
    isChecking,
    isColdStarting,
    coldStartAttempt,
    baseUrl,
    isConnectModalOpen,
    setIsConnectModalOpen,
    checkHealth,
    wakeUpBackend,
  } = useBackend();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }) +
          ' ' +
          now.toLocaleTimeString('en-GB', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) +
          ' UTC'
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#050506]/90 backdrop-blur-md border-b border-[#E2E2E5]/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 border border-[#E2E2E5]/15 text-[#919198] hover:text-[#E2E2E5] hover:border-[#E2E2E5] rounded"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold tracking-tight text-[#F5F5F5] uppercase">
                {title}
              </h2>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono border border-[#B10F29]/40 bg-[#B10F29]/15 text-[#F02D46] rounded uppercase">
                BLACKSITE-OPS
              </span>
            </div>
            {subtitle && (
              <p className="font-mono text-xs text-[#919198] mt-0.5 hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick Command Palette Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="hidden sm:flex items-center gap-2 border border-[#E2E2E5]/15 px-2.5 py-1.5 bg-[#101013] hover:bg-[#19191D] hover:border-[#F02D46]/50 transition-colors font-technical text-xs text-[#919198] hover:text-[#E2E2E5] rounded-lg"
            title="Open Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#F02D46]" />
            <span className="text-[11px] font-mono">CMD</span>
            <kbd className="px-1.5 py-0.2 bg-[#050506] border border-[#E2E2E5]/20 text-[9px] text-[#E2E2E5] rounded">
              Ctrl K
            </kbd>
          </button>
          {/* Backend Connection Indicator & Trigger */}
          <button
            onClick={() => (isOnline ? checkHealth(true) : setIsConnectModalOpen(true))}
            disabled={isChecking || isColdStarting}
            className="flex items-center gap-2 border border-border px-2.5 py-1.5 bg-surface font-mono text-xs hover:border-chrome transition-colors cursor-pointer disabled:opacity-50"
            title={
              isOnline
                ? 'Backend connected and operational (click to re-verify)'
                : isColdStarting
                ? `Waking up backend (attempt ${coldStartAttempt}/5)...`
                : 'Backend offline. Click to configure or test connection.'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isChecking || isColdStarting
                  ? 'bg-accent animate-ping'
                  : isOnline
                  ? 'bg-success animate-pulse'
                  : 'bg-critical'
              }`}
            />
            <span className="text-[11px] text-chrome font-semibold uppercase hidden sm:inline">
              {isColdStarting
                ? `WAKING UP (${coldStartAttempt}/5)`
                : isChecking
                ? 'PROBING...'
                : isOnline
                ? 'ONLINE'
                : 'OFFLINE'}
            </span>
          </button>

          {/* Real-time System Clock */}
          <div className="flex items-center gap-2 font-mono text-xs text-chrome border border-border px-3 py-1.5 bg-surface">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span className="tracking-widest">{timeStr}</span>
          </div>
        </div>
      </header>

      {/* Backend Offline / Render Cold Start Telemetry Banner */}
      {health && !isOnline && (
        <div className="bg-critical/10 border-b border-critical/30 px-6 py-2.5 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-critical font-medium">
            <span className="w-2 h-2 rounded-full bg-critical animate-ping shrink-0" />
            <span className="text-xs">
              {isColdStarting ? (
                <>
                  [WAKING UP BACKEND] Neural engine is spinning up on Render Free Tier (attempt {coldStartAttempt}/5, ~60s boot time). Telemetry will auto-sync upon ready...
                </>
              ) : (
                <>
                  [BACKEND OFFLINE] Neural inference server unreachable. Target: <code className="text-chrome font-bold underline">{baseUrl}</code>
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-white text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Server className="w-3 h-3" />
              <span>CONNECT BACKEND</span>
            </button>
            <button
              onClick={() => wakeUpBackend()}
              disabled={isChecking || isColdStarting}
              className="text-chrome hover:text-white uppercase font-bold tracking-wider text-[11px] underline flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking || isColdStarting ? 'animate-spin' : ''}`} />
              <span>
                {isColdStarting
                  ? `SPINNING UP (${coldStartAttempt}/5)...`
                  : isChecking
                  ? 'PROBING...'
                  : 'WAKE UP'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Backend Configuration & Vercel Connect Modal */}
      <ConnectBackendModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  );
};
