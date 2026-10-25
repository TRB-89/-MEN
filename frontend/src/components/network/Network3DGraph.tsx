import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Server, 
  Laptop, 
  Database as DatabaseIcon, 
  Router, 
  KeyRound, 
  Flame, 
  Lock, 
  AlertTriangle,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { NetworkNode, NetworkEdge } from '../../types';

export interface Network3DGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId?: string | null;
  onSelectNode?: (node: NetworkNode) => void;
  highlightedPathNodes?: string[];
  isolatedNodes?: string[];
  className?: string;
}

// 3D Node Mesh Component
const SpatialNode: React.FC<{
  node: NetworkNode;
  position: [number, number, number];
  isSelected: boolean;
  isIsolated: boolean;
  isHighlightedOnPath: boolean;
  onSelect: (node: NetworkNode) => void;
}> = ({ node, position, isSelected, isIsolated, isHighlightedOnPath, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const isCompromised = node.security_status === 'COMPROMISED' || node.compromised;
  const isCritical = node.criticality === 'CRITICAL';
  const isHigh = node.criticality === 'HIGH';

  // Node Color based on security status & criticality
  const { nodeColor, emissiveColor, emissiveIntensity } = useMemo(() => {
    if (isIsolated) {
      return { nodeColor: '#3F3F46', emissiveColor: '#18181B', emissiveIntensity: 0.1 };
    }
    if (isCompromised) {
      return { nodeColor: '#F0354E', emissiveColor: '#B5122D', emissiveIntensity: 2.5 };
    }
    if (isHighlightedOnPath) {
      return { nodeColor: '#FF4D61', emissiveColor: '#F0354E', emissiveIntensity: 2.0 };
    }
    if (isCritical) {
      return { nodeColor: '#F59E0B', emissiveColor: '#78350F', emissiveIntensity: 1.2 };
    }
    if (isHigh) {
      return { nodeColor: '#E2E2E6', emissiveColor: '#52525B', emissiveIntensity: 0.6 };
    }
    return { nodeColor: '#A1A1AA', emissiveColor: '#27272A', emissiveIntensity: 0.4 };
  }, [isIsolated, isCompromised, isHighlightedOnPath, isCritical, isHigh]);

  // Subtle floating and pulsation in frame loop
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    if (isCompromised && !isIsolated) {
      const pulse = 1 + Math.sin(t * 4) * 0.1;
      meshRef.current.scale.set(pulse, pulse, pulse);
    } else if (isSelected) {
      const pulse = 1.1 + Math.sin(t * 3) * 0.05;
      meshRef.current.scale.set(pulse, pulse, pulse);
    } else if (hovered) {
      meshRef.current.scale.set(1.15, 1.15, 1.15);
    } else {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  // Geometry selector based on device type
  const renderGeometry = () => {
    const type = (node.device_type || node.asset_type || '').toLowerCase();
    switch (type) {
      case 'database':
        return <cylinderGeometry args={[0.35, 0.35, 0.6, 24]} />;
      case 'gateway':
      case 'router':
        return <torusGeometry args={[0.3, 0.12, 16, 32]} />;
      case 'firewall':
        return <tetrahedronGeometry args={[0.42]} />;
      case 'domain_controller':
        return <icosahedronGeometry args={[0.38]} />;
      case 'workstation':
        return <boxGeometry args={[0.5, 0.35, 0.45]} />;
      default:
        return <boxGeometry args={[0.45, 0.55, 0.45]} />;
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={nodeColor}
          emissive={emissiveColor}
          emissiveIntensity={hovered || isSelected ? emissiveIntensity * 1.5 : emissiveIntensity}
          roughness={0.25}
          metalness={0.7}
          wireframe={isIsolated}
        />
      </mesh>

      {/* Orbiting selection ring */}
      {(isSelected || hovered || isCompromised) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.62, 32]} />
          <meshBasicMaterial
            color={isCompromised ? '#F0354E' : isSelected ? '#E2E2E6' : '#95959E'}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 3D Floating Technical Tag */}
      <Html position={[0, 0.55, 0]} center distanceFactor={14} className="pointer-events-none select-none">
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap backdrop-blur-md border transition-all ${
            isSelected
              ? 'bg-crimson/90 border-white text-white font-bold shadow-[0_0_15px_rgba(240,53,78,0.8)] scale-110'
              : isCompromised
              ? 'bg-red-950/80 border-crimson text-crimson-glow font-bold animate-pulse'
              : hovered
              ? 'bg-[#101013]/90 border-white/40 text-white'
              : 'bg-[#050506]/75 border-white/10 text-muted opacity-80'
          }`}
        >
          {node.name}
        </div>
      </Html>
    </group>
  );
};

// 3D Connecting Edge Line
const SpatialEdge: React.FC<{
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
  isHighlighted: boolean;
  protocol?: string;
  port?: number;
}> = ({ sourcePos, targetPos, isHighlighted, protocol, port }) => {
  const lineObj = useMemo(() => {
    const points = [
      new THREE.Vector3(...sourcePos),
      new THREE.Vector3(...targetPos),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(isHighlighted ? '#F0354E' : '#3F3F46'),
      linewidth: isHighlighted ? 3 : 1,
      transparent: true,
      opacity: isHighlighted ? 0.9 : 0.4,
    });
    return new THREE.Line(geometry, material);
  }, [sourcePos, targetPos, isHighlighted]);

  return <primitive object={lineObj} />;
};

// Camera Controller that smoothly transitions to selected node
const CameraFocusController: React.FC<{ selectedPos: [number, number, number] | null }> = ({
  selectedPos,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (selectedPos && controlsRef.current) {
      const targetVec = new THREE.Vector3(selectedPos[0], selectedPos[1], selectedPos[2]);
      controlsRef.current.target.lerp(targetVec, 0.05);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={25}
      maxPolarAngle={Math.PI / 1.8}
      minPolarAngle={Math.PI / 6}
    />
  );
};

export const Network3DGraph: React.FC<Network3DGraphProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  highlightedPathNodes = [],
  isolatedNodes = [],
  className = '',
}) => {
  // Deterministic 3D Coordinates mapped by Zone & Layered Grid
  const nodePositions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    const zoneColMap: Record<string, number> = {
      DMZ: -5.5,
      APPLICATION: -1.8,
      INTERNAL: 1.8,
      DATABASE: 5.5,
      MANAGEMENT: 1.8,
    };

    const zoneCounters: Record<string, number> = {};

    nodes.forEach((node) => {
      const zone = node.zone || 'INTERNAL';
      const colX = zoneColMap[zone] ?? 0;
      const count = zoneCounters[zone] || 0;
      zoneCounters[zone] = count + 1;

      // Center vertically around origin
      const rowY = (count - 1.5) * 1.6;
      // Slight Z layer depth for spatial realism
      const depthZ = (count % 2 === 0 ? 0.6 : -0.6);

      map.set(node.id, [colX, rowY, depthZ]);
    });

    return map;
  }, [nodes]);

  const selectedPosition = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodePositions.get(selectedNodeId) || null;
  }, [selectedNodeId, nodePositions]);

  return (
    <div className={`w-full h-full relative overflow-hidden bg-[#050506] select-none ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 11], fov: 46 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        className="w-full h-full"
      >
        <color attach="background" args={['#050506']} />
        <fog attach="fog" args={['#050506', 12, 30]} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} color="#E2E2E6" />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} color="#B5122D" />
        <pointLight position={[0, 0, 5]} intensity={1.5} color="#F0354E" distance={15} />

        {/* Interactive Camera Controls */}
        <CameraFocusController selectedPos={selectedPosition} />

        {/* Subtle Spatial Coordinate Grid */}
        <gridHelper args={[24, 24, '#27272A', '#121215']} position={[0, -3.5, 0]} />

        {/* Render 3D Edges */}
        {edges.map((edge, idx) => {
          const sPos = nodePositions.get(edge.source);
          const tPos = nodePositions.get(edge.target);
          if (!sPos || !tPos) return null;

          const isHighlighted =
            highlightedPathNodes.length > 0 &&
            highlightedPathNodes.includes(edge.source) &&
            highlightedPathNodes.includes(edge.target);

          return (
            <SpatialEdge
              key={edge.id || `edge3d-${idx}`}
              sourcePos={sPos}
              targetPos={tPos}
              isHighlighted={isHighlighted}
              protocol={edge.protocol}
              port={edge.port}
            />
          );
        })}

        {/* Render 3D Nodes */}
        {nodes.map((node) => {
          const pos = nodePositions.get(node.id) || [0, 0, 0];
          const isSelected = selectedNodeId === node.id;
          const isIsolated = isolatedNodes.includes(node.id) || node.isolated;
          const isHighlighted = highlightedPathNodes.includes(node.id);

          return (
            <SpatialNode
              key={node.id}
              node={node}
              position={pos}
              isSelected={isSelected}
              isIsolated={!!isIsolated}
              isHighlightedOnPath={isHighlighted}
              onSelect={(n) => onSelectNode && onSelectNode(n)}
            />
          );
        })}
      </Canvas>

      {/* 3D Navigation Controls HUD Overlay */}
      <div className="absolute top-4 left-4 bg-[#101013]/85 backdrop-blur-md border border-white/10 rounded-xl p-3 font-mono text-xs space-y-2 pointer-events-auto">
        <div className="flex items-center justify-between text-muted text-[10px] uppercase font-bold tracking-wider">
          <span>3D SPATIAL EXPLORATION MODE</span>
          <span className="text-emerald-400">ORBIT ACTIVE</span>
        </div>
        <div className="text-[11px] text-secondary space-y-1">
          <div>• <strong>Left Click + Drag:</strong> Orbit Camera</div>
          <div>• <strong>Right Click + Drag:</strong> Pan Scene</div>
          <div>• <strong>Scroll Wheel:</strong> Zoom In / Out</div>
          <div>• <strong>Click Node:</strong> Focus & Select Asset</div>
        </div>
      </div>
    </div>
  );
};
