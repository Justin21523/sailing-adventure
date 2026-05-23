/**
 * EnvironmentController.tsx
 * The master bridge for environmental visuals.
 * It reads the WeatherStore and applies changes to the Scene Graph (Fog, Background)
 * and directly mutates the OceanMesh's shader uniforms without requiring prop-drilling.
 */

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWeatherStore } from '@/stores/weatherStore';
import { DynamicSky } from './DynamicSky';
import { RainSystem } from '../effects/RainSystem';

export function EnvironmentController() {
  const { scene } = useThree();
  
  // Pre-allocate colors to avoid GC in the render loop
  const fogColor = new THREE.Color();
  const bgColor = new THREE.Color();

  useFrame(() => {
    const { condition, timeOfDay, fogDensity } = useWeatherStore.getState();

    // 1. Determine Target Colors based on Time and Weather
    let targetFogHex = '#87CEEB'; // Day Clear
    let targetBgHex = '#87CEEB';

    if (timeOfDay === 'NIGHT') {
      targetFogHex = '#0A192F';
      targetBgHex = '#050C17';
    } else if (timeOfDay === 'DAWN' || timeOfDay === 'DUSK') {
      targetFogHex = '#FF7E5F';
      targetBgHex = '#FEB47B';
    } else if (condition === 'STORM' || condition === 'RAIN') {
      targetFogHex = '#4A5568';
      targetBgHex = '#2D3748';
    } else if (condition === 'FOGGY') {
      targetFogHex = '#CBD5E0';
      targetBgHex = '#A0AEC0';
    }

    // 2. Apply to Scene Fog
    fogColor.set(targetFogHex);
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.lerp(fogColor, 0.05);
      // Smoothly interpolate density
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, fogDensity, 0.05);
    } else {
      scene.fog = new THREE.FogExp2(targetFogHex, fogDensity);
    }

    // 3. Apply to Scene Background (Fallback if Sky is obscured or for deep night)
    bgColor.set(targetBgHex);
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(bgColor, 0.05);
    } else {
      scene.background = bgColor.clone();
    }

    // 4. Mutate OceanMesh Uniforms directly via Scene Graph traversal
    // This avoids passing props down the entire component tree.
    const oceanMesh = scene.getObjectByName('OceanMesh');
    if (oceanMesh && oceanMesh instanceof THREE.Mesh) {
      const mat = oceanMesh.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        const { waveHeight } = useWeatherStore.getState();
        // Smoothly transition wave height
        mat.uniforms.uWaveHeight.value = THREE.MathUtils.lerp(
          mat.uniforms.uWaveHeight.value, 
          waveHeight, 
          0.05
        );
        
        // Darken water during storms/night
        if (timeOfDay === 'NIGHT' || condition === 'STORM') {
          mat.uniforms.uDeepColor.value.lerp(new THREE.Color('#000814'), 0.02);
          mat.uniforms.uShallowColor.value.lerp(new THREE.Color('#001d3d'), 0.02);
        } else {
          mat.uniforms.uDeepColor.value.lerp(new THREE.Color('#001f3f'), 0.02);
          mat.uniforms.uShallowColor.value.lerp(new THREE.Color('#0074D9'), 0.02);
        }
      }
    }
  });

  return (
    <>
      <DynamicSky />
      <RainSystem />
    </>
  );
}