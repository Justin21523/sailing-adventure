/**
 * MerchantFleet.tsx
 * Renders the neutral merchant ships managed by MerchantSystem.
 * Each ship bobs on the ocean, sails along its heading, and shows a spinning
 * gold coin + glow when you are close enough to trade. No HTML lives in the
 * Canvas — the trade UI itself is the HTML MerchantTradePanel overlay.
 */

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { merchantSystem } from '@/core/systems/MerchantSystem';
import { getOceanHeight } from '@/core/physics/BuoyancySystem';
import { useUIStore } from '@/stores/uiStore';

function MerchantShipVisual({ id }: { id: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const coinRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const m = merchantSystem.getMerchant(id);
    const group = groupRef.current;
    if (!m || !group) return;

    const t = state.clock.elapsedTime;
    const bob = getOceanHeight(m.posX, m.posZ, t, 0.5);
    group.position.set(m.posX, m.posY + bob, m.posZ);
    group.rotation.y = m.heading;
    group.rotation.z = Math.sin(t * 0.8 + m.driftPhase) * 0.05;

    const near = useUIStore.getState().activeMerchantId === id && m.state === 'SAILING';
    if (coinRef.current) {
      coinRef.current.visible = near;
      coinRef.current.rotation.y = t * 2;
      coinRef.current.position.y = 7 + Math.sin(t * 2) * 0.3;
    }
    if (glowRef.current) glowRef.current.intensity = near ? 2.2 : 0;
  });

  return (
    <group ref={groupRef}>
      {/* Hull */}
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[3.4, 1.3, 9]} />
        <meshStandardMaterial color="#3E6B4F" roughness={0.8} />
      </mesh>
      {/* Deck */}
      <mesh castShadow position={[0, 1.75, 0]}>
        <boxGeometry args={[3, 0.25, 8.4]} />
        <meshStandardMaterial color="#A9824E" roughness={0.7} />
      </mesh>
      {/* Cargo crates */}
      <mesh castShadow position={[0, 2.3, 1.5]}>
        <boxGeometry args={[1.2, 1.1, 1.2]} />
        <meshStandardMaterial color="#7A5230" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.7, 2.15, -1.8]}>
        <boxGeometry args={[1, 0.9, 1]} />
        <meshStandardMaterial color="#8C5E37" roughness={0.85} />
      </mesh>
      {/* Mast */}
      <mesh castShadow position={[0, 5, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 7, 8]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      {/* Sail (blue/white to read as a trader, not a pirate) */}
      <mesh castShadow position={[0, 5, 0.25]}>
        <planeGeometry args={[4.4, 4.6]} />
        <meshStandardMaterial color="#DCE7F0" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position={[0, 7.6, 0]}>
        <planeGeometry args={[1.4, 0.7]} />
        <meshStandardMaterial color="#2E73C2" side={THREE.DoubleSide} />
      </mesh>

      {/* Trade indicator: spinning coin + warm glow when in range */}
      <mesh ref={coinRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.18, 16]} />
        <meshStandardMaterial color="#FFD54A" emissive="#FFB300" emissiveIntensity={1.2} metalness={0.6} roughness={0.3} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 6, 0]} color="#FFD54A" intensity={0} distance={26} />
    </group>
  );
}

export function MerchantFleet() {
  const [ids, setIds] = useState<string[]>([]);
  const lastKey = useRef('');

  useFrame(() => {
    const current = merchantSystem.getMerchants().map((m) => m.id);
    const key = current.join('|');
    if (key !== lastKey.current) {
      lastKey.current = key;
      setIds(current);
    }
  });

  return (
    <>
      {ids.map((id) => <MerchantShipVisual key={id} id={id} />)}
    </>
  );
}
