import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { salvageSystem, type Wreckage as WreckageData } from '@/core/systems/SalvageSystem';
import { getOceanHeight } from '@/core/physics/BuoyancySystem';

function WreckageMesh({ data }: { data: WreckageData }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const y = getOceanHeight(data.x, data.z, t, 0.6) + 0.2;
    ref.current.position.set(data.x, y, data.z);
    ref.current.rotation.y = t * 0.2;
    ref.current.rotation.z = Math.sin(t + data.x) * 0.1;
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[3, 0.5, 4]} />
        <meshStandardMaterial color="#2D1A11" roughness={0.9} />
      </mesh>
      <mesh position={[1, 0.5, -1]} rotation={[0.2, 0.5, 0.1]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 3, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Glowing beacon to help player spot it */}
      <pointLight position={[0, 2, 0]} color="#FFD700" intensity={2} distance={15} />
    </group>
  );
}

export function WreckageRenderer() {
  const [items, setItems] = useState<WreckageData[]>([]);
  const lastCount = useRef(0);

  useFrame(() => {
    if (salvageSystem.wreckage.length !== lastCount.current) {
      lastCount.current = salvageSystem.wreckage.length;
      setItems([...salvageSystem.wreckage]);
    }
  });

  return (
    <>
      {items.map(w => <WreckageMesh key={w.id} data={w} />)}
    </>
  );
}