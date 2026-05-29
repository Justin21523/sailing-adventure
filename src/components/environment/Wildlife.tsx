/**
 * Wildlife.tsx
 * Procedural flock of seabirds circling the ship and islands.
 * Uses simple steering behaviors to maintain formation and avoid crashing.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameWorld } from '@/core/engine/GameWorld';

const BIRD_COUNT = 20;

interface Bird {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  phase: number;
}

export function Wildlife() {
  const groupRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const birds = useMemo<Bird[]>(() => {
    return Array.from({ length: BIRD_COUNT }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        15 + Math.random() * 10,
        (Math.random() - 0.5) * 40
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        0,
        (Math.random() - 0.5) * 5
      ),
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  const { geometry, material } = useMemo(() => {
    // Simple cone for bird body
    const geo = new THREE.ConeGeometry(0.2, 0.8, 4);
    geo.rotateX(Math.PI / 2); // Point forward
    const mat = new THREE.MeshStandardMaterial({ color: '#F8F9FA', flatShading: true });
    return { geometry: geo, material: mat };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const shipPos = gameWorld.shipPhysics.position;
    const mesh = groupRef.current.children[0] as THREE.InstancedMesh;
    if (!mesh) return;

    const target = new THREE.Vector3(shipPos.x, 20, shipPos.z);

    for (let i = 0; i < BIRD_COUNT; i++) {
      const b = birds[i];

      // Steering: Seek target (ship) but maintain distance
      const toTarget = target.clone().sub(b.position);
      const dist = toTarget.length();
      
      if (dist > 30) {
        b.velocity.add(toTarget.normalize().multiplyScalar(2 * delta));
      } else if (dist < 10) {
        b.velocity.add(toTarget.normalize().multiplyScalar(-2 * delta));
      }

      // Circling behavior
      const perp = new THREE.Vector3(-b.velocity.z, 0, b.velocity.x).normalize();
      b.velocity.add(perp.multiplyScalar(1.5 * delta));

      // Limit speed
      if (b.velocity.length() > 8) b.velocity.setLength(8);

      // Integrate
      b.position.add(b.velocity.clone().multiplyScalar(delta));
      
      // Flapping animation (Y-axis bobbing)
      const flapY = Math.sin(time * 8 + b.phase) * 0.5;

      dummy.position.copy(b.position);
      dummy.position.y += flapY;
      dummy.lookAt(b.position.clone().add(b.velocity));
      dummy.updateMatrix();
      
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh args={[geometry, material, BIRD_COUNT]} castShadow frustumCulled={false} />
    </group>
  );
}