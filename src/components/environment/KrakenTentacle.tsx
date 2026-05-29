import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anomalyManager } from '@/core/systems/AnomalyManager';
import { gameWorld } from '@/core/engine/GameWorld';
import { useShipStore } from '@/stores/shipStore';
import { cameraShakeState } from '@/components/effects/CameraShake';

export function KrakenTentacle() {
  const groupRef = useRef<THREE.Group>(null);
  const attackTimer = useRef(0);
  const hasDamaged = useRef(false);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.5, 2.0, 15, 8, 4);
    const mat = new THREE.MeshStandardMaterial({ color: '#2E4A22', roughness: 0.6, flatShading: true });
    return { geometry: geo, material: mat };
  }, []);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    
    const krakens = anomalyManager.activeAnomalies.filter(a => a.type === 'KRAKEN');
    if (krakens.length > 0) {
      const k = krakens[0];
      groupRef.current.visible = true;
      groupRef.current.position.set(k.x, -5, k.z); 
      
      attackTimer.current += delta;
      const t = attackTimer.current;
      
      if (t < 2.0) {
        groupRef.current.position.y = THREE.MathUtils.lerp(-5, 8, t / 2.0);
        groupRef.current.rotation.z = Math.sin(t * 4) * 0.3;
        hasDamaged.current = false;
      } else if (t < 2.5) {
        groupRef.current.position.y = 8;
        groupRef.current.rotation.z = THREE.MathUtils.lerp(0.3, -1.2, (t - 2.0) / 0.5);
        
        if (!hasDamaged.current) {
          const shipPos = gameWorld.shipPhysics.position;
          const dx = shipPos.x - k.x;
          const dz = shipPos.z - k.z;
          if (dx * dx + dz * dz < k.radius * k.radius) {
            useShipStore.getState().takeDamage(20);
            cameraShakeState.trigger(3.0, 0.5);
            hasDamaged.current = true;
          }
        }
      } else if (t < 4.0) {
        groupRef.current.position.y = THREE.MathUtils.lerp(8, -10, (t - 2.5) / 1.5);
      } else {
        attackTimer.current = 0; 
      }
    } else {
      groupRef.current.visible = false;
      attackTimer.current = 0;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={geometry} material={material} castShadow />
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0.8, -5 + i * 3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 8]} />
          <meshStandardMaterial color="#1A2A12" />
        </mesh>
      ))}
    </group>
  );
}