import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type OmenEntityState = 'IDLE' | 'ANALYZING' | 'ELEVATED_RISK' | 'SIMULATION';

interface JellyfishProps {
  reducedMotion?: boolean;
  entityState?: OmenEntityState;
}

/**
 * Responsive Camera Framing Controller
 * Dynamically adjusts camera distance and framing based on viewport aspect ratio
 * ensuring the entire bell dome and flowing tentacles are visible without cropping.
 */
const ResponsiveCameraController: React.FC = () => {
  const { camera, size } = useThree();

  useFrame(() => {
    const aspect = size.width / Math.max(1, size.height);
    let targetZ = 6.4;
    let targetY = -0.65;

    if (aspect < 0.75) {
      // Mobile portrait (narrow phone screens like 390x844)
      targetZ = 8.8;
      targetY = -0.45;
    } else if (aspect < 1.1) {
      // Tablets / portrait layouts (768x1024, 1024x768)
      targetZ = 7.6;
      targetY = -0.55;
    } else if (aspect < 1.5) {
      // Standard laptops (1366x768, 1440x900)
      targetZ = 6.6;
      targetY = -0.65;
    } else {
      // Widescreen desktop (1920x1080)
      targetZ = 6.2;
      targetY = -0.7;
    }

    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
    camera.lookAt(0, -0.65, 0);
  });

  return null;
};

/**
 * Realistic Procedural 3D Jellyfish Neural Entity
 * - High-resolution organic bell geometry with 16 undulating scalloped lappets
 * - Translucent crimson physical material with realistic transmission and specular rim highlights
 * - 4 undulating frilled oral arms hanging through the central axis
 * - 48 multi-layered flowing marginal filaments with physics-inspired wave propagation
 * - Inner glowing neural core with concentric cybernetic rings and radial canal lines
 * - Drifting bioluminescent particles
 */
