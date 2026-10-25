import React, { useEffect, useRef, useState } from 'react';

interface CrystallineCoreProps {
  className?: string;
}

// 3D Point representation
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Facet polygon definition
interface Facet {
  indices: number[];
  baseColor: string;
  strokeColor: string;
}

export const CrystallineCore: React.FC<CrystallineCoreProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Mouse interaction state for smooth parallax
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    // 1. Intersection Observer to pause rendering when offscreen
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // 2. Mouse move handler for parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let angleX = 0.35;
    let angleY = 0.6;
    let angleZ = 0.1;
    let floatOffset = 0;

    // Primary central crystalline cube cluster vertices
    const size = 110;
    const coreVertices: Point3D[] = [
      // Outer cube vertices
      { x: -size, y: -size, z: -size },
      { x: size, y: -size, z: -size },
      { x: size, y: size, z: -size },
      { x: -size, y: size, z: -size },
      { x: -size, y: -size, z: size },
      { x: size, y: -size, z: size },
      { x: size, y: size, z: size },
      { x: -size, y: size, z: size },
      // Fractured offset facet points (crystalline shards)
      { x: 0, y: -size * 1.45, z: 0 },
      { x: size * 1.4, y: 0, z: 0 },
      { x: 0, y: size * 1.45, z: 0 },
      { x: -size * 1.4, y: 0, z: 0 },
      { x: 0, y: 0, z: size * 1.45 },
      { x: 0, y: 0, z: -size * 1.45 },
    ];

    // Inner neural core nodes (pulsing crimson signals)
    const innerNodes: Point3D[] = [
      { x: -45, y: -45, z: -45 },
      { x: 45, y: -45, z: -45 },
      { x: 45, y: 45, z: -45 },
      { x: -45, y: 45, z: -45 },
      { x: -45, y: -45, z: 45 },
      { x: 45, y: -45, z: 45 },
      { x: 45, y: 45, z: 45 },
      { x: -45, y: 45, z: 45 },
      { x: 0, y: 0, z: 0 },
    ];

    // Faces of the central obsidian crystal
    const facets: Facet[] = [
      // Main Cube Faces (semi-transparent glass obsidian)
      { indices: [0, 1, 2, 3], baseColor: 'rgba(16, 16, 24, 0.65)', strokeColor: 'rgba(214, 214, 218, 0.4)' },
      { indices: [4, 5, 6, 7], baseColor: 'rgba(20, 20, 30, 0.7)', strokeColor: 'rgba(214, 214, 218, 0.6)' },
      { indices: [0, 1, 5, 4], baseColor: 'rgba(23, 23, 34, 0.6)', strokeColor: 'rgba(214, 214, 218, 0.45)' },
      { indices: [2, 3, 7, 6], baseColor: 'rgba(12, 12, 18, 0.6)', strokeColor: 'rgba(214, 214, 218, 0.4)' },
      { indices: [0, 3, 7, 4], baseColor: 'rgba(18, 18, 26, 0.65)', strokeColor: 'rgba(214, 214, 218, 0.4)' },
      { indices: [1, 2, 6, 5], baseColor: 'rgba(22, 22, 32, 0.7)', strokeColor: 'rgba(214, 214, 218, 0.5)' },
      // Fractured Triangular Shards
      { indices: [0, 1, 8], baseColor: 'rgba(179, 18, 47, 0.15)', strokeColor: 'rgba(227, 76, 103, 0.5)' },
      { indices: [4, 5, 8], baseColor: 'rgba(179, 18, 47, 0.12)', strokeColor: 'rgba(227, 76, 103, 0.45)' },
      { indices: [1, 2, 9], baseColor: 'rgba(214, 214, 218, 0.08)', strokeColor: 'rgba(214, 214, 218, 0.4)' },
      { indices: [5, 6, 9], baseColor: 'rgba(214, 214, 218, 0.08)', strokeColor: 'rgba(214, 214, 218, 0.4)' },
      { indices: [2, 3, 10], baseColor: 'rgba(179, 18, 47, 0.15)', strokeColor: 'rgba(227, 76, 103, 0.5)' },
      { indices: [6, 7, 10], baseColor: 'rgba(179, 18, 47, 0.12)', strokeColor: 'rgba(227, 76, 103, 0.45)' },
      { indices: [4, 7, 12], baseColor: 'rgba(227, 76, 103, 0.15)', strokeColor: 'rgba(227, 76, 103, 0.7)' },
      { indices: [5, 6, 12], baseColor: 'rgba(227, 76, 103, 0.15)', strokeColor: 'rgba(227, 76, 103, 0.7)' },
    ];

    // Satellite orbital cubes (fractured fragments orbiting the core)
    const satellites = [
      { radius: 210, speed: 0.008, phase: 0.5, size: 22, color: 'rgba(214, 214, 218, 0.8)' },
      { radius: 260, speed: -0.006, phase: 2.1, size: 16, color: 'rgba(227, 76, 103, 0.9)' },
      { radius: 190, speed: 0.012, phase: 4.2, size: 18, color: 'rgba(169, 83, 112, 0.8)' },
      { radius: 290, speed: -0.009, phase: 1.2, size: 14, color: 'rgba(214, 214, 218, 0.6)' },
    ];

    // Rotation helper
    const rotatePoint = (p: Point3D, rx: number, ry: number, rz: number): Point3D => {
      // Y-axis rotation
      let cos = Math.cos(ry);
      let sin = Math.sin(ry);
      let x1 = p.x * cos + p.z * sin;
      let y1 = p.y;
      let z1 = -p.x * sin + p.z * cos;

      // X-axis rotation
      cos = Math.cos(rx);
      sin = Math.sin(rx);
      let x2 = x1;
      let y2 = y1 * cos - z1 * sin;
      let z2 = y1 * sin + z1 * cos;

      // Z-axis rotation
      cos = Math.cos(rz);
      sin = Math.sin(rz);
      let x3 = x2 * cos - y2 * sin;
      let y3 = x2 * sin + y2 * cos;
      let z3 = z2;

      return { x: x3, y: y3, z: z3 };
    };

    // Perspective projection helper
    const project = (p: Point3D, cx: number, cy: number, fov: number = 650) => {
      const scale = fov / (fov + p.z);
      return {
        x: cx + p.x * scale,
        y: cy + p.y * scale,
        z: p.z,
        scale,
      };
    };

    let time = 0;

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 600);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 600);
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      if (!prefersReducedMotion) {
        time += 0.015;
        angleY += 0.0035;
        angleX = 0.28 + mouseRef.current.y * 0.35;
        angleZ = mouseRef.current.x * 0.25;
        floatOffset = Math.sin(time * 1.5) * 12;
      }

      // Draw subtle background ambient laser ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy + floatOffset, 220, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(179, 18, 47, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12]);
      ctx.stroke();
      ctx.restore();

      // Transform core vertices
      const transformedCore = coreVertices.map((p) => {
        const rotated = rotatePoint(p, angleX, angleY + mouseRef.current.x * 0.4, angleZ);
        return {
          ...rotated,
          y: rotated.y + floatOffset,
        };
      });

      // Transform inner neural core nodes
      const transformedInner = innerNodes.map((p) => {
        const rotated = rotatePoint(p, angleX, angleY + mouseRef.current.x * 0.4, angleZ);
        return {
          ...rotated,
          y: rotated.y + floatOffset,
        };
      });

      // 1. Draw inner crimson neural signal lines
      const pulseOpacity = 0.4 + Math.sin(time * 3) * 0.3;
      ctx.save();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(227, 76, 103, ${pulseOpacity})`;

      for (let i = 0; i < transformedInner.length; i++) {
        for (let j = i + 1; j < transformedInner.length; j++) {
          const p1 = project(transformedInner[i], cx, cy);
          const p2 = project(transformedInner[j], cx, cy);
          const dist = Math.hypot(
            transformedInner[i].x - transformedInner[j].x,
            transformedInner[i].y - transformedInner[j].y,
            transformedInner[i].z - transformedInner[j].z
          );
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 2. Draw inner neural core points
      transformedInner.forEach((node, idx) => {
        const proj = project(node, cx, cy);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, idx === 8 ? 4.5 * proj.scale : 2.5 * proj.scale, 0, Math.PI * 2);
        ctx.fillStyle = idx === 8 ? '#E34C67' : 'rgba(227, 76, 103, 0.9)';
        ctx.shadowColor = '#E34C67';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Sort facets by average Z depth (Painter's algorithm)
      const sortedFacets = facets
        .map((f) => {
          const avgZ =
            f.indices.reduce((sum, idx) => sum + transformedCore[idx].z, 0) / f.indices.length;
          return { ...f, avgZ };
        })
        .sort((a, b) => b.avgZ - a.avgZ);

      // Render crystalline facets
      sortedFacets.forEach((f) => {
        const pts = f.indices.map((idx) => project(transformedCore[idx], cx, cy));

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();

        // Semi-transparent obsidian face
        ctx.fillStyle = f.baseColor;
        ctx.fill();

        // Fine hairline edge
        ctx.strokeStyle = f.strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      // 4. Draw outer vertex dots & corner coordinates
      transformedCore.forEach((v, idx) => {
        const p = project(v, cx, cy);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = idx >= 8 ? '#E34C67' : '#D6D6DA';
        ctx.fill();

        // Rare technical coordinate label on apex points
        if (idx === 8 || idx === 12) {
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(214, 214, 218, 0.5)';
          ctx.fillText(`+ NODE_0x${(idx * 7 + 10).toString(16)}`, p.x + 8, p.y - 4);
        }
      });

      // 5. Draw orbital satellite shards
      satellites.forEach((sat, i) => {
        const orbitAngle = time * sat.speed * 10 + sat.phase;
        const satX = Math.cos(orbitAngle) * sat.radius;
        const satZ = Math.sin(orbitAngle) * sat.radius;
        const satY = Math.sin(time * 2 + i) * 35;

        const rotatedSat = rotatePoint({ x: satX, y: satY, z: satZ }, angleX, angleY, angleZ);
        rotatedSat.y += floatOffset;

        const p = project(rotatedSat, cx, cy);

        // Draw laser tether linking satellite to core
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy + floatOffset);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = 'rgba(179, 18, 47, 0.2)';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([2, 8]);
        ctx.stroke();
        ctx.restore();

        // Render mini satellite cube
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(time * 0.8 + i);
        ctx.strokeStyle = sat.color;
        ctx.fillStyle = 'rgba(16, 16, 24, 0.8)';
        ctx.lineWidth = 1;
        const s = sat.size * p.scale;
        ctx.strokeRect(-s / 2, -s / 2, s, s);
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  return (
    <div ref={containerRef} className={`relative flex items-center justify-center ${className}`}>
      {/* Background Volumetric Crimson Glow */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 blur-3xl scale-125"
        style={{
          background: 'radial-gradient(circle, rgba(179,18,47,0.3) 0%, rgba(227,76,103,0.1) 40%, transparent 70%)',
        }}
      />
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[620px] max-h-[620px] object-contain relative z-10 cursor-grab active:cursor-grabbing"
        title="ØMEN Autonomous Core — Interactive 3D Crystalline Geometry"
      />
    </div>
  );
};
