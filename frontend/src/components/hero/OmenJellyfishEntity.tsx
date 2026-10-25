import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface JellyfishProps {
  reducedMotion?: boolean;
}

// Procedural flowing jellyfish 3D model
const JellyfishModel: React.FC<JellyfishProps> = ({ reducedMotion = false }) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const bellMeshRef = useRef<THREE.Mesh>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const filamentsLinesRef = useRef<THREE.LineSegments>(null);
  const oralArmsRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Outer bell material - translucent crimson bioluminescence
  const bellMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#D10E24'),
        emissive: new THREE.Color('#5C0614'),
        emissiveIntensity: 1.6,
        roughness: 0.12,
        metalness: 0.08,
        transmission: 0.82,
        thickness: 1.4,
        ior: 1.38,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  // Inner neural organ material - high intensity pulse
  const nucleusMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FF293F'),
        emissive: new THREE.Color('#FF293F'),
        emissiveIntensity: 2.8,
        roughness: 0.3,
        metalness: 0.2,
      }),
    []
  );

  // Rim collar material
  const rimMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FF293F'),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Filaments line material
  const filamentMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#FF293F'),
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        linewidth: 1,
      }),
    []
  );

  // Oral arms (central heavier frills) material
  const oralArmsMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#D10E24'),
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // Construct bell geometry (elongated half-sphere dome with flared rim)
  const bellGeometry = useMemo(() => {
    // 64 segments around, 32 height segments
    const geom = new THREE.SphereGeometry(1.5, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.58);
    // Deform vertices to create umbrella / jellyfish bell contour
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const r = Math.sqrt(x * x + z * z);
      // Soft flaring at the rim
      const flare = Math.pow(Math.max(0, 1.5 - y) / 1.5, 2.2) * 0.35;
      pos.setX(i, x * (1 + flare));
      pos.setZ(i, z * (1 + flare));
      // Bell curvature
      pos.setY(i, y * 1.15);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Construct outer filaments (32 strands hanging down ~5.5 units)
  const strandCount = 36;
  const vertsPerStrand = 26;
  const { filamentGeom, strandInitialData } = useMemo(() => {
    const totalVerts = strandCount * (vertsPerStrand - 1) * 2;
    const positions = new Float32Array(totalVerts * 3);
    const strandData: Array<{
      radius: number;
      angle: number;
      length: number;
      speed: number;
      phase: number;
      frequency: number;
      amplitude: number;
    }> = [];

    let pIdx = 0;
    for (let s = 0; s < strandCount; s++) {
      const angle = (s / strandCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const radius = 1.35 + (Math.random() - 0.5) * 0.35;
      const length = 4.0 + Math.random() * 2.5; // reaches deep downwards
      const speed = 1.2 + Math.random() * 0.8;
      const phase = Math.random() * Math.PI * 2;
      const frequency = 1.6 + Math.random() * 0.8;
      const amplitude = 0.25 + Math.random() * 0.2;

      strandData.push({ radius, angle, length, speed, phase, frequency, amplitude });

      for (let v = 0; v < vertsPerStrand - 1; v++) {
        // Line segment: point v to point v + 1
        // placeholder coordinates; updated every frame in useFrame
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;

        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { filamentGeom: geom, strandInitialData: strandData };
  }, [strandCount, vertsPerStrand]);

  // Construct central oral arms (8 spiral wavy frills)
  const oralCount = 8;
  const vertsPerOral = 32;
  const { oralGeom, oralData } = useMemo(() => {
    const totalVerts = oralCount * (vertsPerOral - 1) * 2;
    const positions = new Float32Array(totalVerts * 3);
    const data: Array<{ angle: number; length: number; speed: number; phase: number }> = [];

    let pIdx = 0;
    for (let s = 0; s < oralCount; s++) {
      const angle = (s / oralCount) * Math.PI * 2;
      const length = 3.6 + Math.random() * 1.5;
      const speed = 1.0 + Math.random() * 0.5;
      const phase = (s / oralCount) * Math.PI * 2;
      data.push({ angle, length, speed, phase });

      for (let v = 0; v < vertsPerOral - 1; v++) {
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
        positions[pIdx++] = 0;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { oralGeom: geom, oralData: data };
  }, []);

  // Drifting neural bioluminescent particles
  const particleCount = 110;
  const particleGeom = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 0.8 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const y = 1.5 - Math.random() * 6.5; // spread from bell down to tendril tips
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color('#FF293F'),
        size: 0.05,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // Animation frame loop
  useFrame((state, delta) => {
    if (!rootGroupRef.current) return;
    const time = state.clock.elapsedTime;

    if (!reducedMotion) {
      // 1. Organic swimming contraction cycle (quick pulse up, gentle float down)
      const pulsePhase = time * 1.6;
      // asymmetric contraction wave
      const pulseRaw = Math.sin(pulsePhase);
      const contraction = Math.pow(Math.max(0, pulseRaw), 2.2);
      const relaxation = -Math.pow(Math.max(0, -pulseRaw), 1.8) * 0.3;
      const pulse = contraction + relaxation;

      // Bell shape breathes with pulse
      if (bellMeshRef.current) {
        const sx = 1 - pulse * 0.12;
        const sy = 1 + pulse * 0.16;
        const sz = 1 - pulse * 0.12;
        bellMeshRef.current.scale.set(sx, sy, sz);
      }

      // Organ nucleus pulses with high intensity
      if (nucleusRef.current) {
        const nScale = 1 + Math.sin(time * 3.2) * 0.14 + pulse * 0.15;
        nucleusRef.current.scale.set(nScale, nScale, nScale);
      }

      // Root entity hovering and subtle tilt towards mouse pointer
      rootGroupRef.current.position.y = Math.sin(time * 0.8) * 0.25 + pulse * 0.18;
      rootGroupRef.current.rotation.y += delta * 0.12;
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        -state.pointer.y * 0.28 + 0.15,
        0.04
      );
      rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.z,
        state.pointer.x * 0.22,
        0.04
      );

      // 2. Update flowing outer filaments
      if (filamentsLinesRef.current) {
        const posAttr = filamentsLinesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        let idx = 0;

        for (let s = 0; s < strandCount; s++) {
          const sd = strandInitialData[s];
          const bellRimY = 0.05;

          for (let v = 0; v < vertsPerStrand - 1; v++) {
            // Vertex v
            const t0 = v / (vertsPerStrand - 1);
            const y0 = bellRimY - t0 * sd.length;
            const wave0 = Math.sin(time * sd.speed + t0 * sd.frequency * 4 + sd.phase) * sd.amplitude * t0;
            const waveZ0 = Math.cos(time * sd.speed * 0.8 + t0 * sd.frequency * 3 + sd.phase) * sd.amplitude * t0;
            const r0 = sd.radius * (1 - t0 * 0.35);
            const x0 = Math.cos(sd.angle) * r0 + wave0;
            const z0 = Math.sin(sd.angle) * r0 + waveZ0;

            // Vertex v + 1
            const t1 = (v + 1) / (vertsPerStrand - 1);
            const y1 = bellRimY - t1 * sd.length;
            const wave1 = Math.sin(time * sd.speed + t1 * sd.frequency * 4 + sd.phase) * sd.amplitude * t1;
            const waveZ1 = Math.cos(time * sd.speed * 0.8 + t1 * sd.frequency * 3 + sd.phase) * sd.amplitude * t1;
            const r1 = sd.radius * (1 - t1 * 0.35);
            const x1 = Math.cos(sd.angle) * r1 + wave1;
            const z1 = Math.sin(sd.angle) * r1 + waveZ1;

            posArray[idx++] = x0;
            posArray[idx++] = y0;
            posArray[idx++] = z0;

            posArray[idx++] = x1;
            posArray[idx++] = y1;
            posArray[idx++] = z1;
          }
        }
        posAttr.needsUpdate = true;
      }

      // 3. Update central oral arms
      if (oralArmsRef.current) {
        const posAttr = oralArmsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;
        let idx = 0;

        for (let s = 0; s < oralCount; s++) {
          const od = oralData[s];
          for (let v = 0; v < vertsPerOral - 1; v++) {
            const t0 = v / (vertsPerOral - 1);
            const y0 = -0.15 - t0 * od.length;
            const spiralAngle0 = od.angle + t0 * 3.0 + Math.sin(time * od.speed + t0 * 5) * 0.4;
            const r0 = 0.55 * (1 - t0 * 0.5) + Math.sin(time * 1.5 + t0 * 6) * 0.1;
            const x0 = Math.cos(spiralAngle0) * r0;
            const z0 = Math.sin(spiralAngle0) * r0;

            const t1 = (v + 1) / (vertsPerOral - 1);
            const y1 = -0.15 - t1 * od.length;
            const spiralAngle1 = od.angle + t1 * 3.0 + Math.sin(time * od.speed + t1 * 5) * 0.4;
            const r1 = 0.55 * (1 - t1 * 0.5) + Math.sin(time * 1.5 + t1 * 6) * 0.1;
            const x1 = Math.cos(spiralAngle1) * r1;
            const z1 = Math.sin(spiralAngle1) * r1;

            posArray[idx++] = x0;
            posArray[idx++] = y0;
            posArray[idx++] = z0;

            posArray[idx++] = x1;
            posArray[idx++] = y1;
            posArray[idx++] = z1;
          }
        }
        posAttr.needsUpdate = true;
      }

      // 4. Drift bioluminescent particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y -= delta * 0.08;
      }
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, 0.4, 0]}>
      {/* 1. Translucent Crimson Jellyfish Bell Dome */}
      <mesh ref={bellMeshRef} geometry={bellGeometry} material={bellMaterial} />

      {/* 2. Inner Glowing Neural Nucleus / Cybernetic Brain */}
      <mesh ref={nucleusRef} material={nucleusMaterial} position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
      </mesh>

      {/* 3. Concentric Inner Neural Rings */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.75, 0.8, 36]} />
        <meshBasicMaterial color="#FF293F" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.15, 48]} />
        <meshBasicMaterial color="#D10E24" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* 4. Bell Margin Luminous Rim */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={rimMaterial}>
        <torusGeometry args={[1.52, 0.04, 16, 64]} />
      </mesh>

      {/* 5. Flowing Filaments (Outer Strands) */}
      <lineSegments ref={filamentsLinesRef} geometry={filamentGeom} material={filamentMaterial} />

      {/* 6. Central Oral Arms (Deep crimson wave ribbons) */}
      <lineSegments ref={oralArmsRef} geometry={oralGeom} material={oralArmsMaterial} />

      {/* 7. Drifting Neural Bioluminescent Particles */}
      <points ref={particlesRef} geometry={particleGeom} material={particleMaterial} />
    </group>
  );
};

