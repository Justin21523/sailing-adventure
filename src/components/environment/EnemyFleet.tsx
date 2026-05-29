/**
 * EnemyFleet.tsx
 * Renders the visual representation of all active enemy ships.
 * Includes procedural pirate ship geometry and 3D billboard health bars.
 */
import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { enemyAI, type EnemyShip } from '@/core/systems/EnemyAI';

function EnemyShipVisual({ enemy }: { enemy: EnemyShip }) {
  const groupRef = useRef<THREE.Group>(null);
  const hpBarRef = useRef<THREE.Mesh>(null);
  const hpBgRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Sync position and rotation from AI
    groupRef.current.position.set(enemy.posX, enemy.posY + 1.5, enemy.posZ);
    groupRef.current.rotation.y = enemy.heading;
    
    // Sinking animation
    if (enemy.state === 'SINKING') {
      groupRef.current.rotation.z = Math.min(Math.PI / 3, groupRef.current.rotation.z + 0.02);
    }

    // Billboard Health Bar
    if (hpBarRef.current && hpBgRef.current) {
      // Always face camera
      hpBarRef.current.lookAt(state.camera.position);
      hpBgRef.current.lookAt(state.camera.position);
      
      // Update HP scale
      const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
      hpBarRef.current.scale.x = hpPct;
      // Shift origin to left-align the shrinking bar
      hpBarRef.current.position.x = -(1 - hpPct) * 1.5; 
      
      // Hide if full HP or sinking
      const showHp = enemy.hp < enemy.maxHp && enemy.state !== 'SINKING';
      hpBarRef.current.visible = showHp;
      hpBgRef.current.visible = showHp;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Pirate Hull (Dark Wood) */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.5, 1.2, 7]} />
        <meshStandardMaterial color="#2D1A11" roughness={0.9} />
      </mesh>
      
      {/* Deck */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[2.3, 0.2, 6.8]} />
        <meshStandardMaterial color="#1A0F0A" roughness={0.8} />
      </mesh>

      {/* Masts */}
      <mesh castShadow position={[0, 4, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 7, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      
      {/* Black/Red Sails */}
      <mesh castShadow position={[0, 4.5, 0.2]}>
        <planeGeometry args={[4, 5]} />
        <meshStandardMaterial color="#8B0000" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      
      <mesh castShadow position={[0, 2.5, 2.5]}>
        <cylinderGeometry args={[0.1, 0.15, 4, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh castShadow position={[0, 3, 2.7]}>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial color="#111" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>

      {/* 3D Health Bar Background */}
      <mesh ref={hpBgRef} position={[0, 8, 0]} visible={false}>
        <planeGeometry args={[3.2, 0.4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* 3D Health Bar Fill */}
      <mesh ref={hpBarRef} position={[0, 8, 0.01]} visible={false}>
        <planeGeometry args={[3, 0.2]} />
        <meshBasicMaterial color="#FF3333" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function EnemyFleet() {
  // We use a manual render loop approach via state to avoid re-rendering the whole tree
  // every frame. Instead, we poll the AI and update a local state only when the list changes.
  const [enemies, setEnemies] = useState<EnemyShip[]>([]);
  const lastCount = useRef(0);

  useFrame(() => {
    const current = enemyAI.getEnemies();
    if (current.length !== lastCount.current) {
      lastCount.current = current.length;
      setEnemies([...current]);
    }
  });

  return (
    <>
      {enemies.map(e => <EnemyShipVisual key={e.id} enemy={e} />)}
    </>
  );
}

