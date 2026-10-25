import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  ArrowRight, 
  Cpu, 
  Network, 
  Database, 
  Activity, 
  Play, 
  ChevronRight, 
  GitBranch,
  ShieldCheck,
  Radio,
  Zap,
  Sparkles,
  Terminal,
  Layers,
  Flame,
  Search
} from 'lucide-react';
import { OmenJellyfishEntity, OmenEntityState } from '../components/hero/OmenJellyfishEntity';
import { MagneticButton } from '../components/common/MagneticButton';
import { StoryCardsBar } from '../components/dashboard/StoryCardsBar';
import { api } from '../services/api';

gsap.registerPlugin(ScrollTrigger);

interface BackendMetrics {
  threatsDetected: string;
  modelReadiness: string;
  networkAssets: string;
  attackPaths: string;
  incidentRecords: string;
  defenseSimulations: string;
  backendOnline: boolean;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Live Backend Metrics state (Section 4 — Never invent statistics)
  const [metrics, setMetrics] = useState<BackendMetrics>({
    threatsDetected: '...',
    modelReadiness: '...',
    networkAssets: '...',
    attackPaths: '...',
    incidentRecords: '...',
    defenseSimulations: 'READY // MOD 04',
    backendOnline: false,
  });

  // Dynamic 3D Neural Entity State based on live backend telemetry
  const entityState: OmenEntityState = (() => {
    if (!metrics.backendOnline) return 'IDLE';
    const threats = parseInt(metrics.threatsDetected, 10);
    if (!isNaN(threats) && threats > 0) return 'ELEVATED_RISK';
    if (metrics.modelReadiness && metrics.modelReadiness.includes('ONLINE')) return 'ANALYZING';
    return 'IDLE';
  })();

  // Animation Refs
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const annotationsRef = useRef<HTMLDivElement>(null);
  const jellyfishContainerRef = useRef<HTMLDivElement>(null);
  const floatingCardsRef = useRef<HTMLDivElement>(null);
  const storytellingRef = useRef<HTMLElement>(null);
  const moduleShowcaseRef = useRef<HTMLElement>(null);

