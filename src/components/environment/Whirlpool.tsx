/**
 * Whirlpool.tsx
 * Renders a dynamic shader-based whirlpool that pulls the ship in.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { anomalyManager } from '@/core/systems/AnomalyManager';

export function WhirlpoolRenderer() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(50, 50, 32, 32);
    geo.rotateX(-Math.PI / 2);
    
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#001122') }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float dist = length(pos.xz);
          pos.y = -dist * 0.2 + sin(dist * 0.5 - uTime * 3.0) * 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);
          float spiral = sin(angle * 4.0 + dist * 20.0 - uTime * 5.0);
          float alpha = smoothstep(0.5, 0.1, dist) * (0.5 + spiral * 0.5);
          gl_FragColor = vec4(uColor, alpha * 0.8);
        }
      `
    });
    
    return { geometry: geo, material: mat };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    
    const whirlpools = anomalyManager.activeAnomalies.filter(a => a.type === 'WHIRLPOOL');
    if (whirlpools.length > 0) {
      const w = whirlpools[0]; 
      meshRef.current.position.set(w.x, 0.1, w.z);
      meshRef.current.visible = true;
      meshRef.current.scale.setScalar(w.radius / 25);
    } else {
      meshRef.current.visible = false;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}