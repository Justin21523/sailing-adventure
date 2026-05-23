/**
 * ShipDamageVFX.tsx
 * Particle system that emits smoke and sparks from the ship's hull when damaged.
 * Reads HP from the ShipStore and scales emission rate based on damage severity.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '@/stores/shipStore';
import { gameWorld } from '@/core/engine/GameWorld';
import { createSoftCircleTexture } from '@/utils/proceduralTextures';

const MAX_PARTICLES = 150;

interface Particle {
  alive: boolean;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
  type: 'smoke' | 'spark';
}

export function ShipDamageVFX() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: MAX_PARTICLES }, () => ({
      alive: false,
      life: 0,
      maxLife: 2.0,
      velocity: new THREE.Vector3(),
      type: 'smoke'
    }));
  }, []);

  const { positions, colors, sizes, geometry } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return { positions, colors, sizes, geometry };
  }, []);

  const texture = useMemo(() => createSoftCircleTexture(64), []);
  const emitTimer = useRef(0);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const hp = useShipStore.getState().hullHealth;
    const maxHp = useShipStore.getState().maxHullHealth;
    const hpRatio = hp / maxHp;
    
    const isDamaged = hpRatio < 0.6;
    const isCritical = hpRatio < 0.25;

    emitTimer.current += delta;
    const emitInterval = isCritical ? 0.05 : 0.15;

    // Emit new particles if damaged
    if (isDamaged && emitTimer.current >= emitInterval) {
      emitTimer.current = 0;
      
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (!particles[i].alive) {
          const p = particles[i];
          p.alive = true;
          p.life = 1.5 + Math.random() * 1.0;
          p.maxLife = p.life;
          p.type = isCritical && Math.random() > 0.5 ? 'spark' : 'smoke';

          const shipPos = gameWorld.shipPhysics.position;
          const heading = gameWorld.shipPhysics.heading;
          
          // Randomize spawn point along the hull
          const offsetX = (Math.random() - 0.5) * 2;
          const offsetZ = -2 + Math.random() * 4; 
          
          const cosH = Math.cos(heading);
          const sinH = Math.sin(heading);
          
          positions[i * 3] = shipPos.x + (offsetX * cosH - offsetZ * sinH);
          positions[i * 3 + 1] = shipPos.y + 1.0 + Math.random() * 0.5;
          positions[i * 3 + 2] = shipPos.z + (offsetX * sinH + offsetZ * cosH);

          if (p.type === 'smoke') {
            p.velocity.set((Math.random() - 0.5) * 0.5, 1.5 + Math.random(), (Math.random() - 0.5) * 0.5);
          } else {
            p.velocity.set((Math.random() - 0.5) * 3, 3 + Math.random() * 2, (Math.random() - 0.5) * 3);
          }
          break;
        }
      }
    }

    // Update existing particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (p.alive) {
        p.life -= delta;
        if (p.life <= 0) {
          p.alive = false;
          sizes[i] = 0;
        } else {
          positions[i * 3] += p.velocity.x * delta;
          positions[i * 3 + 1] += p.velocity.y * delta;
          positions[i * 3 + 2] += p.velocity.z * delta;

          if (p.type === 'smoke') {
            p.velocity.y *= 0.98; 
            const lifeRatio = p.life / p.maxLife;
            sizes[i] = (1.0 - lifeRatio) * 3.0 + 1.0;
            colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.2; // Dark gray
          } else {
            p.velocity.y -= 9.8 * delta; // Gravity for sparks
            sizes[i] = 0.5;
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.1; // Orange/Yellow
          }
        }
      } else {
        sizes[i] = 0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={1.5}
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending} // Normal blending works best for dark smoke against bright sky
        vertexColors
        sizeAttenuation
      />
    </points>
  );
}