import React, { useEffect, useState, useRef } from 'react';

/**
 * Precision Cursor Accent
 * Renders an elite hacker terminal precision crosshair dot and trailing ring
 * on pointer-capable desktop devices. Automatically hidden on touch screens.
 */
export const PrecisionCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Only enable on precise pointer devices (mice / trackpads) without reduced motion
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasPointer || reducedMotion) return;
    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      if (!visible) setVisible(true);

      // Check if hovering an interactive element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.classList.contains('cursor-pointer'))
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth animation loop for trailing ring
    let animationFrameId: number;
    const loop = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.22;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [visible]);

  if (!enabled || !visible) return null;

  return (
    <>
      {/* Precision Core Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999] transition-opacity duration-150"
      >
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
            hovered ? 'bg-[#F02D46] scale-150 shadow-[0_0_8px_#F02D46]' : 'bg-[#E2E2E5]'
          }`}
        />
      </div>

      {/* Trailing Precision Reticle Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9998] transition-opacity duration-150"
      >
        <div
          className={`rounded-full border transition-all duration-200 flex items-center justify-center ${
            hovered
              ? 'w-9 h-9 border-[#F02D46]/70 bg-[#F02D46]/10 shadow-[0_0_15px_rgba(240,45,70,0.3)]'
              : 'w-6 h-6 border-[#E2E2E5]/25'
          }`}
        >
          {hovered && (
            <span className="w-1.5 h-1.5 border-t border-r border-[#F02D46] absolute top-1 right-1" />
          )}
        </div>
      </div>
    </>
  );
};
