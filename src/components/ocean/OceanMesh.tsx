/**
 * OceanMesh.tsx
 * Procedural ocean surface using custom GLSL shaders.
 * Implements vertex displacement for waves and fragment shading for depth-based coloring and specular highlights.
 * Fully self-contained with no external texture dependencies to ensure immediate execution.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Vertex Shader: Displaces the plane geometry to simulate waves
const oceanVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWaveHeight;
  
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Superposition of 3 sine waves with different frequencies, amplitudes, and directions
    float wave1 = sin(pos.x * 0.05 + uTime * 0.8) * 1.5;
    float wave2 = sin(pos.z * 0.08 + uTime * 1.2) * 1.0;
    float wave3 = sin((pos.x + pos.z) * 0.03 + uTime * 0.5) * 2.5;
    
    // Apply displacement to Y axis
    pos.y += (wave1 + wave2 + wave3) * uWaveHeight;
    vElevation = pos.y;
    
    // Pass world position to fragment shader for lighting calculations
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment Shader: Calculates water color, depth mixing, and sun reflection
const oceanFragmentShader = /* glsl */ `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSunDirection;
  uniform float uTime;
  
  varying vec3 vWorldPosition;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    // Mix deep and shallow colors based on wave elevation
    float mixFactor = smoothstep(-2.0, 2.0, vElevation);
    vec3 baseColor = mix(uDeepColor, uShallowColor, mixFactor);
    
    // Calculate view direction for specular highlights
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    
    // Approximate normal using screen-space derivatives (dFdx, dFdy)
    // This avoids complex analytical normal calculations in the vertex shader
    vec3 normal = normalize(vec3(
      dFdx(vElevation) * 2.0, 
      1.0, 
      dFdy(vElevation) * 2.0
    ));
    
    // Blinn-Phong specular reflection
    vec3 halfDir = normalize(uSunDirection + viewDirection);
    float specAngle = max(dot(normal, halfDir), 0.0);
    float spec = pow(specAngle, 128.0); // High exponent for sharp water highlights
    
    // Add sun reflection (warm yellowish white)
    vec3 specColor = vec3(1.0, 0.95, 0.8) * spec * 1.5;
    
    vec3 finalColor = baseColor + specColor;
    
    // Output with slight transparency for depth illusion
    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

export function OceanMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Initialize shader uniforms and geometry only once
  const { uniforms, geometry } = useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uWaveHeight: { value: 0.6 },
      uDeepColor: { value: new THREE.Color('#001f3f') },
      uShallowColor: { value: new THREE.Color('#0074D9') },
      uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
    };

    // High subdivision for smooth waves. 
    // 2000x2000 units with 128x128 segments balances visual quality and performance.
    const geometry = new THREE.PlaneGeometry(2000, 2000, 128, 128);
    geometry.rotateX(-Math.PI / 2); // Lay flat on the XZ plane

    return { uniforms, geometry };
  }, []);

  // Update time uniform every frame for wave animation
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} name="OceanMesh" geometry={geometry} receiveShadow>
      <shaderMaterial
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}