export const OmenJellyfishEntity: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // High quality 2D cinematic gothic fallback if WebGL is unavailable
  if (!hasWebGL) {
    return (
      <div className={`relative flex items-center justify-center p-8 ${className}`}>
        <div className="relative w-80 h-96 flex flex-col items-center justify-center">
          {/* Bioluminescent pulse backdrop */}
          <div className="absolute inset-0 bg-radial-gradient from-crimson/30 via-crimson/10 to-transparent rounded-full blur-2xl animate-pulse-crimson" />
          {/* Gothic Jellyfish Silhouette */}
          <svg viewBox="0 0 200 260" className="w-full h-full drop-shadow-[0_0_35px_rgba(255,41,63,0.6)]">
            <defs>
              <radialGradient id="bellGlow" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FF293F" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#D10E24" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#5C0614" stopOpacity="0.2" />
              </radialGradient>
              <linearGradient id="tendrilFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF293F" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#D10E24" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#5C0614" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Bell Dome */}
            <path
              d="M 30,90 C 30,25 170,25 170,90 C 170,105 155,108 140,102 C 125,96 110,105 100,105 C 90,105 75,96 60,102 C 45,108 30,105 30,90 Z"
              fill="url(#bellGlow)"
              stroke="#FF293F"
              strokeWidth="1.5"
            />
            {/* Neural nucleus */}
            <circle cx="100" cy="65" r="16" fill="#FF293F" opacity="0.8" />
            <circle cx="100" cy="65" r="8" fill="#FFFFFF" opacity="0.9" />
            {/* Strands */}
            <path d="M 50,102 Q 40,150 55,200 T 50,250" fill="none" stroke="url(#tendrilFade)" strokeWidth="1.5" />
            <path d="M 75,105 Q 65,160 80,210 T 75,255" fill="none" stroke="url(#tendrilFade)" strokeWidth="1.8" />
            <path d="M 100,105 Q 110,165 95,215 T 100,260" fill="none" stroke="url(#tendrilFade)" strokeWidth="2.2" />
            <path d="M 125,105 Q 140,160 120,210 T 125,255" fill="none" stroke="url(#tendrilFade)" strokeWidth="1.8" />
            <path d="M 150,102 Q 160,150 145,200 T 150,250" fill="none" stroke="url(#tendrilFade)" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-visible ${className}`}>
      {/* Background Volumetric Crimson Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45 blur-3xl scale-150"
        style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(255,41,63,0.32) 0%, rgba(209,14,36,0.18) 35%, rgba(92,6,20,0.08) 60%, transparent 80%)',
        }}
      />

      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [0, 0.2, 5.8], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        className="w-full h-full min-h-[580px] max-w-[720px] max-h-[820px] pointer-events-auto"
      >
        <ambientLight intensity={0.5} />
        {/* Cinematic crimson and top chrome key lights */}
        <directionalLight position={[0, 6, 4]} intensity={1.4} color="#FFFFFF" />
        <directionalLight position={[0, -4, 2]} intensity={1.8} color="#D10E24" />
        <pointLight position={[0, 0.6, 1.2]} intensity={3.5} color="#FF293F" distance={6} />
        <pointLight position={[-3, -2, -2]} intensity={1.5} color="#5C0614" />
        <pointLight position={[3, -2, -2]} intensity={1.5} color="#5C0614" />

        <JellyfishModel reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
};
