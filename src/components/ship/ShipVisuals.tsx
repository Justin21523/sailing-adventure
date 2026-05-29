/**
 * ShipVisuals.tsx
 * Replaces the static ShipPlaceholder. 
 * Dynamically renders hull armor, extra masts, and custom sail colors based on upgrade levels.
 */

import * as THREE from 'three';
import { useUpgradeStore } from '@/stores/upgradeStore';
import { useShipCustomizationStore } from '@/stores/shipCustomizationStore';

export function ShipVisuals() {
  const levels = useUpgradeStore((s) => s.levels);
  const sailColor = useShipCustomizationStore((s) => s.sailColor);

  const hullTier = levels.hull >= 3 ? 'IRONCLAD' : levels.hull >= 1 ? 'REINFORCED' : 'WOOD';
  const sailTier = levels.sails >= 3 ? 'TRIPLE' : levels.sails >= 1 ? 'DOUBLE' : 'SINGLE';

  return (
    <group>
      {/* HULL */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.5, 1.2, 7]} />
        <meshStandardMaterial color="#5C3A21" roughness={0.8} />
      </mesh>
      
      {/* Hull Upgrades */}
      {hullTier === 'REINFORCED' && (
        <mesh castShadow position={[0, 0.2, 3.5]}>
          <coneGeometry args={[1.2, 2, 4]} />
          <meshStandardMaterial color="#718096" metalness={0.6} roughness={0.4} />
        </mesh>
      )}
      {hullTier === 'IRONCLAD' && (
        <>
          <mesh castShadow position={[0, 0.2, 3.5]}>
            <coneGeometry args={[1.0, 3, 8]} />
            <meshStandardMaterial color="#2D3748" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh castShadow position={[1.26, 0, 0]}>
            <boxGeometry args={[0.1, 1.0, 6]} />
            <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh castShadow position={[-1.26, 0, 0]}>
            <boxGeometry args={[0.1, 1.0, 6]} />
            <meshStandardMaterial color="#4A5568" metalness={0.8} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* DECK */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[2.3, 0.2, 6.8]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.6} />
      </mesh>

      {/* MAIN MAST */}
      <mesh castShadow position={[0, 4, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 7, 8]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      
      {/* MAIN SAIL */}
      <mesh castShadow position={[0, 4.5, 0.2]}>
        <planeGeometry args={[4, 5]} />
        <meshStandardMaterial color={sailColor} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>

      {/* SAIL UPGRADES */}
      {sailTier !== 'SINGLE' && (
        <>
          <mesh castShadow position={[0, 2.5, 2.5]}>
            <cylinderGeometry args={[0.08, 0.12, 4, 8]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          <mesh castShadow position={[0, 3, 2.7]}>
            <planeGeometry args={[2.5, 3]} />
            <meshStandardMaterial color={sailColor} side={THREE.DoubleSide} roughness={0.9} />
          </mesh>
        </>
      )}
      
      {sailTier === 'TRIPLE' && (
        <>
          <mesh castShadow position={[0, 6.5, -2]}>
            <cylinderGeometry args={[0.06, 0.1, 3, 8]} />
            <meshStandardMaterial color="#3E2723" />
          </mesh>
          <mesh castShadow position={[0, 6, -1.8]}>
            <planeGeometry args={[2, 2.5]} />
            <meshStandardMaterial color={sailColor} side={THREE.DoubleSide} roughness={0.9} />
          </mesh>
        </>
      )}
    </group>
  );
}