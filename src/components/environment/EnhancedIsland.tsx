/**
 * EnhancedIsland.tsx
 * Renders diverse island biomes with procedural geometry.
 * Includes Forests, Volcanoes, Ruins, and Lighthouses.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { IslandData } from '@/core/systems/ChunkManager';

interface EnhancedIslandProps {
  data: IslandData;
}

export function EnhancedIsland({ data }: EnhancedIslandProps) {
  const { position, scale, seed, biome, hasLighthouse, hasRuins } = data;
  const isRuins = biome === 'RUINS' || hasRuins;

  const { baseGeo, features } = useMemo(() => {
    let s = seed;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

    // Base Island Shape
    const base = new THREE.CylinderGeometry(8, 12, 3, 16, 1);
    const posAttr = base.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 2) {
        posAttr.setX(i, x + (rand() - 0.5) * 3);
        posAttr.setZ(i, z + (rand() - 0.5) * 3);
      }
    }
    base.computeVertexNormals();

    const feats: { geo: THREE.BufferGeometry; color: string; pos: [number, number, number]; emissive?: string }[] = [];

    // Biome Specific Features
    if (biome === 'FOREST') {
      const treeCount = 5 + Math.floor(rand() * 6);
      for (let i = 0; i < treeCount; i++) {
        const tGeo = new THREE.ConeGeometry(1.5 + rand(), 4 + rand() * 4, 6, 1);
        const angle = rand() * Math.PI * 2;
        const dist = 2 + rand() * 5;
        tGeo.translate(Math.cos(angle) * dist, tGeo.parameters.height / 2 + 1, Math.sin(angle) * dist);
        feats.push({ geo: tGeo, color: rand() > 0.5 ? '#2E5C31' : '#4A7C59', pos: [0, 0, 0] });
      }
    } else if (biome === 'VOLCANIC') {
      const vGeo = new THREE.ConeGeometry(6, 10, 8, 1);
      const vAttr = vGeo.attributes.position;
      for (let i = 0; i < vAttr.count; i++) {
        vAttr.setX(i, vAttr.getX(i) + (rand() - 0.5) * 2);
        vAttr.setZ(i, vAttr.getZ(i) + (rand() - 0.5) * 2);
      }
      vGeo.computeVertexNormals();
      vGeo.translate(0, 5, 0);
      feats.push({ geo: vGeo, color: '#2D2D2D', pos: [0, 0, 0] });
      
      // Lava Core
      const lavaGeo = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
      lavaGeo.translate(0, 9.5, 0);
      feats.push({ geo: lavaGeo, color: '#FF4500', pos: [0, 0, 0], emissive: '#FF2200' });
    } else if (isRuins) {
      const pillarCount = 3 + Math.floor(rand() * 4);
      for (let i = 0; i < pillarCount; i++) {
        const pGeo = new THREE.CylinderGeometry(0.6, 0.8, 3 + rand() * 4, 6);
        const angle = rand() * Math.PI * 2;
        const dist = 2 + rand() * 4;
        pGeo.translate(Math.cos(angle) * dist, pGeo.parameters.height / 2 + 1, Math.sin(angle) * dist);
        feats.push({ geo: pGeo, color: '#A0AEC0', pos: [0, 0, 0] });
      }
      // Glowing Artifact
      const artGeo = new THREE.OctahedronGeometry(0.8, 0);
      artGeo.translate(0, 3, 0);
      feats.push({ geo: artGeo, color: '#00FFFF', pos: [0, 0, 0], emissive: '#00FFFF' });
    } else if (biome === 'SAND_BANK') {
      // Just some rocks
      for (let i = 0; i < 3; i++) {
        const rGeo = new THREE.DodecahedronGeometry(1 + rand(), 0);
        const angle = rand() * Math.PI * 2;
        rGeo.translate(Math.cos(angle) * 4, 1, Math.sin(angle) * 4);
        feats.push({ geo: rGeo, color: '#CBD5E0', pos: [0, 0, 0] });
      }
    }

    // Lighthouse
    if (hasLighthouse) {
      const towerGeo = new THREE.CylinderGeometry(1, 1.5, 12, 8);
      towerGeo.translate(5, 6, 5);
      feats.push({ geo: towerGeo, color: '#F5F5DC', pos: [0, 0, 0] });
      
      const topGeo = new THREE.ConeGeometry(1.5, 2, 8);
      topGeo.translate(5, 13, 5);
      feats.push({ geo: topGeo, color: '#E53E3E', pos: [0, 0, 0] });

      const lightGeo = new THREE.SphereGeometry(0.8, 8, 8);
      lightGeo.translate(5, 12, 5);
      feats.push({ geo: lightGeo, color: '#FFFF00', pos: [0, 0, 0], emissive: '#FFFF00' });
    }

    return { baseGeo: base, features: feats };
  }, [seed, biome, hasLighthouse, isRuins]);

  const baseColor = biome === 'VOLCANIC' ? '#1A1A1A' : isRuins ? '#8B7355' : '#E3C182';

  return (
    <group position={position} scale={scale}>
      <mesh geometry={baseGeo} castShadow receiveShadow position={[0, -0.5, 0]}>
        <meshStandardMaterial color={baseColor} roughness={0.9} flatShading />
      </mesh>
      
      {features.map((f, i) => (
        <mesh key={i} geometry={f.geo} castShadow receiveShadow position={f.pos}>
          <meshStandardMaterial 
            color={f.color} 
            emissive={f.emissive || '#000000'}
            emissiveIntensity={f.emissive ? 2.0 : 0}
            roughness={0.8} 
            flatShading 
          />
        </mesh>
      ))}

      {hasLighthouse && (
        <>
          <pointLight position={[5, 12, 5]} color="#FFF59D" intensity={2.4} distance={85} decay={1.6} />
          <mesh position={[5, 12, 5]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[2.2, 18, 16, 1, true]} />
            <meshBasicMaterial color="#FFF59D" transparent opacity={0.14} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {isRuins && (
        <pointLight position={[0, 4, 0]} color="#00FFFF" intensity={1.7} distance={45} decay={1.8} />
      )}
    </group>
  );
}