const JellyfishModel: React.FC<JellyfishProps> = ({ reducedMotion = false, entityState = 'IDLE' }) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const bellMeshRef = useRef<THREE.Mesh>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const filamentsRef = useRef<THREE.LineSegments>(null);
  const oralArmsRef = useRef<THREE.LineSegments>(null);
  const meridiansRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Mouse parallax interaction
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 1. Organic Exumbrella Material (Deep translucent crimson with soft highlights)
  const bellMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#A80C1C'),
        emissive: new THREE.Color('#40040A'),
        emissiveIntensity: 0.85,
        roughness: 0.16,
        metalness: 0.06,
        transmission: 0.88,
        thickness: 1.8,
        ior: 1.34,
        specularColor: new THREE.Color('#FF4D61'),
        specularIntensity: 1.2,
        clearcoat: 0.75,
        clearcoatRoughness: 0.12,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  // 2. Inner Subumbrella / Velum Material
  const innerBellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#D10E24'),
        emissive: new THREE.Color('#5C0614'),
        emissiveIntensity: 1.4,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  // 3. Central Neural Nucleus (Pulsing cyber core)
  const nucleusMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FF293F'),
        emissive: new THREE.Color('#FF293F'),
        emissiveIntensity: 2.6,
        roughness: 0.25,
        metalness: 0.15,
      }),
    []
  );

  // 4. Filaments Material (Outer marginal translucent tendrils)
  const filamentMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#FF3B50'),
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // 5. Central Frilled Oral Arms Material (Deeper crimson wave ribbons)
  const oralMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#E6152B'),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // 6. Neural Meridians / Radial Canal Lines Material
  const meridianMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#FF5265'),
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // 7. Drifting Bioluminescent Particles Material
  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color('#FF293F'),
        size: 0.045,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // --- Construct Procedural Organic Scalloped Bell Geometry ---
  const { bellGeom, innerBellGeom, basePositions } = useMemo(() => {
    const radialSegs = 64;
    const heightSegs = 36;
    const geom = new THREE.BufferGeometry();
    const innerGeom = new THREE.BufferGeometry();

    const vertices: number[] = [];
    const innerVertices: number[] = [];
    const indices: number[] = [];

    for (let yIdx = 0; yIdx <= heightSegs; yIdx++) {
      const v = yIdx / heightSegs;
      const y = 1.35 * (1 - Math.pow(v, 1.35));
      const baseR = 1.45 * Math.pow(Math.sin(v * Math.PI * 0.5), 0.78) * (1 + 0.12 * Math.pow(v, 3));

      for (let rIdx = 0; rIdx <= radialSegs; rIdx++) {
        const u = rIdx / radialSegs;
        const theta = u * Math.PI * 2;
        const scallop = 1 + 0.035 * Math.pow(v, 2.5) * Math.cos(16 * theta);
        const r = baseR * scallop;

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        vertices.push(x, y, z);
        innerVertices.push(x * 0.94, y * 0.96 - 0.02, z * 0.94);
      }
    }

    for (let yIdx = 0; yIdx < heightSegs; yIdx++) {
      for (let rIdx = 0; rIdx < radialSegs; rIdx++) {
        const p1 = yIdx * (radialSegs + 1) + rIdx;
        const p2 = p1 + 1;
        const p3 = (yIdx + 1) * (radialSegs + 1) + rIdx;
        const p4 = p3 + 1;

        indices.push(p1, p3, p2);
        indices.push(p2, p3, p4);
      }
    }

    const posArray = new Float32Array(vertices);
    geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const innerPosArray = new Float32Array(innerVertices);
    innerGeom.setAttribute('position', new THREE.BufferAttribute(innerPosArray, 3));
    innerGeom.setIndex(indices);
    innerGeom.computeVertexNormals();

    const basePositionsCopy = new Float32Array(posArray);

    return { bellGeom: geom, innerBellGeom: innerGeom, basePositions: basePositionsCopy };
  }, []);

  // --- Construct 16 Neural Radial Meridian Lines ---
  const meridianGeom = useMemo(() => {
    const linesCount = 16;
    const pointsPerLine = 20;
    const totalPoints = linesCount * (pointsPerLine - 1) * 2;
    const positions = new Float32Array(totalPoints * 3);
    let p = 0;

    for (let m = 0; m < linesCount; m++) {
      const theta = (m / linesCount) * Math.PI * 2;
      for (let i = 0; i < pointsPerLine - 1; i++) {
        const v0 = i / (pointsPerLine - 1);
        const y0 = 1.34 * (1 - Math.pow(v0, 1.35));
        const r0 = 1.44 * Math.pow(Math.sin(v0 * Math.PI * 0.5), 0.78) * (1 + 0.12 * Math.pow(v0, 3));
        const x0 = Math.cos(theta) * r0;
        const z0 = Math.sin(theta) * r0;

        const v1 = (i + 1) / (pointsPerLine - 1);
        const y1 = 1.34 * (1 - Math.pow(v1, 1.35));
        const r1 = 1.44 * Math.pow(Math.sin(v1 * Math.PI * 0.5), 0.78) * (1 + 0.12 * Math.pow(v1, 3));
        const x1 = Math.cos(theta) * r1;
        const z1 = Math.sin(theta) * r1;

        positions[p++] = x0;
        positions[p++] = y0;
        positions[p++] = z0;
        positions[p++] = x1;
        positions[p++] = y1;
        positions[p++] = z1;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  // --- Construct 48 Marginal Filaments (Tendrils) ---
  const strandCount = 48;
  const vertsPerStrand = 30;
  const { filamentGeom, strandData } = useMemo(() => {
    const totalVerts = strandCount * (vertsPerStrand - 1) * 2;
    const positions = new Float32Array(totalVerts * 3);
    const data: Array<{
      radius: number;
      angle: number;
      length: number;
      speed: number;
      phase: number;
      freq: number;
      amp: number;
    }> = [];

    for (let s = 0; s < strandCount; s++) {
      const angle = (s / strandCount) * Math.PI * 2;
      const radius = 1.42 + (Math.sin(s * 3.7) * 0.08);
      const length = 2.8 + (Math.sin(s * 1.5) + 1) * 0.65;
      const speed = 1.1 + Math.sin(s * 2.3) * 0.3;
      const phase = s * 0.35;
      const freq = 1.8 + Math.cos(s * 1.7) * 0.4;
      const amp = 0.22 + Math.sin(s * 4.1) * 0.08;

      data.push({ radius, angle, length, speed, phase, freq, amp });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { filamentGeom: geom, strandData: data };
  }, []);

  // --- Construct 6 Central Frilled Oral Arms ---
  const oralCount = 6;
  const vertsPerOral = 36;
  const { oralGeom, oralData } = useMemo(() => {
    const totalVerts = oralCount * (vertsPerOral - 1) * 2;
    const positions = new Float32Array(totalVerts * 3);
    const data: Array<{
      angle: number;
      length: number;
      speed: number;
      phase: number;
    }> = [];

    for (let o = 0; o < oralCount; o++) {
      const angle = (o / oralCount) * Math.PI * 2;
      const length = 3.2 + (o % 2) * 0.4;
      const speed = 0.95 + o * 0.12;
      const phase = o * (Math.PI / 3);
      data.push({ angle, length, speed, phase });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { oralGeom: geom, oralData: data };
  }, []);

  // --- Construct Drifting Bioluminescent Particles ---
  const particleCount = 85;
  const particleGeom = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.random() * 2.4;
      const y = -3.2 + Math.random() * 4.6;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      bellGeom.dispose();
      innerBellGeom.dispose();
      meridianGeom.dispose();
      filamentGeom.dispose();
      oralGeom.dispose();
      particleGeom.dispose();
      bellMaterial.dispose();
      innerBellMaterial.dispose();
      nucleusMaterial.dispose();
      filamentMaterial.dispose();
      oralMaterial.dispose();
      meridianMaterial.dispose();
      particleMaterial.dispose();
    };
  }, [
    bellGeom,
    innerBellGeom,
    meridianGeom,
    filamentGeom,
    oralGeom,
    particleGeom,
    bellMaterial,
    innerBellMaterial,
    nucleusMaterial,
    filamentMaterial,
    oralMaterial,
    meridianMaterial,
    particleMaterial,
  ]);

  // --- Animation Loop with State-Responsive Behavioral Modes ---
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Application state parameters
    let speedMult = 1.0;
    let emissivePulse = 2.4 + Math.sin(time * 2.7) * 0.8;
    let ringRotSpeed = 0.15;
    let pulseFrequency = 1.35;
    let contractDepth = 0.14;

    if (entityState === 'ANALYZING') {
      speedMult = 1.35;
      pulseFrequency = 2.2;
      emissivePulse = 3.0 + Math.sin(time * 5.5) * 1.0;
      ringRotSpeed = 0.45;
    } else if (entityState === 'ELEVATED_RISK') {
      speedMult = 1.7;
      pulseFrequency = 2.8;
      contractDepth = 0.22;
      emissivePulse = 3.8 + Math.sin(time * 6.5) * 1.4;
      ringRotSpeed = 0.65;
    } else if (entityState === 'SIMULATION') {
      speedMult = 1.25;
      pulseFrequency = 1.6;
      emissivePulse = 2.9 + Math.sin(time * 3.5) * 0.9;
      ringRotSpeed = 0.3;
    }

    // 1. Root group organic swimming translation & cursor parallax
    if (rootGroupRef.current) {
      if (!reducedMotion) {
        const swimCycle = Math.sin(time * pulseFrequency);
        const floatY = 0.05 + swimCycle * (0.12 * speedMult);
        rootGroupRef.current.position.y = floatY;

        const targetRotX = mouseRef.current.y * 0.12;
        const targetRotY = mouseRef.current.x * 0.16 + Math.sin(time * 0.4) * 0.05;
        rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(rootGroupRef.current.rotation.x, targetRotX, delta * 2.5);
        rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(rootGroupRef.current.rotation.y, targetRotY, delta * 2.5);
      }
    }

    // 2. Bell Swimming Contraction / Expansion
    if (bellMeshRef.current && !reducedMotion) {
      const posAttr = bellMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const count = posAttr.count;

      const pulsePhase = Math.sin(time * pulseFrequency);
      const contractFactor = 1.0 - Math.max(0, pulsePhase) * contractDepth + Math.min(0, pulsePhase) * 0.06;
      const apexPush = Math.max(0, pulsePhase) * 0.12;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const baseX = basePositions[i3];
        const baseY = basePositions[i3 + 1];
        const baseZ = basePositions[i3 + 2];

        const heightRatio = Math.max(0, baseY / 1.35);
        const rimInfluence = Math.pow(1 - heightRatio, 1.2);

        posArray[i3] = baseX * (1 - (1 - contractFactor) * rimInfluence);
        posArray[i3 + 1] = baseY + apexPush * heightRatio;
        posArray[i3 + 2] = baseZ * (1 - (1 - contractFactor) * rimInfluence);
      }
      posAttr.needsUpdate = true;
    }

    // 3. Inner Nucleus Pulse & Cybernetic Rings Rotation
    if (nucleusRef.current) {
      const pulse = 1.0 + Math.sin(time * (pulseFrequency * 2)) * 0.08;
      nucleusRef.current.scale.set(pulse, pulse, pulse);
      if (!reducedMotion) {
        nucleusMaterial.emissiveIntensity = emissivePulse;
        if (entityState === 'ELEVATED_RISK') {
          nucleusMaterial.emissive.set('#F02D46');
        } else {
          nucleusMaterial.emissive.set('#FF293F');
        }
      }
    }

    if (ringsRef.current && !reducedMotion) {
      ringsRef.current.rotation.z += delta * ringRotSpeed;
    }

    // 4. Update 48 Marginal Filaments (Physics Wave Propagation + Simulation Pulse Sequence)
    if (filamentsRef.current && !reducedMotion) {
      const posAttr = filamentsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      let idx = 0;

      const pulsePhase = Math.sin(time * pulseFrequency);
      const rimContract = 1.0 - Math.max(0, pulsePhase) * contractDepth + Math.min(0, pulsePhase) * 0.06;

      for (let s = 0; s < strandCount; s++) {
        const sd = strandData[s];
        const currentRadius = sd.radius * rimContract;

        for (let v = 0; v < vertsPerStrand - 1; v++) {
          const t0 = v / (vertsPerStrand - 1);
          const y0 = 0.05 - t0 * sd.length;
          
          // In SIMULATION state: sequential traveling wave pulse along the tendrils
          let simOffset0 = 0;
          if (entityState === 'SIMULATION') {
            simOffset0 = Math.sin(time * 5.0 - t0 * 9.0 + sd.phase) * 0.08;
          }

          const waveAmp0 = (sd.amp + simOffset0) * Math.pow(t0, 1.3);
          const waveX0 = Math.sin(time * (sd.speed * speedMult) + t0 * sd.freq * 4.5 + sd.phase) * waveAmp0;
          const waveZ0 = Math.cos(time * (sd.speed * speedMult) * 0.85 + t0 * sd.freq * 3.8 + sd.phase) * waveAmp0;

          const r0 = currentRadius * (1 - t0 * 0.28);
          const x0 = Math.cos(sd.angle) * r0 + waveX0;
          const z0 = Math.sin(sd.angle) * r0 + waveZ0;

          const t1 = (v + 1) / (vertsPerStrand - 1);
          const y1 = 0.05 - t1 * sd.length;
          
          let simOffset1 = 0;
          if (entityState === 'SIMULATION') {
            simOffset1 = Math.sin(time * 5.0 - t1 * 9.0 + sd.phase) * 0.08;
          }

          const waveAmp1 = (sd.amp + simOffset1) * Math.pow(t1, 1.3);
          const waveX1 = Math.sin(time * (sd.speed * speedMult) + t1 * sd.freq * 4.5 + sd.phase) * waveAmp1;
          const waveZ1 = Math.cos(time * (sd.speed * speedMult) * 0.85 + t1 * sd.freq * 3.8 + sd.phase) * waveAmp1;

          const r1 = currentRadius * (1 - t1 * 0.28);
          const x1 = Math.cos(sd.angle) * r1 + waveX1;
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

    // 5. Update 6 Frilled Oral Arms (Undulating Central Ribbons)
    if (oralArmsRef.current && !reducedMotion) {
      const posAttr = oralArmsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      let idx = 0;

      for (let o = 0; o < oralCount; o++) {
        const od = oralData[o];
        for (let v = 0; v < vertsPerOral - 1; v++) {
          const t0 = v / (vertsPerOral - 1);
          const y0 = -0.05 - t0 * od.length;
          const spiral0 = od.angle + t0 * 2.5 + Math.sin(time * (od.speed * speedMult) + t0 * 4.2 + od.phase) * 0.35;
          const r0 = 0.42 * (1 - t0 * 0.4) + Math.sin(time * 1.6 + t0 * 5) * 0.08;
          const x0 = Math.cos(spiral0) * r0;
          const z0 = Math.sin(spiral0) * r0;

          const t1 = (v + 1) / (vertsPerOral - 1);
          const y1 = -0.05 - t1 * od.length;
          const spiral1 = od.angle + t1 * 2.5 + Math.sin(time * (od.speed * speedMult) + t1 * 4.2 + od.phase) * 0.35;
          const r1 = 0.42 * (1 - t1 * 0.4) + Math.sin(time * 1.6 + t1 * 5) * 0.08;
          const x1 = Math.cos(spiral1) * r1;
          const z1 = Math.sin(spiral1) * r1;

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

    // 6. Drift Particles
    if (particlesRef.current && !reducedMotion) {
      const pSpeed = entityState === 'ELEVATED_RISK' ? 0.12 : 0.05;
      particlesRef.current.rotation.y += delta * pSpeed;
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, 0, 0]}>
      {/* 1. Outer Translucent Crimson Jellyfish Bell */}
      <mesh ref={bellMeshRef} geometry={bellGeom} material={bellMaterial} />

      {/* 2. Inner Subumbrella / Velum Membrane */}
      <mesh geometry={innerBellGeom} material={innerBellMaterial} />

      {/* 3. Neural Radial Meridian Canal Lines */}
      <lineSegments ref={meridiansRef} geometry={meridianGeom} material={meridianMaterial} />

      {/* 4. Central Glowing Neural Nucleus */}
      <mesh ref={nucleusRef} material={nucleusMaterial} position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.38, 32, 32]} />
      </mesh>

      {/* 5. Concentric Cybernetic Meridian Rings */}
      <group ref={ringsRef} position={[0, 0.45, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.58, 48]} />
          <meshBasicMaterial color="#FF293F" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0.4, 0]}>
          <ringGeometry args={[0.82, 0.85, 48]} />
          <meshBasicMaterial color="#D10E24" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 6. Central Frilled Oral Arms */}
      <lineSegments ref={oralArmsRef} geometry={oralGeom} material={oralMaterial} />

      {/* 7. 48 Flowing Marginal Filaments */}
      <lineSegments ref={filamentsRef} geometry={filamentGeom} material={filamentMaterial} />

      {/* 8. Drifting Bioluminescent Particles */}
      <points ref={particlesRef} geometry={particleGeom} material={particleMaterial} />
    </group>
  );
};