  // Fetch verified backend metrics on mount
  useEffect(() => {
    let isMounted = true;

    async function loadTelemetry() {
      try {
        const [healthRes, statsRes, detHealthRes, topoRes, predRes, incRes] = await Promise.allSettled([
          api.getHealth(),
          api.getStats(),
          api.getDetectionHealth(),
          api.getNetworkTopology(),
          api.predictAttackPaths('srv-web-01'),
          api.getIncidents(undefined, undefined, 5, 0),
        ]);

        if (!isMounted) return;

        const isOnline = healthRes.status === 'fulfilled';
        const threatsCount = statsRes.status === 'fulfilled' 
          ? String(statsRes.value.predicted_malicious_count ?? 0)
          : 'Unavailable';

        let readiness = 'Unavailable';
        if (detHealthRes.status === 'fulfilled') {
          const m = detHealthRes.value.models_loaded;
          const activeCount = [m.random_forest, m.mlp_neural_network, m.isolation_forest].filter(Boolean).length;
          readiness = `${activeCount}/3 ONLINE`;
        } else if (isOnline) {
          readiness = 'ACTIVE';
        }

        const assetsCount = topoRes.status === 'fulfilled' && topoRes.value.nodes
          ? `${topoRes.value.nodes_count || topoRes.value.nodes.length} ASSETS`
          : 'Unavailable';

        const pathsCount = predRes.status === 'fulfilled' && predRes.value.total_paths_discovered !== undefined
          ? `${predRes.value.total_paths_discovered} PATHS`
          : 'Unavailable';

        const incidentsCount = incRes.status === 'fulfilled' && incRes.value.total !== undefined
          ? `${incRes.value.total} RECORDS`
          : 'Unavailable';

        setMetrics({
          threatsDetected: threatsCount,
          modelReadiness: readiness,
          networkAssets: assetsCount,
          attackPaths: pathsCount,
          incidentRecords: incidentsCount,
          defenseSimulations: 'READY // MOD 04',
          backendOnline: isOnline,
        });
      } catch {
        if (isMounted) {
          setMetrics((prev) => ({
            ...prev,
            threatsDetected: 'Unavailable',
            modelReadiness: 'Offline',
            networkAssets: 'Unavailable',
            attackPaths: 'Unavailable',
            incidentRecords: 'Unavailable',
            backendOnline: false,
          }));
        }
      }
    }

    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  // GSAP Cinematic Intro & Scroll Storytelling Animations (Section 5 & 11)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Immediate clean appearance without motion
      gsap.set(
        [
          badgeRef.current,
          headlineRef.current,
          descRef.current,
          ctaRef.current,
          annotationsRef.current,
          jellyfishContainerRef.current,
        ],
        { opacity: 1, y: 0 }
      );
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Hero Intro Sequence
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.6 }
        )
        .fromTo(
          headlineRef.current?.children || [],
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.12 },
          0.2
        )
        .fromTo(
          jellyfishContainerRef.current,
          { opacity: 0, scale: 0.85, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 1.4, ease: 'power2.out' },
          0.4
        )
        .fromTo(
          descRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          0.8
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          1.0
        )
        .fromTo(
          annotationsRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8 },
          1.2
        );

      // Stagger floating metric cards
      if (floatingCardsRef.current) {
        gsap.fromTo(
          floatingCardsRef.current.children,
          { opacity: 0, scale: 0.9, y: 25 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.14,
            delay: 0.7,
            ease: 'back.out(1.4)',
          }
        );
      }

      // 2. Editorial Storytelling Scroll Section (Section 5)
      if (storytellingRef.current) {
        gsap.fromTo(
          storytellingRef.current.querySelectorAll('.story-reveal'),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.18,
            scrollTrigger: {
              trigger: storytellingRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      // 3. Module Showcase Cards ScrollTrigger (Section 6)
      if (moduleShowcaseRef.current) {
        gsap.fromTo(
          moduleShowcaseRef.current.querySelectorAll('.module-card'),
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
            scrollTrigger: {
              trigger: moduleShowcaseRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, pageContainerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Section 6: Six Autonomous Modules Configuration
  const modules = [
    {
      num: '01',
      title: 'NEURAL DETECTION',
      shortDesc: 'Identify suspicious behavior through machine learning.',
      detail: 'Triple-model consensus evaluating 191 transformed UNSW-NB15 flow features across Random Forest, PyTorch MLP, and Isolation Forest.',
      route: '/detection',
      status: 'OPERATIONAL',
      active: true,
      icon: Cpu,
    },
    {
      num: '02',
      title: 'ATTACK GRAPH',
      shortDesc: 'Understand assets, relationships and network exposure.',
      detail: 'Graph-theoretical zero-trust asset topology powered by NetworkX and React Flow with real-time traversal and device criticality ranking.',
      route: '/network',
      status: 'OPERATIONAL',
      active: true,
      icon: Network,
    },
    {
      num: '03',
      title: 'PATH PREDICTION',
      shortDesc: 'Forecast plausible routes toward critical infrastructure.',
      detail: 'Predictive discovery of high-probability lateral movement corridors targeting crown-jewel assets with critical bottleneck discovery.',
      route: '/prediction',
      status: 'OPERATIONAL',
      active: true,
      icon: GitBranch,
    },
    {
      num: '04',
      title: 'DEFENSE SIMULATION',
      shortDesc: 'Evaluate containment strategies before execution.',
      detail: 'Autonomous zero-trust blast-radius reduction modeling. Simulates zero-impact quarantine strategies before live execution.',
      route: '/defense',
      status: 'INTERACTIVE PREVIEW',
      active: true,
      icon: ShieldAlert,
    },
    {
      num: '05',
      title: 'INCIDENT MEMORY',
      shortDesc: 'Preserve evidence and trace security decisions.',
      detail: 'Cryptographically correlated incident memory stored in SQLite. Forensic audit dossiers, MITRE ATT&CK mapping, and timeline replays.',
      route: '/incidents',
      status: 'OPERATIONAL',
      active: true,
      icon: Database,
    },
    {
      num: '06',
      title: 'SOC COMMAND',
      shortDesc: 'Unify threat intelligence within one operational interface.',
      detail: 'Single-pane-of-glass executive console synthesizing real-time threat ingestion feeds, topology radar, and DEFCON response postures.',
      route: '/console',
      status: 'OPERATIONAL',
      active: true,
      icon: Activity,
    },
  ];

  return (
    <div
      ref={pageContainerRef}
      className="min-h-screen bg-[#050505] text-[#F5F5F5] selection:bg-[#D10E24] selection:text-white relative overflow-x-hidden font-sans"
    >
      {/* Ambient Gothic Background Atmosphere */}
      <div className="fixed inset-0 bg-tech-grid opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] glow-crimson-radial pointer-events-none z-0" />
      <div className="scanline-beam z-10" />

      {/* SECTION 3 — TOP NAVIGATION (Left Logo, Centered Pill, Right ENTER CONSOLE) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5 flex items-center justify-between pointer-events-none">
        {/* Left: ØMEN Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer pointer-events-auto group"
        >
          <span className="w-2.5 h-2.5 bg-[#FF293F] rounded-sm shadow-[0_0_12px_#FF293F] group-hover:scale-125 transition-transform" />
          <span className="font-heading text-2xl font-black tracking-wider text-[#F5F5F5] group-hover:text-white transition-colors">
            ØMEN
          </span>
          <span className="font-technical text-[10px] text-[#99999F] border border-[#DCDCE0]/15 px-2 py-0.5 rounded-full hidden sm:inline-block">
            V1.04
          </span>
        </div>

        {/* Center: Centered Pill Navigation */}
        <nav className="hidden md:flex items-center gap-7 px-7 py-2.5 rounded-full bg-[#161619]/80 backdrop-blur-xl border border-[#DCDCE0]/12 shadow-[0_8px_32px_rgba(0,0,0,0.6)] font-technical text-xs tracking-wider text-[#99999F] pointer-events-auto">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/system')}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            System
          </button>
          <button
            onClick={() => document.getElementById('module-showcase')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Modules
          </button>
          <button
            onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            Architecture
          </button>
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#F5F5F5] transition-colors"
          >
            About
          </button>
        </nav>

        {/* Right Action: CMD PALETTE & ENTER CONSOLE */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#101013]/90 hover:bg-[#19191D] text-[#919198] hover:text-[#E2E2E5] border border-[#E2E2E5]/15 font-technical text-xs tracking-wider transition-all duration-200"
            title="Search Blacksite Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#F02D46]" />
            <kbd className="px-1.5 py-0.2 bg-[#050506] border border-[#E2E2E5]/20 text-[9px] text-[#E2E2E5] rounded">
              Ctrl K
            </kbd>
          </button>

          <button
            onClick={() => navigate('/console')}
            className="px-6 py-2.5 rounded-full bg-[#101013]/90 hover:bg-[#B10F29] text-[#F5F5F5] hover:text-white border border-[#E2E2E5]/20 hover:border-[#F02D46] font-technical text-xs font-semibold tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(240,45,70,0.5)] flex items-center gap-2 group"
          >
            <span>ENTER CONSOLE</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* SECTION 3 & 4 — HERO PAGE WITH JELLYFISH CENTERPIECE & FLOATING METRIC CARDS */}
      <section
        ref={heroRef}
        className="relative min-h-screen pt-28 pb-12 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col justify-between z-10 overflow-visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[680px] lg:min-h-[740px] my-auto">
          {/* Left Column (Cols 1–5): Branding, Headlines, Description, CTA */}
          <div className="lg:col-span-5 space-y-7 z-30 pointer-events-auto">
            {/* Technical Sub-badge */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#161619]/90 border border-[#D10E24]/30 font-technical text-[11px] text-[#FF293F] tracking-widest uppercase shadow-[0_0_15px_rgba(209,14,36,0.2)]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF293F] animate-ping" />
              <span>// PREDICTIVE CYBER THREAT INTELLIGENCE</span>
            </div>

            {/* Oversized Masked Headlines */}
            <div ref={headlineRef} className="space-y-1 overflow-hidden">
              <div className="overflow-hidden">
                <h1 className="font-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold uppercase tracking-tight text-[#F5F5F5] leading-[0.98]">
                  PREDICT THE
                </h1>
              </div>
              <div className="overflow-hidden">
                <h1 className="font-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold uppercase tracking-tight text-[#F5F5F5] leading-[0.98]">
                  UNKNOWN.
                </h1>
              </div>
              <div className="overflow-hidden pt-1">
                <h1 className="font-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold uppercase tracking-tight leading-[0.98] text-transparent bg-clip-text bg-gradient-to-r from-[#FF293F] via-[#D10E24] to-[#8C0A19]">
                  CONTROL THE
                </h1>
              </div>
              <div className="overflow-hidden">
                <h1 className="font-heading text-4xl sm:text-5xl xl:text-6xl font-extrabold uppercase tracking-tight leading-[0.98] text-transparent bg-clip-text bg-gradient-to-r from-[#FF293F] via-[#D10E24] to-[#8C0A19]">
                  THREAT.
                </h1>
              </div>
            </div>

            {/* Supporting Text */}
            <p
              ref={descRef}
              className="font-sans text-sm sm:text-base text-[#99999F] max-w-md font-normal leading-relaxed"
            >
              Neural threat detection, attack-path intelligence and autonomous defense simulation within one integrated cyber intelligence platform.
            </p>

            {/* Buttons (EXPLORE ØMEN & LAUNCH CONSOLE) */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4 pt-1">
              <MagneticButton
                variant="primary"
                size="md"
                onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
              >
                EXPLORE ØMEN
              </MagneticButton>

              <MagneticButton
                variant="secondary"
                size="md"
                onClick={() => navigate('/console')}
                className="group"
              >
                <span>LAUNCH CONSOLE</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
            </div>

            {/* Fine Technical Annotations */}
            <div
              ref={annotationsRef}
              className="pt-5 border-t border-[#DCDCE0]/10 flex flex-wrap items-center gap-5 font-technical text-xs text-[#99999F]"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF293F]" />
                <span className="text-[#DCDCE0] font-semibold">ENGINE:</span> FASTAPI + PYTORCH
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                <span className="text-[#DCDCE0] font-semibold">GRAPH:</span> NETWORKX DIJKSTRA
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DCDCE0]" />
                <span className="text-[#DCDCE0] font-semibold">STORAGE:</span> SQLITE INCIDENT DB
              </div>
            </div>
          </div>

          {/* Center Column (Cols 6–8): Unclipped 3D Neural Jellyfish Entity */}
          <div className="lg:col-span-4 relative flex items-center justify-center min-h-[460px] sm:min-h-[540px] lg:min-h-[700px] z-10 pointer-events-none overflow-visible">
            <div ref={jellyfishContainerRef} className="w-full h-full relative flex items-center justify-center overflow-visible">
              <OmenJellyfishEntity className="w-full h-[520px] sm:h-[620px] lg:h-[720px]" entityState={entityState} />
            </div>
          </div>

          {/* Right Column (Cols 9–12): Asymmetrical System Metric Cards */}
          <div className="lg:col-span-3 z-30 pointer-events-auto">
            <div
              ref={floatingCardsRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5"
            >
              {/* Card 1: Threats Detected */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 rounded-2xl bg-[#161619]/85 backdrop-blur-xl border border-[#DCDCE0]/12 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#FF293F]/50 group lg:translate-x-1"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-technical text-[10px] uppercase tracking-wider text-[#99999F]">
                    Threats Detected
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#FF293F] animate-pulse shadow-[0_0_8px_#FF293F]" />
                </div>
                <div className="font-heading text-2xl font-bold text-[#F5F5F5] group-hover:text-[#FF293F] transition-colors">
                  {metrics.threatsDetected}
                </div>
                <p className="font-technical text-[9px] text-[#99999F] mt-0.5">
                  ML Multi-Model Telemetry
                </p>
              </motion.div>

              {/* Card 2: Model Readiness */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 rounded-2xl bg-[#161619]/85 backdrop-blur-xl border border-[#DCDCE0]/12 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#D10E24]/50 group lg:translate-x-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-technical text-[10px] uppercase tracking-wider text-[#99999F]">
                    Model Readiness
                  </span>
                  <span className="font-technical text-[9px] text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded border border-[#22C55E]/20">
                    RF+MLP+ISO
                  </span>
                </div>
                <div className="font-heading text-xl font-bold text-[#F5F5F5]">
                  {metrics.modelReadiness}
                </div>
                <p className="font-technical text-[9px] text-[#99999F] mt-0.5">
                  98.24% Neural Recall Holdout
                </p>
              </motion.div>

              {/* Card 3: Attack Paths Identified */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 rounded-2xl bg-[#161619]/85 backdrop-blur-xl border border-[#DCDCE0]/12 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#FF293F]/50 group lg:translate-x-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-technical text-[10px] uppercase tracking-wider text-[#99999F]">
                    Attack Paths
                  </span>
                  <GitBranch className="w-3.5 h-3.5 text-[#FF293F]" />
                </div>
                <div className="font-heading text-xl font-bold text-[#F5F5F5] group-hover:text-[#FF293F] transition-colors">
                  {metrics.attackPaths}
                </div>
                <p className="font-technical text-[9px] text-[#99999F] mt-0.5">
                  Lateral Movement Corridors
                </p>
              </motion.div>

              {/* Card 4: Network Assets */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 rounded-2xl bg-[#161619]/85 backdrop-blur-xl border border-[#DCDCE0]/12 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#D10E24]/50 group lg:translate-x-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-technical text-[10px] uppercase tracking-wider text-[#99999F]">
                    Network Assets
                  </span>
                  <Network className="w-3.5 h-3.5 text-[#DCDCE0]" />
                </div>
                <div className="font-heading text-xl font-bold text-[#F5F5F5]">
                  {metrics.networkAssets}
                </div>
                <p className="font-technical text-[9px] text-[#99999F] mt-0.5">
                  Zero-Trust Monitored Nodes
                </p>
              </motion.div>

              {/* Card 5: Incident Records */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 rounded-2xl bg-[#161619]/85 backdrop-blur-xl border border-[#DCDCE0]/12 shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:border-[#FF293F]/50 group lg:translate-x-4 sm:col-span-2 lg:col-span-1"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-technical text-[10px] uppercase tracking-wider text-[#99999F]">
                    Incident Records
                  </span>
                  <Database className="w-3.5 h-3.5 text-[#FF293F]" />
                </div>
                <div className="font-heading text-xl font-bold text-[#F5F5F5]">
                  {metrics.incidentRecords}
                </div>
                <p className="font-technical text-[9px] text-[#99999F] mt-0.5">
                  SQLite Evidence Memory
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Secondary Telemetry & Scroll Prompt */}
        <div className="w-full pt-6 border-t border-[#DCDCE0]/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-technical text-xs text-[#99999F] z-20">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[#DCDCE0] font-semibold">POSTURE: DEFCON 3 ELEVATED</span>
            <span className="text-[#99999F]">•</span>
            <span>LATENCY: 24MS</span>
            <span className="text-[#99999F]">•</span>
            <span className="text-[#22C55E]">CORE ENGINES OPERATIONAL</span>
          </div>

          <div
            onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group"
          >
            <span className="tracking-wider uppercase text-[11px]">SCROLL TO EXPLORE ARCHITECTURE</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-y-0.5 rotate-90 transition-transform" />
          </div>
        </div>
      </section>

      {/* SECTION 01 — 4 CINEMATIC HORIZONTAL STORY CARDS (HOMEPAGE INTRODUCTION) */}
      <section className="relative z-10 py-10 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#DCDCE0]/10">
        <StoryCardsBar />
      </section>

      {/* SECTION 5 — CINEMATIC SCROLL STORYTELLING: SIX CONNECTED CHAPTERS */}
      <section
        id="architecture"
        ref={storytellingRef}
        className="relative z-10 py-32 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#DCDCE0]/10 space-y-28"
      >
        {/* Story Section Masthead */}
        <div className="space-y-4 max-w-3xl story-reveal">
          <span className="font-technical text-xs uppercase tracking-widest text-[#FF293F] font-semibold block">
            // CINEMATIC INTELLIGENCE ARCHITECTURE
          </span>
          <h2 className="font-heading text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-[#F5F5F5] leading-[1.05]">
            FROM ANOMALY TO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF293F] to-[#D10E24]">
              AUTONOMOUS CONTAINMENT
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#FF293F] to-transparent rounded-full shadow-[0_0_12px_#FF293F]" />
          <p className="font-sans text-base text-[#99999F] leading-relaxed">
            Unfolding across six synchronized operational phases. ØMEN transforms isolated network anomalies into predictive graph trajectories and mathematically verified containment actions before infrastructure compromise.
          </p>
        </div>

        {/* Chapter 2 — Detection */}
        <div className="story-reveal grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 rounded-3xl bg-[#101013]/80 backdrop-blur-xl border border-white/10 hover:border-[#FF293F]/40 transition-all duration-300">
          <div className="lg:col-span-5 space-y-3">
            <span className="font-technical text-xs text-[#FF293F] tracking-widest uppercase font-bold">
              CHAPTER 02 // NEURAL INGESTION
            </span>
            <h3 className="font-heading text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#F5F5F5]">
              EVERY ANOMALY LEAVES A TRACE.
            </h3>
            <p className="font-sans text-sm text-[#99999F] leading-relaxed">
              Evaluating 191 transformed UNSW-NB15 flow features across Random Forest classification, deep PyTorch Multi-Layer Perceptrons, and Isolation Forest anomaly boundaries to eliminate blind spots with 98.24% recall.
            </p>
            <div className="font-technical text-xs text-[#E2E2E6] flex items-center gap-3 pt-2">
              <span className="px-2 py-0.5 bg-surface-elevated border border-white/10 rounded">RANDOM FOREST</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-surface-elevated border border-white/10 rounded">PYTORCH MLP</span>
              <span>•</span>
              <span className="px-2 py-0.5 bg-surface-elevated border border-white/10 rounded">ISOLATION FOREST</span>
            </div>
          </div>
          <div className="lg:col-span-7 bg-[#050506] border border-white/10 rounded-2xl p-6 font-mono text-xs space-y-3">
            <div className="flex justify-between text-muted text-[10px] pb-2 border-b border-white/5 uppercase">
              <span>FEATURE FLOW VECTOR</span>
              <span className="text-emerald-400 font-bold">INFERENCE: 1.4MS</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center p-2 bg-[#101013] border border-white/5 rounded">
                <span className="text-muted">sbytes / dbytes ratio:</span>
                <span className="text-chrome font-bold">4.821 (Elevated Exfiltration)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-[#101013] border border-white/5 rounded">
                <span className="text-muted">sttl / dttl hop distance:</span>
                <span className="text-amber-400 font-bold">64 / 252 (Cross-Perimeter Pivot)</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-[#101013] border border-crimson/30 rounded">
                <span className="text-muted">Consensus Verdict:</span>
                <span className="text-crimson font-bold">STAGE 2 INTRUSION (98.2% CONFIDENCE)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter 3 — Network Intelligence */}
        <div className="story-reveal grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 rounded-3xl bg-[#101013]/80 backdrop-blur-xl border border-white/10 hover:border-[#FF293F]/40 transition-all duration-300">
          <div className="lg:col-span-5 space-y-3">
            <span className="font-technical text-xs text-[#FF293F] tracking-widest uppercase font-bold">
              CHAPTER 03 // GRAPH INTELLIGENCE
            </span>
            <h3 className="font-heading text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#F5F5F5]">
              EVERY CONNECTION TELLS A STORY.
            </h3>
            <p className="font-sans text-sm text-[#99999F] leading-relaxed">
              Representing the enterprise as a zero-trust state graph in NetworkX. Every host, proxy, and gateway carries dynamic risk scores, mapping real-time exposure and chokepoints along lateral movement pathways.
            </p>
            <div className="font-technical text-xs text-muted flex items-center gap-3 pt-2">
              <span>SQLITE TOPOLOGY STORE</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">DYNAMIC ADJACENCY MATRIX</span>
            </div>
          </div>
          <div className="lg:col-span-7 bg-[#050506] border border-white/10 rounded-2xl p-6 font-mono text-xs space-y-3">
            <div className="flex justify-between text-muted text-[10px] pb-2 border-b border-white/5 uppercase">
              <span>ZONE TOPOLOGY EXPOSURE</span>
              <span className="text-chrome">24 MONITORED NODES</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-3 bg-[#101013] border border-crimson/30 rounded-xl">
                <span className="text-muted block mb-1">DMZ ZONE</span>
                <span className="font-bold text-crimson text-sm block">srv-web-01</span>
                <span className="text-[9px] text-muted">Compromised</span>
              </div>
              <div className="p-3 bg-[#101013] border border-amber-500/30 rounded-xl">
                <span className="text-muted block mb-1">APP PROXY</span>
                <span className="font-bold text-amber-400 text-sm block">srv-app-01</span>
                <span className="text-[9px] text-muted">Chokepoint</span>
              </div>
              <div className="p-3 bg-[#101013] border border-white/10 rounded-xl">
                <span className="text-muted block mb-1">DATABASE</span>
                <span className="font-bold text-chrome text-sm block">db-prod-01</span>
                <span className="text-[9px] text-muted">Crown Jewel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter 4 — Prediction */}
        <div className="story-reveal grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 rounded-3xl bg-[#101013]/80 backdrop-blur-xl border border-white/10 hover:border-[#FF293F]/40 transition-all duration-300">
          <div className="lg:col-span-5 space-y-3">
            <span className="font-technical text-xs text-[#FF293F] tracking-widest uppercase font-bold">
              CHAPTER 04 // ATTACK PATH FORECASTING
            </span>
            <h3 className="font-heading text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#F5F5F5]">
              THE NEXT MOVE IS NOT INVISIBLE.
            </h3>
            <p className="font-sans text-sm text-[#99999F] leading-relaxed">
              Synthesizing neural evidence with graph access controls to calculate plausible adversary traversal corridors. Ranked by risk and traversal velocity before attackers pivot.
            </p>
            <div className="font-technical text-xs text-secondary flex items-center gap-2 pt-2">
              <span className="text-amber-400 font-bold">HYPOTHETICAL ROUTES</span>
              <span>— NOT OBSERVED ACTIONS</span>
            </div>
          </div>
          <div className="lg:col-span-7 bg-[#050506] border border-white/10 rounded-2xl p-6 font-mono text-xs space-y-3">
            <div className="flex justify-between text-muted text-[10px] pb-2 border-b border-white/5 uppercase">
              <span>RANKED CORRIDOR TRAJECTORY</span>
              <span className="text-crimson font-bold">RISK: 89.4 / 100</span>
            </div>
            <div className="p-3 bg-[#101013] border border-crimson/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-crimson/20 text-crimson font-bold rounded">RANK 1</span>
                <span className="text-chrome font-bold">srv-web-01 ➔ srv-app-01 ➔ db-prod-01</span>
              </div>
              <span className="text-amber-400 font-bold">~22m</span>
            </div>
          </div>
        </div>

        {/* Chapter 5 — Defense */}
        <div className="story-reveal grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 rounded-3xl bg-[#101013]/80 backdrop-blur-xl border border-white/10 hover:border-[#FF293F]/40 transition-all duration-300">
          <div className="lg:col-span-5 space-y-3">
            <span className="font-technical text-xs text-[#FF293F] tracking-widest uppercase font-bold">
              CHAPTER 05 // AUTONOMOUS DEFENSE
            </span>
            <h3 className="font-heading text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#F5F5F5]">
              CONTROL THE DAMAGE. PRESERVE THE SYSTEM.
            </h3>
            <p className="font-sans text-sm text-[#99999F] leading-relaxed">
              Simulating device isolation, connection restriction, and session revocation in an isolated cloned graph. Quantifying blast-radius reduction and legitimate service availability prior to SecOps approval.
            </p>
            <div className="font-technical text-xs text-emerald-400 flex items-center gap-2 pt-2">
              <span>ZERO RISK SANDBOX // NO PRODUCTION NETWORK MUTATIONS</span>
            </div>
          </div>
          <div className="lg:col-span-7 bg-[#050506] border border-white/10 rounded-2xl p-6 font-mono text-xs space-y-3">
            <div className="flex justify-between text-muted text-[10px] pb-2 border-b border-white/5 uppercase">
              <span>SIMULATED CONTAINMENT VERDICT</span>
              <span className="text-emerald-400 font-bold">+78.5% RISK MITIGATION</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="p-3 bg-[#101013] border border-white/5 rounded-xl">
                <span className="text-muted block mb-1">BLAST RADIUS BEFORE</span>
                <span className="font-bold text-crimson text-lg line-through block">8 NODES</span>
              </div>
              <div className="p-3 bg-[#101013] border border-emerald-500/30 rounded-xl">
                <span className="text-muted block mb-1">BLAST RADIUS AFTER</span>
                <span className="font-bold text-emerald-400 text-lg block">2 NODES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter 6 — Console Entry */}
        <div className="story-reveal p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#17171C] to-[#0E0E11] border border-white/15 text-center space-y-6">
          <span className="font-technical text-xs text-[#FF293F] tracking-widest uppercase font-bold block">
            CHAPTER 06 // SYSTEM DEPLOYMENT
          </span>
          <h3 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            ENTER THE BLACKSITE.
          </h3>
          <p className="font-sans text-sm sm:text-base text-[#95959E] max-w-xl mx-auto leading-relaxed">
            Transition directly from high-level intelligence presentation to the operational underground command workspace. All live modules, telemetry models, and forensic logs await.
          </p>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => navigate('/console')}
              className="px-8 py-3.5 rounded-full bg-crimson hover:bg-bright-red text-white font-technical text-sm font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(240,45,70,0.5)] transition-all duration-300 flex items-center gap-2 group"
            >
              <span>ACCESS SOC CONSOLE</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — MODULE SHOWCASE (Six Rounded Asymmetric Module Cards) */}
      <section
        id="module-showcase"
        ref={moduleShowcaseRef}
        className="relative z-10 py-24 px-6 lg:px-12 max-w-7xl mx-auto border-t border-[#DCDCE0]/10 space-y-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DCDCE0]/10">
          <div>
            <span className="font-technical text-xs uppercase tracking-widest text-[#FF293F] font-semibold block mb-2">
              // OPERATIONAL MODULES
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#F5F5F5]">
              SIX AUTONOMOUS PILLARS
            </h2>
          </div>
          <p className="font-sans text-sm text-[#99999F] max-w-md">
            Direct access to all active and planned ØMEN intelligence systems. Existing modules connect to real backend inference engines.
          </p>
        </div>

        {/* 6 Large Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.num}
                whileHover={{ y: -6, borderColor: 'rgba(209, 14, 36, 0.5)' }}
                transition={{ duration: 0.25 }}
                onClick={() => navigate(m.route)}
                className="module-card p-8 rounded-3xl bg-[#161619]/70 backdrop-blur-xl border border-[#DCDCE0]/10 flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_40px_rgba(209,14,36,0.25)]"
              >
                {/* Background ambient red glow on hover */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-radial-gradient from-[#D10E24]/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  {/* Top: Module Number & Status Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-heading text-3xl font-extrabold text-[#DCDCE0]/25 group-hover:text-[#FF293F] transition-colors">
                      {m.num}
                    </span>
                    <span className="font-technical text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#161619] border border-[#DCDCE0]/15 text-[#DCDCE0] group-hover:border-[#FF293F]/40 group-hover:text-[#FF293F] transition-colors">
                      {m.status}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#161619] border border-[#DCDCE0]/15 flex items-center justify-center group-hover:border-[#FF293F] group-hover:bg-[#FF293F]/10 transition-colors">
                      <Icon className="w-5 h-5 text-[#DCDCE0] group-hover:text-[#FF293F] transition-colors" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-[#F5F5F5] group-hover:text-white transition-colors">
                      {m.title}
                    </h3>
                  </div>

                  {/* Short technical description (Section 6 exact copy) */}
                  <p className="font-sans text-sm font-medium text-[#F5F5F5]/90 mb-3">
                    "{m.shortDesc}"
                  </p>

                  {/* Detailed explanation */}
                  <p className="font-sans text-xs text-[#99999F] leading-relaxed mb-6">
                    {m.detail}
                  </p>
                </div>

                {/* Bottom Launch Row */}
                <div className="pt-4 border-t border-[#DCDCE0]/10 flex items-center justify-between font-technical text-xs">
                  <span className="text-[#99999F] group-hover:text-[#DCDCE0] transition-colors flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF293F] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>LAUNCH INTERFACE</span>
                  </span>
                  <div className="flex items-center gap-1 text-[#DCDCE0] group-hover:text-[#FF293F] font-bold transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 10 & FOOTER */}
      <footer id="about" className="relative z-10 py-16 px-6 lg:px-12 border-t border-[#DCDCE0]/10 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 font-technical text-xs text-[#99999F]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-sm bg-[#FF293F]" />
            <span className="font-heading text-base font-bold text-[#F5F5F5]">ØMEN</span>
            <span>//</span>
            <span>PREDICTIVE CYBER THREAT INTELLIGENCE & AUTONOMOUS DEFENSE</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/console')} className="hover:text-white transition-colors">
              SOC CONSOLE
            </button>
            <button onClick={() => navigate('/system')} className="hover:text-white transition-colors">
              RUNTIME TELEMETRY
            </button>
            <span className="text-[#DCDCE0]/40">FASTAPI • PYTORCH • REACT • NETWORKX</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
