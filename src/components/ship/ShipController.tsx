/**
 * ShipController.tsx
 * Integrates player input, Wind Dynamics, and Buoyancy to drive the ShipPhysics engine.
 * W/S = direct throttle (forward/backward). Wind provides a passive speed bonus.
 * A/D = rudder (turn left/right).
 */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameWorld } from '@/core/engine/GameWorld';
import { inputManager } from '@/core/engine/InputManager';
import { useUpgradeStore } from '@/stores/upgradeStore';
import { useUIStore } from '@/stores/uiStore';

interface ShipControllerProps {
  children: React.ReactNode;
}

export const ShipController = forwardRef<THREE.Group, ShipControllerProps>(({ children }, ref) => {
  const groupRef = useRef<THREE.Group>(null);

  const physics = gameWorld.shipPhysics;
  const buoyancy = gameWorld.buoyancySystem;
  const wind = gameWorld.windDynamics;

  useImperativeHandle(ref, () => groupRef.current!);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const safeDelta = Math.min(delta, 0.1);

    const isShopOpen = useUpgradeStore.getState().isShopOpen;
    const isPaused = useUIStore.getState().isPaused;
    const isDocked = useUIStore.getState().isDocked;
    const isGameOver = useUIStore.getState().showGameOver;
    const isInputLocked = isShopOpen || isPaused || isGameOver;

    if (isInputLocked) {
      physics.throttle = 0;
      physics.rudder = 0;
    } else if (isDocked) {
      physics.throttle = 0;
      physics.rudder = 0;
      physics.speed *= 0.95;
    } else {
      // A/D = steer
      physics.rudder = inputManager.getRudder();

      // W/S = direct throttle: W = forward (+1), S = backward (-1)
      const directThrottle = inputManager.getThrottle();

      // Wind passive bonus: sailing with the wind adds up to ~25% extra thrust
      const windState = wind.getWindState(time);
      const shipForwardX = Math.sin(physics.heading);
      const shipForwardZ = Math.cos(physics.heading);
      const windDotForward =
        windState.direction.x * shipForwardX + windState.direction.z * shipForwardZ;
      const windBonus = Math.max(0, windDotForward) * (windState.speed / 32.0);

      // Apply wind bonus only when accelerating forward
      physics.throttle = THREE.MathUtils.clamp(
        directThrottle + (directThrottle > 0 ? windBonus : 0),
        -1,
        1
      );
    }

    // Physics & Buoyancy step (always runs to keep ship afloat)
    physics.update(safeDelta);
    const buoy = buoyancy.calculate(physics.position, physics.heading, time);

    // Apply to 3D Mesh
    if (groupRef.current) {
      groupRef.current.position.x = physics.position.x;
      groupRef.current.position.z = physics.position.z;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        buoy.targetY,
        0.1
      );

      groupRef.current.rotation.y = physics.rotation.y;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        buoy.targetPitch,
        0.1
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        buoy.targetRoll + physics.throttle * 0.05,
        0.1
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
});

ShipController.displayName = 'ShipController';