export const OmenJellyfishEntity: React.FC<{
  className?: string;
  entityState?: OmenEntityState;
}> = ({ className = '', entityState = 'IDLE' }) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

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
        <div className="relative w-72 h-96 flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-radial-gradient from-crimson/30 via-crimson/10 to-transparent rounded-full blur-2xl animate-pulse-crimson" />
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
            <path
              d="M 30,90 C 30,25 170,25 170,90 C 170,105 155,108 140,102 C 125,96 110,105 100,105 C 90,105 75,96 60,102 C 45,108 30,105 30,90 Z"
              fill="url(#bellGlow)"
              stroke="#FF293F"
              strokeWidth="1.5"
            />
            <circle cx="100" cy="65" r="16" fill="#FF293F" opacity="0.8" />
            <circle cx="100" cy="65" r="8" fill="#FFFFFF" opacity="0.9" />
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
    <div className={`relative flex items-center justify-center overflow-visible pointer-events-none ${className}`}>
      {/* Background Volumetric Crimson Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 blur-3xl scale-125"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(255,41,63,0.28) 0%, rgba(209,14,36,0.14) 35%, rgba(92,6,20,0.06) 65%, transparent 80%)',
        }}
      />

      {/* R3F Canvas with responsive camera framing and unclipped dimensions */}
      <Canvas
        camera={{ position: [0, -0.65, 6.4], fov: 44, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        className="w-full h-full pointer-events-auto"
      >
        <ResponsiveCameraController />

        <ambientLight intensity={0.4} />
        {/* Cinematic crimson key and soft top chrome lights */}
        <directionalLight position={[0, 6, 4]} intensity={1.5} color="#FFFFFF" />
        <directionalLight position={[0, -5, 3]} intensity={2.2} color="#D10E24" />
        <pointLight position={[0, 0.45, 1.2]} intensity={3.8} color="#FF293F" distance={7} />
        <pointLight position={[-3, -1, -2]} intensity={1.6} color="#5C0614" />
        <pointLight position={[3, -1, -2]} intensity={1.6} color="#5C0614" />

        <JellyfishModel reducedMotion={reducedMotion} entityState={entityState} />
      </Canvas>
    </div>
  );
};
