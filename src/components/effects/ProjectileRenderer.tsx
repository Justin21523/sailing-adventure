/**
 * ProjectileRenderer.tsx
 * High-performance rendering for all active cannonballs using InstancedMesh.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { projectilePhysics } from '@/core/physics/ProjectilePhysics';

const MAX_PROJECTILES = 100;

export function ProjectileRenderer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.2, 6, 6);
    const mat = new THREE.MeshStandardMaterial({ color: '#111', metalness: 0.8, roughness: 0.2 });
    return { geometry: geo, material: mat };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const active = projectilePhysics.getActiveProjectiles();
    
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      if (i < active.length) {
        const p = active[i];
        dummy.position.set(p.posX, p.posY, p.posZ);
        dummy.scale.setScalar(1);
      } else {
        // Hide unused instances
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, MAX_PROJECTILES]} castShadow frustumCulled={false} />;
}