/**
 * CameraShake.tsx
 * Applies procedural noise to the camera position to simulate impacts and heavy waves.
 * Exports a global state object so pure TS systems (like CollisionSystem) can trigger it.
 */

import { useFrame, useThree } from '@react-three/fiber';

/**
 * Global state for camera shake. 
 * Allows non-React modules to trigger shakes without prop-drilling or context.
 */
export const cameraShakeState = {
  intensity: 0,
  decay: 0.9, 
  trigger: (amount: number, duration: number = 0.5) => {
    cameraShakeState.intensity = Math.max(cameraShakeState.intensity, amount);
    // Calculate decay rate to reach ~0 at the end of the duration
    cameraShakeState.decay = 1.0 - Math.pow(0.01, 1.0 / (duration * 60)); 
  }
};

export function CameraShake() {
  const { camera } = useThree();
  let isShaking = false;

  // Priority 1 ensures this runs AFTER CameraFollow (Priority 0) has set the base position
  useFrame((_, delta) => {
    if (cameraShakeState.intensity > 0.01) {
      isShaking = true;

      // Apply random 3D offset
      const shakeX = (Math.random() - 0.5) * cameraShakeState.intensity;
      const shakeY = (Math.random() - 0.5) * cameraShakeState.intensity;
      const shakeZ = (Math.random() - 0.5) * cameraShakeState.intensity;

      camera.position.x += shakeX;
      camera.position.y += shakeY;
      camera.position.z += shakeZ;

      // Decay the intensity over time
      cameraShakeState.intensity *= Math.pow(1.0 - cameraShakeState.decay, delta * 60);
    } else if (isShaking) {
      // Shake ended, reset state
      cameraShakeState.intensity = 0;
      isShaking = false;
    }
  }, 1); 

  return null;
}