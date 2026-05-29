import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameWorld } from '@/core/engine/GameWorld';
import { projectilePhysics } from '@/core/physics/ProjectilePhysics';
import { useUIStore } from '@/stores/uiStore';
import { useShipStore } from '@/stores/shipStore';
import { crewManager } from '@/core/systems/CrewManager';

const FIRE_COOLDOWN = 1.5; 
const CANNONBALL_SPEED = 60;

export function CannonSystem() {
  const isFiringRef = useRef(false);
  const cooldownRef = useRef(0);
  const flashTimerRef = useRef(0); // FIX: Timer to keep flash visible
  
  const flashLeftRef = useRef<THREE.Mesh>(null);
  const flashRightRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent | KeyboardEvent) => {
      if (useUIStore.getState().isPaused || useUIStore.getState().isDocked) return;
      if (e instanceof MouseEvent && e.button === 0) isFiringRef.current = true;
      if (e instanceof KeyboardEvent && e.code === 'KeyF') isFiringRef.current = true;
    };
    const handleUp = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof MouseEvent && e.button === 0) isFiringRef.current = false;
      if (e instanceof KeyboardEvent && e.code === 'KeyF') isFiringRef.current = false;
    };

    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  const fireVolley = () => {
    const physics = gameWorld.shipPhysics;
    const shipPos = physics.position;
    const heading = physics.heading;
    
    const fwdX = Math.sin(heading);
    const fwdZ = Math.cos(heading);
    const rightX = Math.cos(heading);
    const rightZ = -Math.sin(heading);
    const aimY = 0.25; 

    // Offset spawn slightly forward to prevent self-collision
    const spawnOffsetFwd = 2.0; 
    
    const leftX = shipPos.x - rightX * 1.5 + fwdX * spawnOffsetFwd;
    const leftZ = shipPos.z - rightZ * 1.5 + fwdZ * spawnOffsetFwd;
    projectilePhysics.spawn(leftX, shipPos.y + 1.5, leftZ, fwdX, aimY, fwdZ, CANNONBALL_SPEED, 'player');
    
    const rightPosX = shipPos.x + rightX * 1.5 + fwdX * spawnOffsetFwd;
    const rightPosZ = shipPos.z + rightZ * 1.5 + fwdZ * spawnOffsetFwd;
    projectilePhysics.spawn(rightPosX, shipPos.y + 1.5, rightPosZ, fwdX, aimY, fwdZ, CANNONBALL_SPEED, 'player');

    // Trigger Muzzle Flash
    if (flashLeftRef.current) {
      flashLeftRef.current.position.set(-1.5, 1.2, spawnOffsetFwd);
      flashLeftRef.current.visible = true;
    }
    if (flashRightRef.current) {
      flashRightRef.current.position.set(1.5, 1.2, spawnOffsetFwd);
      flashRightRef.current.visible = true;
    }
  };

  useFrame((_, delta) => {
    cooldownRef.current -= delta;
    flashTimerRef.current -= delta;
    
    // FIX: Hide flashes only after timer expires
    if (flashTimerRef.current <= 0) {
      if (flashLeftRef.current) flashLeftRef.current.visible = false;
      if (flashRightRef.current) flashRightRef.current.visible = false;
    }
    const mods = crewManager.getModifiers();
    const currentCooldown = FIRE_COOLDOWN * mods.reloadMult;

    // Sync to store for HUD (throttled slightly for performance if needed, but here simple is fine)
    useShipStore.getState().setCannonCooldown(Math.max(0, cooldownRef.current), currentCooldown);

    if (isFiringRef.current && cooldownRef.current <= 0) {
      cooldownRef.current = currentCooldown;
      flashTimerRef.current = 0.1; // Keep flash visible for 100ms
      fireVolley(); // FIX: Removed 'this.'
    }
  });

  return (
    <group>
      <mesh position={[-1.2, 1.0, 1]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[-1.2, 1.0, -1]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[1.2, 1.0, 1]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[1.2, 1.0, -1]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
      </mesh>

      <mesh ref={flashLeftRef} visible={false}>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshBasicMaterial color="#FFAA00" transparent opacity={0.8} />
      </mesh>
      <mesh ref={flashRightRef} visible={false}>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshBasicMaterial color="#FFAA00" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}