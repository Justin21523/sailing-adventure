/**
 * CombatVFX.tsx
 * Listens to ProjectilePhysics impact events and renders explosions or water splashes.
 * Uses an object pool of particle systems to maintain 60fps during heavy bombardment.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { projectilePhysics, type ImpactEvent } from '@/core/physics/ProjectilePhysics';
import { createSoftCircleTexture } from '@/utils/proceduralTextures';

const MAX_EFFECTS = 20;
const PARTICLES_PER_EFFECT = 30;

interface VFXInstance {
  active: boolean;
  life: number;
  maxLife: number;
  type: 'explosion' | 'splash';
  origin: THREE.Vector3;
  particles: { pos: THREE.Vector3, vel: THREE.Vector3 }[];
}

export function CombatVFX() {
  const pointsRef = useRef<THREE.Points>(null);
  const texture = useMemo(() => createSoftCircleTexture(64), []);
  
  const pool = useMemo<VFXInstance[]>(() => {
    return Array.from({ length: MAX_EFFECTS }, () => ({
      active: false, life: 0, maxLife: 1.0, type: 'explosion',
      origin: new THREE.Vector3(),
      particles: Array.from({ length: PARTICLES_PER_EFFECT }, () => ({
        pos: new THREE.Vector3(), vel: new THREE.Vector3()
      }))
    }));
  }, []);

  const totalParticles = MAX_EFFECTS * PARTICLES_PER_EFFECT;
  const { positions, colors, sizes, geometry } = useMemo(() => {
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return { positions, colors, sizes, geometry };
  }, [totalParticles]);

  useEffect(() => {
    const handleImpact = (event: ImpactEvent) => {
      const vfx = pool.find(v => !v.active);
      if (!vfx) return;

      vfx.active = true;
      vfx.life = 1.0;
      vfx.maxLife = 1.0;
      vfx.type = event.type;
      vfx.origin.set(event.x, event.y, event.z);

      for (const p of vfx.particles) {
        p.pos.copy(vfx.origin);
        if (event.type === 'explosion') {
          p.vel.set((Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10);
        } else {
          // Splash: Upward and outward
          p.vel.set((Math.random() - 0.5) * 5, 5 + Math.random() * 5, (Math.random() - 0.5) * 5);
        }
      }
    };

    projectilePhysics.onImpact = handleImpact;
    return () => { projectilePhysics.onImpact = () => {}; };
  }, [pool]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    let pIdx = 0;

    for (const vfx of pool) {
      if (vfx.active) {
        vfx.life -= delta;
        if (vfx.life <= 0) {
          vfx.active = false;
        }
      }

      for (const p of vfx.particles) {
        if (vfx.active) {
          p.vel.y -= 9.8 * delta; // Gravity
          p.pos.addScaledVector(p.vel, delta);
          
          const lifeRatio = vfx.life / vfx.maxLife;
          sizes[pIdx] = lifeRatio * 3.0;
          
          if (vfx.type === 'explosion') {
            colors[pIdx * 3] = 1.0;
            colors[pIdx * 3 + 1] = 0.5 * lifeRatio; // Fade to dark smoke
            colors[pIdx * 3 + 2] = 0.0;
          } else {
            colors[pIdx * 3] = 0.8;
            colors[pIdx * 3 + 1] = 0.9;
            colors[pIdx * 3 + 2] = 1.0;
          }
          
          positions[pIdx * 3] = p.pos.x;
          positions[pIdx * 3 + 1] = p.pos.y;
          positions[pIdx * 3 + 2] = p.pos.z;
        } else {
          sizes[pIdx] = 0; // Hide inactive
        }
        pIdx++;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={2}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        sizeAttenuation
      />
    </points>
  );
}