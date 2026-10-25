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
  Layers,
  GitBranch,
  Radio
} from 'lucide-react';
import { OmenCore3D } from '../components/hero/OmenCore3D';
import { OmenButton, OmenBadge } from '../components/ui';
import { api } from '../services/api';

gsap.registerPlugin(ScrollTrigger);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [engineStatus, setEngineStatus] = useState<string>('ONLINE');
  const [totalNodes, setTotalNodes] = useState<number>(10);

  // Animation Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineLine1Ref = useRef<HTMLHeadingElement>(null);
  const headlineLine2Ref = useRef<HTMLHeadingElement>(null);
  const core3DRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const moduleSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Non-blocking telemetry query
    api.getHealth()
      .then((res) => {
        setEngineStatus(res.status === 'online' ? 'ACTIVE DEFENSE ONLINE' : 'LOCAL ENGINE READY');
        if (res.topology_devices_count) setTotalNodes(res.topology_devices_count);
      })
      .catch(() => {
        setEngineStatus('ACTIVE LOCAL MODE');
      });
  }, []);

  // Task 4 & 5: GSAP Cinematic Hero Timeline + ScrollTrigger Choreography
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Immediate reveal without delay
      gsap.set(
        [
          badgeRef.current,
          headlineLine1Ref.current,
          headlineLine2Ref.current,
          core3DRef.current,
          descRef.current,
          ctaRef.current,
          metaRef.current,
        ],
        { opacity: 1, y: 0, clipPath: 'none' }
      );
      return;
    }

    const ctx = gsap.context(() => {
      // Task 4 Hero Timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 0.0s - 0.5s: Technical framing badge appears
      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
        // 0.5s - 1.3s: Large headline reveals using masked typography
        .fromTo(
          headlineLine1Ref.current,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8 },
          0.5
        )
        .fromTo(
          headlineLine2Ref.current,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8 },
          0.65
        )
        // 0.9s - 2.0s: 3D Core assembles and gains crimson illumination
        .fromTo(
          core3DRef.current,
          { opacity: 0, scale: 0.75 },
          { opacity: 1, scale: 1, duration: 1.1, ease: 'back.out(1.2)' },
          0.9
        )
        // 1.5s - 2.4s: Description, technical labels and CTAs appear
        .fromTo(
          descRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6 },
          1.5
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.6 },
          1.7
        )
        .fromTo(
          metaRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          1.9
        );

      // Task 5 ScrollTrigger for editorial module showcase
      if (moduleSectionRef.current) {
        gsap.fromTo(
          '.module-editorial-card',
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            scrollTrigger: {
              trigger: moduleSectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, heroRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const modules = [
    {
      num: '01',
      title: 'NEURAL THREAT DETECTION',
      category: 'SUPERVISED & UNSUPERVISED ML',
      desc: 'Triple-model consensus evaluating 191 transformed UNSW-NB15 flow features across Random Forest (90.52% Acc), deep PyTorch MLP (98.24% Recall), and calibrated Isolation Forest outlier isolation.',
      route: '/detection',
      metrics: '191 FEATURES // 0.5000 THRESHOLD',
      icon: Cpu,
    },
    {
      num: '02',
      title: 'ATTACK GRAPH INTELLIGENCE',
      category: 'NETWORK TOPOLOGY GRAPH',
      desc: 'Graph-theoretical mapping of zero-trust enterprise assets powered by NetworkX and React Flow. Real-time traversal tracking, device criticality scoring, and dynamic edge vulnerability degradation.',
      route: '/network',
      metrics: `${totalNodes} MONITORED NODES // MITRE ATT&CK`,
      icon: Network,
    },
    {
      num: '03',
      title: 'ATTACK PATH PREDICTION',
      category: 'HEURISTIC PATH DISCOVERY',
      desc: 'Predictive discovery of high-probability lateral movement corridors targeting crown-jewel assets. Computes critical bottleneck chokepoints and traversal timelines.',
      route: '/prediction',
      metrics: 'MULTI-HOP CORRIDORS // CHOKEPOINTS',
      icon: GitBranch,
    },
    {
      num: '04',
      title: 'AUTONOMOUS DEFENSE SIMULATION',
      category: 'ZERO-TRUST CONTAINMENT',
      desc: 'Autonomous blast-radius reduction modeling. Simulates zero-impact microsegmentation and device quarantine without impacting production networks or business uptime.',
      route: '/defense',
      metrics: 'CONTAINMENT EFFICACY // BLAST RADIUS',
      icon: ShieldAlert,
    },
    {
      num: '05',
      title: 'INCIDENT MEMORY',
      category: 'FORENSIC TELEMETRY ARCHIVE',
      desc: 'Cryptographically correlated incident memory stored in SQLite. Full replay of multi-model inference scores, MITRE ATT&CK mappings, and JSON exportable audit dossiers.',
      route: '/incidents',
      metrics: 'FULL AUDIT EVIDENCE // JSON DOSSIER',
      icon: Database,
    },
    {
      num: '06',
      title: 'SOC COMMAND CENTER',
      category: 'UNIFIED OPERATIONAL CONSOLE',
      desc: 'Single-pane-of-glass executive console synthesizing real-time threat ingestion feeds, network topology mini-radar, active DEFCON postures, and defense approvals.',
      route: '/console',
      metrics: 'DEFCON POSTURE // SINGLE PANE OF GLASS',
      icon: Activity,
    },
  ];

  return (
    <div
      ref={heroRef}
      className="min-h-screen bg-background text-primary selection:bg-crimson selection:text-white relative overflow-hidden flex flex-col justify-between"
    >
      {/* 1. Global Background Tech Grid & Ambient Atmospheric Glows */}
      <div className="absolute inset-0 bg-tech-grid opacity-35 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] glow-crimson-radial pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] glow-magenta-ambient pointer-events-none" />
      <div className="scanline-beam" />

      {/* 2. Top Editorial Navigation Bar */}
      <header className="relative z-30 border-b border-border/80 bg-background/85 backdrop-blur-md px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <span className="w-2.5 h-2.5 bg-crimson shadow-crimson-sm inline-block" />
            <span className="font-heading text-2xl font-extrabold tracking-wider text-chrome">
              ØMEN
            </span>
            <span className="font-mono text-[10px] text-muted border border-border px-1.5 py-0.5 ml-1 hidden sm:inline-block">
              SYS_V1.04
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-6 font-mono text-xs text-secondary">
            <span className="text-muted">//</span>
            <button onClick={() => navigate('/detection')} className="hover:text-chrome transition-colors">
              01 NEURAL DETECT
            </button>
            <button onClick={() => navigate('/network')} className="hover:text-chrome transition-colors">
              02 ATTACK GRAPH
            </button>
            <button onClick={() => navigate('/prediction')} className="hover:text-chrome transition-colors">
              03 PREDICTION
            </button>
            <button onClick={() => navigate('/defense')} className="hover:text-chrome transition-colors">
              04 DEFENSE
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 font-mono text-xs px-3 py-1 bg-surface border border-border">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-secondary text-[11px]">{engineStatus}</span>
          </div>

          <OmenButton
            variant="primary"
            size="sm"
            onClick={() => navigate('/console')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            ENTER ØMEN
          </OmenButton>
        </div>
      </header>

      {/* 3. Hero Section (Controlled Cinematic Intro Sequence) */}
      <main className="relative z-20 px-6 lg:px-12 py-12 lg:py-20 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Typography */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div ref={badgeRef} className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-border font-mono text-[11px] text-crimson-glow tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-crimson inline-block animate-ping" />
                // PREDICTIVE CYBER THREAT INTELLIGENCE & DEFENSE
              </div>

              {/* Oversized Masked Headlines */}
              <div className="overflow-hidden">
                <h1
                  ref={headlineLine1Ref}
                  className="font-heading text-4xl sm:text-6xl xl:text-7xl font-extrabold uppercase tracking-tight text-primary leading-[1.05]"
                >
                  PREDICT THE <span className="text-chrome">UNKNOWN.</span>
                </h1>
              </div>
              <div className="overflow-hidden">
                <h1
                  ref={headlineLine2Ref}
                  className="font-heading text-4xl sm:text-6xl xl:text-7xl font-extrabold uppercase tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-crimson via-crimson-glow to-rose"
                >
                  CONTROL THE THREAT.
                </h1>
              </div>
            </div>

            <p
              ref={descRef}
              className="font-sans text-base sm:text-lg text-secondary max-w-xl font-normal leading-relaxed"
            >
              Predictive Cyber Threat Intelligence & Autonomous Defense Simulation.
              Synthesizing deep neural multi-model inference, NetworkX graph memory, and zero-trust attack path neutralization.
            </p>

            {/* CTAs and Technical Metadata */}
            <div className="space-y-6 pt-2">
              <div ref={ctaRef} className="flex flex-wrap items-center gap-4">
                <OmenButton
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/console')}
                  icon={<Play className="w-4 h-4 fill-white" />}
                >
                  ENTER ØMEN
                </OmenButton>

                <OmenButton
                  variant="secondary"
                  size="lg"
                  chamfer={false}
                  onClick={() => {
                    document.getElementById('module-showcase')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  EXPLORE SYSTEM
                </OmenButton>
              </div>

              {/* Fine technical coordinate strip */}
              <div
                ref={metaRef}
                className="pt-4 border-t border-border/70 flex flex-wrap items-center gap-6 font-mono text-[11px] text-muted"
              >
                <div>
                  <span className="text-secondary font-bold">LATENCY:</span> &lt;4.8ms LOCAL
                </div>
                <div>
                  <span className="text-secondary font-bold">ENSEMBLE:</span> RF + MLP + ISO
                </div>
                <div>
                  <span className="text-secondary font-bold">TOPOLOGY:</span> ZERO-TRUST MESH
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Visual: 3D Floating Black-Chrome Core (R3F) */}
          <div ref={core3DRef} className="lg:col-span-5 relative flex items-center justify-center">
            {/* Fine Hairline Frame & Corner Ticks */}
            <div className="w-full aspect-square max-w-[500px] border border-border-hairline p-2 relative tech-corner-tl tech-corner-br bg-surface/30 backdrop-blur-sm">
              <div className="absolute top-2 left-3 font-mono text-[9px] text-muted tracking-widest z-20">
                FIG.01 // R3F OBSIDIAN CORE
              </div>
              <div className="absolute bottom-2 right-3 font-mono text-[9px] text-crimson-glow tracking-widest z-20 flex items-center gap-1.5">
                <span className="w-1 h-1 bg-crimson inline-block animate-pulse" />
                R3F THREE.JS ACTIVE
              </div>

              {/* React Three Fiber Hero Scene (Task 3) */}
              <OmenCore3D className="w-full h-full" />
            </div>
          </div>
        </div>
      </main>

      {/* 4. Live Telemetry Strip */}
      <section className="relative z-20 border-y border-border bg-surface/70 backdrop-blur-md py-3 px-6 lg:px-12 overflow-hidden">
        <div className="flex items-center gap-8 font-mono text-xs animate-marquee whitespace-nowrap text-secondary">
          <span className="flex items-center gap-2 text-primary font-bold">
            <span className="w-1.5 h-1.5 bg-crimson" /> SYSTEM STATUS: OPERATIONAL
          </span>
          <span>•</span>
          <span>RANDOM FOREST: 90.52% ACCURACY</span>
          <span>•</span>
          <span>PYTORCH MLP: 98.24% HOLDOUT RECALL</span>
          <span>•</span>
          <span>ISOLATION FOREST: 0.5000 ANOMALY THRESHOLD</span>
          <span>•</span>
          <span>DATASET: UNSW-NB15 (82,332 BENCHMARK RECORDS)</span>
          <span>•</span>
          <span>TOPOLOGY: NETWORKX DIJKSTRA / BFS ENGINE</span>
          <span>•</span>
          <span>MITRE ATT&CK: RECON / EXPLOIT / LATERAL MOVEMENT</span>
        </div>
      </section>

      {/* 5. Modular Editorial Grid (The 6 ØMEN Pillars with GSAP ScrollTrigger) */}
      <section
        id="module-showcase"
        ref={moduleSectionRef}
        className="relative z-20 px-6 lg:px-12 py-20 max-w-7xl mx-auto w-full space-y-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-crimson font-semibold block mb-1">
              // ARCHITECTURAL MATRIX
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-primary">
              SIX AUTONOMOUS PILLARS
            </h2>
          </div>
          <p className="font-sans text-xs sm:text-sm text-secondary max-w-md">
            Integrated neural threat perception, predictive attack path discovery, and automated zero-trust containment simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.num}
                whileHover={{ y: -4, borderColor: 'rgba(179, 18, 47, 0.45)' }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(m.route)}
                className="module-editorial-card chamfer-card bg-surface border border-border p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                {/* Top Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-muted tracking-widest">
                      [{m.num}]
                    </span>
                    <OmenBadge variant="crimson">{m.category}</OmenBadge>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="w-5 h-5 text-chrome group-hover:text-crimson-glow transition-colors" />
                    <h3 className="font-heading text-lg font-bold text-primary group-hover:text-white transition-colors">
                      {m.title}
                    </h3>
                  </div>

                  <p className="font-sans text-xs text-secondary leading-relaxed mb-6">
                    {m.desc}
                  </p>
                </div>

                {/* Bottom Footer */}
                <div className="pt-4 border-t border-border/80 flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted group-hover:text-secondary transition-colors">
                    {m.metrics}
                  </span>
                  <div className="flex items-center gap-1 text-chrome group-hover:text-crimson-glow font-bold transition-colors">
                    <span>LAUNCH</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="relative z-20 border-t border-border/80 bg-background py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-muted">
          <div className="flex items-center gap-3">
            <span className="font-heading text-sm font-bold text-chrome">ØMEN</span>
            <span>//</span>
            <span>PREDICTIVE CYBER THREAT INTELLIGENCE & AUTONOMOUS DEFENSE</span>
          </div>
          <div>
            RUNNING LOCALHOST FASTAPI + PYTORCH + REACT
          </div>
        </div>
      </footer>
    </div>
  );
};
