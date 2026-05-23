/**
 * proceduralTextures.ts
 * Generates textures dynamically using Canvas 2D API.
 * Eliminates the need for external image assets (PNG/JPG) for simple particles and UI elements,
 * ensuring zero network latency for core visual effects.
 */

import * as THREE from 'three';

/**
 * Creates a soft, radial gradient circle texture for particles (e.g., water splashes, fog).
 */
export function createSoftCircleTexture(size: number = 64): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}