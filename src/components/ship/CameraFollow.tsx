/**
 * CameraFollow.tsx
 * Smooth third-person camera controller that tracks the ship's transform.
 * Uses local offset vectors to maintain a consistent viewing angle regardless of ship heading.
 */

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

interface CameraFollowProps {
  target: React.MutableRefObject<THREE.Group | null>;
}

export function CameraFollow({ target }: CameraFollowProps) {
  const { camera } = useThree();
  
  // Pre-allocate vectors to avoid garbage collection during the render loop
  const idealOffset = useRef(new THREE.Vector3(0, 6, -15)).current;
  const idealLookat = useRef(new THREE.Vector3(0, 2, 10)).current;
  const tempVec = useRef(new THREE.Vector3()).current;
  const tempQuat = useRef(new THREE.Quaternion()).current;

  useFrame(() => {
    if (!target.current) return;
    
    const ship = target.current;
    
    // Extract ship's current rotation as a Quaternion
    tempQuat.setFromEuler(ship.rotation);
    
    // 1. Calculate ideal camera position in world space
    tempVec.copy(idealOffset);
    tempVec.applyQuaternion(tempQuat); // Rotate offset relative to ship's heading
    tempVec.add(ship.position);        // Translate to ship's world position
    
    // Smoothly interpolate camera position (Lerp factor 0.05 provides smooth trailing)
    camera.position.lerp(tempVec, 0.05);
    
    // 2. Calculate lookat target (slightly ahead and above the ship)
    tempVec.copy(idealLookat);
    tempVec.applyQuaternion(tempQuat);
    tempVec.add(ship.position);
    
    // Direct the camera at the calculated point
    camera.lookAt(tempVec);
  });

  return null;
}