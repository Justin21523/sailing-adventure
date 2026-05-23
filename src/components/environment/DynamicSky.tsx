/**
 * DynamicSky.tsx
 * Procedural sky dome that reacts to the WeatherStore.
 * Adjusts sun position, atmospheric scattering, and cloud coverage dynamically.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useWeatherStore } from '@/stores/weatherStore';

export function DynamicSky() {
  const skyRef = useRef<any>(null); // Drei's Sky component doesn't expose strict types easily

  useFrame(() => {
    if (!skyRef.current) return;

    const { sunElevation, sunAzimuth, condition } = useWeatherStore.getState();

    // Convert spherical coordinates to Cartesian for the Sky shader
    const phi = THREE.MathUtils.degToRad(90 - sunElevation);
    const theta = THREE.MathUtils.degToRad(sunAzimuth);
    
    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(1, phi, theta);

    // Update Sky uniforms directly to avoid React re-renders
    const uniforms = skyRef.current.material.uniforms;
    if (uniforms && uniforms.sunPosition) {
      uniforms.sunPosition.value.copy(sunPosition);
      
      // Adjust atmospheric scattering based on weather
      if (condition === 'STORM' || condition === 'RAIN') {
        uniforms.turbidity.value = 10;
        uniforms.rayleigh.value = 3;
        uniforms.mieCoefficient.value = 0.05;
        uniforms.mieDirectionalG.value = 0.9;
      } else if (condition === 'FOGGY' || condition === 'CLOUDY') {
        uniforms.turbidity.value = 8;
        uniforms.rayleigh.value = 2;
        uniforms.mieCoefficient.value = 0.02;
        uniforms.mieDirectionalG.value = 0.8;
      } else {
        uniforms.turbidity.value = 4;
        uniforms.rayleigh.value = 1.5;
        uniforms.mieCoefficient.value = 0.005;
        uniforms.mieDirectionalG.value = 0.8;
      }
    }
  });

  return <Sky ref={skyRef} distance={450000} />;
}