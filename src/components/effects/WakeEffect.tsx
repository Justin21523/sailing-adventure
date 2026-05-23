/**
 * WakeEffect.tsx
 * Particle system for ship bow splashes and stern wake.
 * Must be placed at scene root (not inside ship group) so world-space
 * particle coordinates are applied correctly without double-offset.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameWorld } from '@/core/engine/GameWorld';
import { getOceanHeight } from '@/core/physics/BuoyancySystem';
import { createSoftCircleTexture } from '@/utils/proceduralTextures';

const MAX_PARTICLES = 600;
const PARTICLE_LIFETIME = 2.8;

interface Particle {
  alive: boolean;
  life: number;
  maxLife: number;
  velocity: THREE.Vector3;
}

export function WakeEffect() {
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: MAX_PARTICLES }, () => ({
      alive: false,
      life: 0,
      maxLife: PARTICLE_LIFETIME,
      velocity: new THREE.Vector3(),
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

  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const shipForward = useMemo(() => new THREE.Vector3(), []);
  const shipRight = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const physics = gameWorld.shipPhysics;
    const speed = Math.abs(physics.speed);
    const pos = physics.position;
    const heading = physics.heading;
    const time = state.clock.elapsedTime;

    shipForward.set(Math.sin(heading), 0, Math.cos(heading));
    shipRight.set(Math.cos(heading), 0, -Math.sin(heading));

    // Emit at lower threshold so players see feedback sooner
    const MIN_SPEED = 0.3;
    const isFast = speed > 6.0; // High-speed splash mode

    const emitRate = speed > MIN_SPEED
      ? Math.min(speed * 3.5 + (isFast ? 15 : 0), 40)
      : 0;
    const emitCount = Math.floor(emitRate * delta * 60);

    let emitted = 0;
    if (speed > MIN_SPEED) {
      for (let i = 0; i < MAX_PARTICLES && emitted < emitCount; i++) {
        if (!particles[i].alive) {
          const p = particles[i];
          p.alive = true;
          p.life = PARTICLE_LIFETIME * (0.7 + Math.random() * 0.3);
          p.maxLife = p.life;

          const isBow = Math.random() > 0.35;
          const offsetZ = isBow ? 3.5 : -3.5;
          const spreadX = isBow ? 2.5 : 1.5;
          const offsetX = (Math.random() - 0.5) * spreadX;

          tempVec.copy(shipForward).multiplyScalar(offsetZ);
          tempVec.addScaledVector(shipRight, offsetX);

          // World-space spawn position (WakeEffect is at scene root)
          const spawnX = pos.x + tempVec.x;
          const spawnZ = pos.z + tempVec.z;
          // Spawn above the actual ocean surface (waves can reach +1.8)
          const surfaceY = getOceanHeight(spawnX, spawnZ, time) + 0.4;
          positions[i * 3] = spawnX;
          positions[i * 3 + 1] = surfaceY;
          positions[i * 3 + 2] = spawnZ;

          // Velocity: outward + upward burst, bigger at high speed
          const upward = isFast ? Math.random() * 3.0 + 1.0 : Math.random() * 1.5 + 0.4;
          const spread = isBow ? (isFast ? 4.0 : 2.5) : 0.8;
          p.velocity.set(
            (Math.random() - 0.5) * spread + physics.velocity.x * 0.15,
            upward,
            (Math.random() - 0.5) * spread + physics.velocity.z * 0.15
          );

          emitted++;
        }
      }
    }

    // Update all particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (p.alive) {
        p.life -= delta;
        if (p.life <= 0) {
          p.alive = false;
          sizes[i] = 0;
        } else {
          p.velocity.y -= 5.0 * delta; // Gravity
          positions[i * 3] += p.velocity.x * delta;
          positions[i * 3 + 1] += p.velocity.y * delta;
          positions[i * 3 + 2] += p.velocity.z * delta;

          // Clamp to actual wave surface
          const waveY = getOceanHeight(positions[i * 3], positions[i * 3 + 2], time) + 0.1;
          if (positions[i * 3 + 1] < waveY) {
            positions[i * 3 + 1] = waveY;
            p.velocity.y = 0;
            p.velocity.x *= 0.88;
            p.velocity.z *= 0.88;
          }

          const lifeRatio = p.life / p.maxLife;
          sizes[i] = lifeRatio > 0.5
            ? THREE.MathUtils.lerp(3.0, 0.8, 1 - (lifeRatio - 0.5) * 2)
            : THREE.MathUtils.lerp(0.2, 3.0, lifeRatio * 2);

          // White spray → light blue wake fade
          const whiteness = Math.min(1, lifeRatio * 1.6);
          colors[i * 3] = 0.82 + whiteness * 0.18;
          colors[i * 3 + 1] = 0.92 + whiteness * 0.08;
          colors[i * 3 + 2] = 1.0;
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
        size={2.2}
        map={texture}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        sizeAttenuation
      />
    </points>
  );
}
