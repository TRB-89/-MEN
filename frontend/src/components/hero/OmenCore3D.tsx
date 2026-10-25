import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// Inner 3D Core Model Component
const CyberCoreModel: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Reusable materials
  const blackChromeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#08080C'),
        metalness: 0.95,
        roughness: 0.15,
        wireframe: false,
      }),
    []
  );

  const glassShardMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#101018'),
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.45,
        transmission: 0.6,
        ior: 1.5,
      }),
    []
  );

  const crimsonNucleusMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#B3122F'),
        emissive: new THREE.Color('#E34C67'),
        emissiveIntensity: 1.8,
        roughness: 0.3,
      }),
    []
  );

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#E34C67'),
        transparent: true,
        opacity: 0.4,
      }),
    []
  );

  // Line interconnect geometry
  const linePoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      pts.push(
        new THREE.Vector3(
          1.6 * Math.cos(theta) * Math.sin(phi),
          1.6 * Math.sin(theta) * Math.sin(phi),
          1.6 * Math.cos(phi)
        )
      );
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return geom;
  }, []);

  // Frame animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (!reducedMotion) {
      // Subtle organic rotation
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -state.pointer.y * 0.4,
        0.05
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        state.pointer.x * 0.3,
        0.05
      );

      // Inner nucleus pulsing
      if (nucleusRef.current) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
        nucleusRef.current.scale.set(pulse, pulse, pulse);
      }

      // Outer rings rotation
      if (ringsRef.current) {
        ringsRef.current.rotation.z -= delta * 0.3;
        ringsRef.current.rotation.x += delta * 0.15;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Central Black-Chrome Crystalline Core */}
      <mesh ref={coreRef} material={blackChromeMaterial}>
        <octahedronGeometry args={[1.2, 0]} />
      </mesh>

      {/* 2. Inner Glowing Crimson Neural Nucleus */}
      <mesh ref={nucleusRef} material={crimsonNucleusMaterial}>
        <icosahedronGeometry args={[0.55, 1]} />
      </mesh>

      {/* 3. Outer Semi-Transparent Crystalline Shards */}
      <mesh material={glassShardMaterial} position={[0.7, 0.7, 0.7]}>
        <boxGeometry args={[0.65, 0.65, 0.65]} />
      </mesh>
      <mesh material={glassShardMaterial} position={[-0.7, -0.7, -0.7]}>
        <boxGeometry args={[0.65, 0.65, 0.65]} />
      </mesh>
      <mesh material={glassShardMaterial} position={[-0.8, 0.6, -0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>
      <mesh material={glassShardMaterial} position={[0.8, -0.6, 0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>

      {/* 4. Fine Laser Signal Interconnects */}
      <primitive object={new THREE.Line(linePoints, lineMaterial)} />

      {/* 5. Orbital Geometric Halos */}
      <group ref={ringsRef}>
        <mesh>
          <ringGeometry args={[1.95, 2.0, 48]} />
          <meshBasicMaterial color="#B3122F" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[2.2, 2.22, 48]} />
          <meshBasicMaterial color="#D6D6DA" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

export const OmenCore3D: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Static Fallback if WebGL unsupported
  if (!hasWebGL) {
    return (
      <div className={`flex items-center justify-center p-8 bg-surface border border-border ${className}`}>
        <div className="w-48 h-48 rounded-full border border-crimson/50 bg-radial-gradient flex items-center justify-center shadow-crimson-md">
          <div className="w-24 h-24 bg-surface-elevated border-2 border-chrome transform rotate-45 flex items-center justify-center">
            <span className="w-4 h-4 bg-crimson" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {/* Background Volumetric Crimson Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 blur-3xl scale-125"
        style={{
          background: 'radial-gradient(circle, rgba(179,18,47,0.35) 0%, rgba(227,76,103,0.12) 40%, transparent 70%)',
        }}
      />

      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        className="w-full h-full max-w-[560px] max-h-[560px]"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-4, -3, -4]} intensity={0.8} color="#E34C67" />
        <pointLight position={[3, -2, 2]} intensity={0.6} color="#A95370" />

        <Float speed={reducedMotion ? 0 : 2} rotationIntensity={reducedMotion ? 0 : 0.4} floatIntensity={reducedMotion ? 0 : 0.6}>
          <CyberCoreModel reducedMotion={reducedMotion} />
        </Float>
      </Canvas>
    </div>
  );
};
