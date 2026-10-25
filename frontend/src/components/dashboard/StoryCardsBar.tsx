import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, GitBranch, Network, Cpu } from 'lucide-react';

interface StoryCardItem {
  id: string;
  number: string;
  tag: string;
  headline: string;
  route: string;
  icon: React.ElementType;
  renderVisual: () => React.ReactNode;
}

export const StoryCardsBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();

  const cards: StoryCardItem[] = [
    {
      id: 'detection',
      number: '01',
      tag: '01. DETECTION',
      headline: 'EVERY ANOMALY LEAVES A TRACE.',
      route: '/detection',
      icon: Cpu,
      renderVisual: () => (
        <div className="relative w-full h-32 sm:h-36 overflow-hidden rounded-xl bg-gradient-to-b from-[#1C0509]/80 to-[#0A0A0D]/90 flex items-center justify-center border border-white/5 group-hover:border-[#F02D46]/40 transition-colors">
          {/* Glowing Red Bioluminescent Jellyfish Silhouette / Pulse */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(240,45,70,0.35),transparent_70%)]" />
          <svg className="w-24 h-24 text-[#F02D46] drop-shadow-[0_0_15px_#F02D46]" viewBox="0 0 100 100" fill="none">
            {/* Jellyfish Bell */}
            <path
              d="M25 50 C25 25, 75 25, 75 50 C75 58, 65 60, 50 60 C35 60, 25 58, 25 50 Z"
              fill="rgba(240, 45, 70, 0.4)"
              stroke="#F02D46"
              strokeWidth="2"
            />
            <path
              d="M32 45 C35 32, 65 32, 68 45"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            {/* Pulsing Core */}
            <circle cx="50" cy="42" r="6" fill="#FFF" className="animate-pulse" />
            {/* Flowing Tendrils */}
            <path
              d="M35 58 Q32 75 36 92"
              stroke="#F02D46"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-80"
            />
            <path
              d="M45 60 Q42 80 48 95"
              stroke="#F02D46"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M55 60 Q58 80 52 95"
              stroke="#F02D46"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M65 58 Q68 75 64 92"
              stroke="#F02D46"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-80"
            />
          </svg>
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />
        </div>
      ),
    },
    {
      id: 'network',
      number: '02',
      tag: '02. NETWORK',
      headline: 'EVERY CONNECTION TELLS A STORY.',
      route: '/network',
      icon: Network,
      renderVisual: () => (
        <div className="relative w-full h-32 sm:h-36 overflow-hidden rounded-xl bg-gradient-to-b from-[#16060A]/80 to-[#0A0A0D]/90 flex items-center justify-center border border-white/5 group-hover:border-[#F02D46]/40 transition-colors">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,45,70,0.25),transparent_70%)]" />
          {/* Red Constellation Graph */}
          <svg className="w-full h-full px-4 py-2" viewBox="0 0 160 100" fill="none">
            {/* Edges */}
            <line x1="30" y1="50" x2="65" y2="30" stroke="rgba(240,45,70,0.6)" strokeWidth="1.5" />
            <line x1="30" y1="50" x2="70" y2="70" stroke="rgba(240,45,70,0.4)" strokeWidth="1" />
            <line x1="65" y1="30" x2="110" y2="40" stroke="rgba(240,45,70,0.8)" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="70" y1="70" x2="110" y2="40" stroke="rgba(240,45,70,0.5)" strokeWidth="1.2" />
            <line x1="110" y1="40" x2="140" y2="60" stroke="#F02D46" strokeWidth="2" />
            <line x1="70" y1="70" x2="125" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            {/* Nodes */}
            <circle cx="30" cy="50" r="4.5" fill="#F02D46" className="drop-shadow-[0_0_8px_#F02D46]" />
            <circle cx="65" cy="30" r="5" fill="#E2E2E6" stroke="#F02D46" strokeWidth="1.5" />
            <circle cx="70" cy="70" r="4" fill="#A1A1AA" />
            <circle cx="110" cy="40" r="8" fill="#F02D46" className="drop-shadow-[0_0_12px_#F02D46]" />
            <circle cx="110" cy="40" r="3" fill="#FFF" />
            <circle cx="140" cy="60" r="5" fill="#F02D46" />
            <circle cx="125" cy="80" r="3.5" fill="#71717A" />
          </svg>
          <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />
        </div>
      ),
    },
    {
      id: 'prediction',
      number: '03',
      tag: '03. PREDICTION',
      headline: 'THE NEXT MOVE IS NOT INVISIBLE.',
      route: '/prediction',
      icon: GitBranch,
      renderVisual: () => (
        <div className="relative w-full h-32 sm:h-36 overflow-hidden rounded-xl bg-gradient-to-b from-[#1C0509]/80 to-[#0A0A0D]/90 flex items-center justify-center border border-white/5 group-hover:border-[#F02D46]/40 transition-colors">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,rgba(240,45,70,0.35),transparent_70%)]" />
          {/* Curved glowing attack corridor filaments */}
          <svg className="w-full h-full px-4 py-2" viewBox="0 0 160 100" fill="none">
            <path
              d="M10 65 Q 50 20, 100 45 T 150 30"
              stroke="#F02D46"
              strokeWidth="2.5"
              fill="none"
              className="drop-shadow-[0_0_10px_#F02D46]"
            />
            <path
              d="M10 70 Q 60 40, 110 60 T 150 40"
              stroke="rgba(240,45,70,0.5)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 2"
            />
            <path
              d="M20 80 Q 70 70, 120 50 T 155 45"
              stroke="rgba(240,45,70,0.3)"
              strokeWidth="1"
              fill="none"
            />
            {/* Glowing Traversal Markers */}
            <circle cx="55" cy="35" r="4" fill="#FFF" stroke="#F02D46" strokeWidth="2" />
            <circle cx="100" cy="45" r="5" fill="#F02D46" className="animate-ping" />
            <circle cx="100" cy="45" r="4" fill="#FFF" />
            <circle cx="150" cy="30" r="7" fill="#F02D46" className="drop-shadow-[0_0_12px_#F02D46]" />
            <circle cx="150" cy="30" r="3" fill="#FFF" />
          </svg>
          <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />
        </div>
      ),
    },
    {
      id: 'defense',
      number: '04',
      tag: '04. DEFENSE',
      headline: 'CONTROL THE DAMAGE. PRESERVE THE SYSTEM.',
      route: '/defense',
      icon: ShieldCheck,
      renderVisual: () => (
        <div className="relative w-full h-32 sm:h-36 overflow-hidden rounded-xl bg-gradient-to-b from-[#180508]/80 to-[#0A0A0D]/90 flex items-center justify-center border border-white/5 group-hover:border-[#F02D46]/40 transition-colors">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,45,70,0.3),transparent_70%)]" />
          {/* Red wireframe sphere and shielded forcefield */}
          <svg className="w-24 h-24 text-[#F02D46]" viewBox="0 0 100 100" fill="none">
            {/* Outer Hex Shield */}
            <polygon
              points="50,12 85,32 85,68 50,88 15,68 15,32"
              stroke="#F02D46"
              strokeWidth="1.5"
              fill="rgba(240, 45, 70, 0.08)"
              className="drop-shadow-[0_0_8px_#F02D46]"
            />
            {/* Inner Wireframe Globe Latitude / Longitude */}
            <circle cx="50" cy="50" r="26" stroke="rgba(240, 45, 70, 0.6)" strokeWidth="1.2" />
            <ellipse cx="50" cy="50" rx="26" ry="10" stroke="rgba(240, 45, 70, 0.4)" strokeWidth="1" />
            <ellipse cx="50" cy="50" rx="11" ry="26" stroke="rgba(240, 45, 70, 0.4)" strokeWidth="1" />
            <line x1="24" y1="50" x2="76" y2="50" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="50" y1="24" x2="50" y2="76" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="4" fill="#FFF" className="drop-shadow-[0_0_6px_#FFF]" />
          </svg>
          <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />
        </div>
      ),
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Section Header Label as in Screenshot (01 HOMEPAGE - CINEMATIC INTRODUCTION) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-technical text-xs font-bold text-[#F02D46] px-2 py-0.5 rounded bg-[#F02D46]/10 border border-[#F02D46]/30">
            01
          </span>
          <div>
            <h3 className="font-heading text-xs sm:text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
              HOMEPAGE — CINEMATIC INTRODUCTION
            </h3>
            <p className="font-technical text-[10px] text-[#919198]">
              Living ØMEN entity, animated stats, scroll storytelling
            </p>
          </div>
        </div>
      </div>

      {/* 4 Horizontal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate(card.route)}
              className="group cursor-pointer p-3.5 rounded-2xl bg-[#101013]/85 backdrop-blur-xl border border-white/10 hover:border-[#F02D46]/60 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
            >
              {/* Card Thumbnail Visual */}
              {card.renderVisual()}

              {/* Text & Meta */}
              <div className="pt-3 space-y-1">
                <h4 className="font-heading text-xs sm:text-sm font-extrabold uppercase text-[#F5F5F5] tracking-tight leading-snug group-hover:text-[#F02D46] transition-colors">
                  {card.headline}
                </h4>

                <div className="flex items-center justify-between pt-1 font-technical text-[10px] text-[#919198]">
                  <span className="text-[#F02D46] font-semibold tracking-wider">
                    {card.tag}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <span>EXPLORE</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
