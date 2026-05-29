/**
 * ShipController.tsx
 * React Three Fiber component that bridges the pure TS ShipPhysics engine 
 * with the 3D scene graph and handles player input.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ShipPhysics } from '@/core/physics/ShipPhysics';
import { crewManager } from '@/core/systems/CrewManager';
import { fishingSystem } from '@/core/systems/FishingSystem';

interface ShipControllerProps {
  children: React.ReactNode;
}

export const ShipController = forwardRef<THREE.Group, ShipControllerProps>(({ children }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const physicsRef = useRef(new ShipPhysics());
  
  // Use refs for input state to prevent React re-renders on every keystroke
  const inputRef = useRef({ 
    forward: false, 
    backward: false, 
    left: false, 
    right: false 
  });
  
  // Expose the inner group ref to the parent (App.tsx) for CameraFollow
  useImperativeHandle(ref, () => groupRef.current!);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputRef.current.right = true;
          break;
        case 'KeyR':
          fishingSystem.cast();
          break;
        case 'Space':
          fishingSystem.reel();
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputRef.current.right = false;
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const physics = physicsRef.current;
    const input = inputRef.current;
    
    // 1. Map binary keyboard inputs to analog physics parameters (-1 to 1)
    let throttle = 0;
    if (input.forward) throttle += 1.0;
    if (input.backward) throttle -= 0.6; // Reverse is typically slower
    
    let rudder = 0;
    if (input.left) rudder += 1.0;
    if (input.right) rudder -= 1.0;
    
    physics.throttle = throttle;
    physics.rudder = rudder;
    // Apply Crew Modifiers
    const mods = crewManager.getModifiers();
    physics.throttle *= mods.speedMult;
    
    // 2. Step the physics simulation
    // Clamp delta to prevent physics explosions on lag spikes
    const safeDelta = Math.min(delta, 0.1);
    physics.update(safeDelta);
    
    // 3. Apply physics state to the 3D Mesh
    if (groupRef.current) {
      groupRef.current.position.set(
        physics.position.x, 
        physics.position.y, 
        physics.position.z
      );
      
      // Update rotation using Euler angles
      groupRef.current.rotation.set(
        physics.rotation.x, 
        physics.rotation.y, 
        physics.rotation.z
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
});

ShipController.displayName = 'ShipController';