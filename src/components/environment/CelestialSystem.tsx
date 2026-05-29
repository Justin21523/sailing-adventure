import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWeatherStore } from '@/stores/weatherStore';

export function CelestialSystem() {
  const { scene } = useThree();
  const sunRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const starsRef = useRef<THREE.Points>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  // Generate Starfield Geometry
  const starGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Random point on a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2000; // Far away
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Slight color variation (white/blue/yellow)
      const c = 0.8 + Math.random() * 0.2;
      colors[i * 3] = c;
      colors[i * 3 + 1] = c;
      colors[i * 3 + 2] = c + (Math.random() * 0.1);
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame(() => {
    const { sunElevation, sunAzimuth } = useWeatherStore.getState();
    
    // 1. Calculate Sun Position
    const phi = THREE.MathUtils.degToRad(90 - sunElevation);
    const theta = THREE.MathUtils.degToRad(sunAzimuth);
    const sunPos = new THREE.Vector3().setFromSphericalCoords(1000, phi, theta);

    if (sunRef.current) {
      sunRef.current.position.copy(sunPos);
    }

    // 2. Update Sun Light (Shadow caster)
    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunPos);
      sunLightRef.current.target.position.set(0, 0, 0);
      sunLightRef.current.target.updateMatrixWorld();

      // Adjust light intensity and color based on elevation
      const normElev = Math.max(0, sunElevation / 90); // 0 to 1
      sunLightRef.current.intensity = normElev * 1.8;
      
      if (sunElevation < 10) {
        // Sunset/Sunrise (Orange/Red)
        sunLightRef.current.color.set('#FF7E5F');
      } else {
        // Day (Warm White)
        sunLightRef.current.color.set('#FFF8DC');
      }
    }

    // 3. Calculate Moon Position (Opposite to Sun + offset)
    const moonPos = sunPos.clone().negate();
    moonPos.y += 200; // Keep it slightly higher
    if (moonRef.current) {
      moonRef.current.position.copy(moonPos);
    }

    // 4. Fade Stars based on Sun Elevation
    if (starsRef.current) {
      // Stars visible when sun is below horizon (elevation < 0)
      // Fade in from 0 to -15 degrees
      const starOpacity = THREE.MathUtils.clamp(-sunElevation / 15, 0, 1);
      (starsRef.current.material as THREE.PointsMaterial).opacity = starOpacity;
      starsRef.current.visible = starOpacity > 0.01;
      
      // Rotate stars slowly
      starsRef.current.rotation.y += 0.00005;
    }
  });

  return (
    <>
      {/* Sun Visual */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[40, 16, 16]} />
        <meshBasicMaterial color="#FFFFAA" />
      </mesh>

      {/* Moon Visual */}
      <mesh ref={moonRef}>
        <sphereGeometry args={[25, 16, 16]} />
        <meshBasicMaterial color="#E6E6FA" />
      </mesh>

      {/* Starfield */}
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial 
          size={3} 
          vertexColors 
          transparent 
          opacity={0} 
          sizeAttenuation={false} 
          depthWrite={false}
        />
      </points>

      {/* Main Sun Light (Replaces the static one in App.tsx) */}
      <directionalLight
        ref={sunLightRef}
        castShadow
        intensity={1.8}
        color="#FFF8DC"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0005}
      />
    </>
  );
}