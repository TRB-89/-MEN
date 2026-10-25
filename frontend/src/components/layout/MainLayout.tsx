import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OmenPageTransition } from '../ui';

export const MainLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Map route to page title and subtitle
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/console':
      case '/overview':
        return {
          title: 'THE ØMEN CONSOLE',
          subtitle: '06 / SOC COMMAND CENTER — Unified Autonomous Defense & Telemetry',
        };
      case '/detect':
      case '/detection':
        return {
          title: 'NEURAL DETECTION',
          subtitle: '01 / THREAT INTELLIGENCE — Multi-Model ML Ensemble (RF + MLP + ISO)',
        };
      case '/network':
        return {
          title: 'THE NETWORK HAS A MEMORY',
          subtitle: '02 / ATTACK GRAPH INTELLIGENCE — Topology Traversal & Critical Assets',
        };
      case '/prediction':
        return {
          title: 'FORESEE THE BREACH',
          subtitle: '03 / ATTACK PATH PREDICTION — Lateral Movement & Chokepoints',
        };
      case '/defense':
        return {
          title: 'CONTROL THE DAMAGE. PRESERVE THE SYSTEM.',
          subtitle: '04 / AUTONOMOUS DEFENSE — Sandboxed Containment & Multi-Objective Mitigation',
        };
      case '/history':
      case '/incidents':
        return {
          title: 'NOTHING GOES UNRECORDED',
          subtitle: '05 / INCIDENT MEMORY — Cryptographic Timeline & Audit Dossier',
        };
      case '/system':
      case '/settings':
        return {
          title: 'SYSTEM TELEMETRY',
          subtitle: '06 / RUNTIME SPECIFICATIONS — PyTorch, UNSW-NB15 & Hardware Metrics',
        };
      default:
        return {
          title: 'ØMEN TERMINAL',
          subtitle: 'Autonomous Cyber Threat Intelligence & Defense Simulation',
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <div className="min-h-screen bg-background text-chrome flex">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <OmenPageTransition key={location.pathname}>
            <Outlet />
          </OmenPageTransition>
        </main>
      </div>
    </div>
  );
};
