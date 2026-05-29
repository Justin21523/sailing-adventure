/**
 * CameraFollow.tsx
 * Smooth third-person camera that trails the ship.
 *
 * Mouse control: hold the RIGHT mouse button and drag to orbit the view around
 * the ship (left mouse stays reserved for firing cannons). The orbit is applied
 * as an offset on top of the "directly behind the ship" framing, so the camera
 * keeps following the ship while still honouring your manual angle. Scroll-free.
 */

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useEffect } from 'react';

interface CameraFollowProps {
  target: React.MutableRefObject<THREE.Group | null>;
}

const BASE_DISTANCE = 16;     // how far the camera trails the ship
const MIN_POLAR = 0.12;       // lowest (near-horizontal) view angle
const MAX_POLAR = 1.25;       // highest (top-down-ish) view angle
const DEFAULT_POLAR = 0.4;    // resting elevation
const LOOK_SENSITIVITY = 0.005;

export function CameraFollow({ target }: CameraFollowProps) {
  const { camera, gl } = useThree();

  // Manual orbit offsets driven by the mouse. yaw is relative to the ship's
  // heading; polar is the elevation angle measured from the horizon.
  const yaw = useRef(0);
  const polar = useRef(DEFAULT_POLAR);
  const dragging = useRef(false);

  // Pre-allocated to avoid per-frame garbage collection.
  const desiredPos = useRef(new THREE.Vector3()).current;
  const lookTarget = useRef(new THREE.Vector3()).current;

  useEffect(() => {
    const el = gl.domElement;

    const onPointerDown = (e: MouseEvent) => {
      if (e.button === 2) dragging.current = true; // right mouse button
    };
    const onPointerUp = (e: MouseEvent) => {
      if (e.button === 2) dragging.current = false;
    };
    const onPointerMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      yaw.current -= e.movementX * LOOK_SENSITIVITY;
      polar.current = THREE.MathUtils.clamp(
        polar.current + e.movementY * LOOK_SENSITIVITY,
        MIN_POLAR,
        MAX_POLAR
      );
    };
    // Suppress the browser context menu so right-drag feels clean.
    const onContextMenu = (e: Event) => e.preventDefault();

    el.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('mousemove', onPointerMove);
    el.addEventListener('contextmenu', onContextMenu);

    return () => {
      el.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('mousemove', onPointerMove);
      el.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!target.current) return;
    const ship = target.current;

    // Azimuth = directly behind the ship (heading + PI) plus the manual yaw.
    const azimuth = ship.rotation.y + Math.PI + yaw.current;
    const horiz = Math.cos(polar.current) * BASE_DISTANCE;

    desiredPos.set(
      ship.position.x + Math.sin(azimuth) * horiz,
      ship.position.y + Math.sin(polar.current) * BASE_DISTANCE + 2,
      ship.position.z + Math.cos(azimuth) * horiz
    );

    // Smooth trailing; frame-rate independent.
    camera.position.lerp(desiredPos, 1 - Math.exp(-delta * 4));

    lookTarget.set(ship.position.x, ship.position.y + 2.5, ship.position.z);
    camera.lookAt(lookTarget);
  });

  return null;
}
