/**
 * IslandLandingScene.tsx
 * Full 3D on-foot island mode shown after docking.
 * Replaces the sailing scene with a large explorable island, shore water, docked ship,
 * procedural foliage, ground wildlife, landmarks, and a controllable player avatar.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { inputManager } from '@/core/engine/InputManager';
import { audioManager } from '@/core/audio/AudioManager';
import { notificationSystem } from '@/core/systems/NotificationSystem';
import { useGameStore } from '@/stores/gameStore';
import { useQuestStore } from '@/stores/questStore';
import { useUIStore } from '@/stores/uiStore';
import type { IslandData, IslandBiome } from '@/core/systems/ChunkManager';
import type { LandingPrompt } from '@/types';

interface IslandLandingSceneProps {
  island: IslandData | undefined;
  onPromptChange: (prompt: LandingPrompt | null) => void;
}

type LandingObjective = {
  id: string;
  title: string;
  description: string;
  icon: 'beacon' | 'artifact' | 'survey' | 'wreckage' | 'vent' | 'timber';
  position: THREE.Vector3;
  resource: 'wood' | 'gold' | 'cloth';
  amount: number;
  questId?: string;
  exploreProgress?: boolean;
};

type TreeSpec = {
  position: [number, number, number];
  scale: number;
  rotation: number;
  palm: boolean;
  dead: boolean;
};

type RockSpec = {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
};

const SHIP_POSITION = new THREE.Vector3(0, 0, -86);
const RETURN_RADIUS = 8;
const OBJECTIVE_RADIUS = 7;
const ISLAND_CENTER_Z = 14;
const ISLAND_RADIUS_X = 122;
const ISLAND_RADIUS_Z = 116;

const biomeTheme: Record<IslandBiome, {
  ground: string;
  grass: string;
  shore: string;
  foliage: string;
  trunk: string;
  rock: string;
  sky: string;
  animal: string;
}> = {
  FOREST: {
    ground: '#356A3B',
    grass: '#4F8A45',
    shore: '#D9BF7A',
    foliage: '#1F6F3A',
    trunk: '#5A3720',
    rock: '#8A8F7A',
    sky: '#9FD7FF',
    animal: '#D8D2B8',
  },
  VOLCANIC: {
    ground: '#2A2926',
    grass: '#4A3B2B',
    shore: '#5E5148',
    foliage: '#32342F',
    trunk: '#211B18',
    rock: '#1C1C1C',
    sky: '#BFC8D4',
    animal: '#C9C1A8',
  },
  RUINS: {
    ground: '#5B6042',
    grass: '#6D7A4A',
    shore: '#C8B177',
    foliage: '#2D6B4A',
    trunk: '#4B3325',
    rock: '#A0AEC0',
    sky: '#9FD7FF',
    animal: '#E9E6D2',
  },
  SAND_BANK: {
    ground: '#BDA66A',
    grass: '#8A8F4A',
    shore: '#E4C982',
    foliage: '#477744',
    trunk: '#6A4328',
    rock: '#C8C6B5',
    sky: '#9FD7FF',
    animal: '#F0E5C0',
  },
};

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function terrainHeight(x: number, z: number, seed: number, biome: IslandBiome): number {
  const base =
    Math.sin((x + seed * 0.013) * 0.045) * 0.75 +
    Math.cos((z - seed * 0.017) * 0.052) * 0.55 +
    Math.sin((x + z) * 0.021) * 0.5;
  const shoreBlend = THREE.MathUtils.smoothstep(z, -92, -54);
  const biomeLift = biome === 'VOLCANIC' ? 1.15 : biome === 'RUINS' ? 0.55 : 0.35;
  return (base + biomeLift) * shoreBlend;
}

function clampToIsland(position: THREE.Vector3): void {
  const nx = position.x / ISLAND_RADIUS_X;
  const nz = (position.z - ISLAND_CENTER_Z) / ISLAND_RADIUS_Z;
  const distSq = nx * nx + nz * nz;
  if (distSq <= 1) return;

  const scale = 1 / Math.sqrt(distSq);
  position.x *= scale;
  position.z = ISLAND_CENTER_Z + (position.z - ISLAND_CENTER_Z) * scale;
}

function makeObjective(island: IslandData | undefined): LandingObjective {
  if (island?.hasLighthouse) {
    return {
      id: `beacon_${island.id}`,
      title: 'Restore Beacon',
      description: 'Repair the lighthouse lens and relight the tower.',
      icon: 'beacon',
      position: new THREE.Vector3(58, 0, 46),
      resource: 'gold',
      amount: 100,
      questId: `lighthouse_${island.id}`,
    };
  }

  if (island?.hasRuins || island?.biome === 'RUINS') {
    const ruinsObjective: LandingObjective = {
      id: `artifact_${island.id}`,
      title: 'Recover Artifact',
      description: 'Search the ruin circle and secure the glowing relic.',
      icon: 'artifact',
      position: new THREE.Vector3(-38, 0, 48),
      resource: 'cloth',
      amount: 30,
    };
    if (island) {
      ruinsObjective.questId = `ruins_${island.id}`;
    }
    return ruinsObjective;
  }

  if (island?.biome === 'VOLCANIC') {
    return {
      id: `vent_${island.id}`,
      title: 'Survey Vent',
      description: 'Cross the black rock shelf and mark a safe route.',
      icon: 'vent',
      position: new THREE.Vector3(36, 0, 58),
      resource: 'gold',
      amount: 28,
      exploreProgress: true,
    };
  }

  if (island?.biome === 'SAND_BANK') {
    return {
      id: `wreckage_${island.id}`,
      title: 'Search Wreckage',
      description: 'Comb the shallows for torn sails and usable rigging.',
      icon: 'wreckage',
      position: new THREE.Vector3(-48, 0, -48),
      resource: 'cloth',
      amount: 14,
      exploreProgress: true,
    };
  }

  return {
    id: `timber_${island?.id ?? 'unknown'}`,
    title: 'Survey Grove',
    description: 'Explore the inland grove and mark timber for repairs.',
    icon: 'timber',
    position: new THREE.Vector3(-46, 0, 42),
    resource: 'wood',
    amount: 20,
    exploreProgress: true,
  };
}

function buildTerrain(seed: number, biome: IslandBiome): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(270, 236, 72, 64);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i) + ISLAND_CENTER_Z;
    const y = terrainHeight(x, z, seed, biome);
    position.setY(i, y);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function createTreeSpecs(seed: number, biome: IslandBiome): TreeSpec[] {
  const rand = seededRandom(seed + 91);
  const treeCount = biome === 'FOREST' ? 92 : biome === 'VOLCANIC' ? 18 : biome === 'RUINS' ? 44 : 34;
  const trees: TreeSpec[] = [];

  for (let i = 0; i < treeCount; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * 108;
    const x = Math.cos(angle) * radius;
    const z = ISLAND_CENTER_Z + Math.sin(angle) * radius * 0.78;
    if (z < -62 || Math.hypot(x - SHIP_POSITION.x, z - SHIP_POSITION.z) < 20) continue;
    const y = terrainHeight(x, z, seed, biome);
    trees.push({
      position: [x, y, z],
      scale: 0.85 + rand() * 1.35,
      rotation: rand() * Math.PI * 2,
      palm: biome === 'SAND_BANK' || rand() > 0.72,
      dead: biome === 'VOLCANIC',
    });
  }

  return trees;
}

function createRockSpecs(seed: number, biome: IslandBiome): RockSpec[] {
  const rand = seededRandom(seed + 177);
  const count = biome === 'VOLCANIC' ? 55 : biome === 'RUINS' ? 36 : 24;
  const rocks: RockSpec[] = [];

  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * 220;
    const z = -70 + rand() * 175;
    const edge = (x / ISLAND_RADIUS_X) ** 2 + ((z - ISLAND_CENTER_Z) / ISLAND_RADIUS_Z) ** 2;
    if (edge > 0.95) continue;
    rocks.push({
      position: [x, terrainHeight(x, z, seed, biome) + 0.25, z],
      scale: [0.7 + rand() * 2.4, 0.4 + rand() * 1.1, 0.7 + rand() * 2.1],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
    });
  }

  return rocks;
}

function DockedShip() {
  return (
    <group position={SHIP_POSITION.toArray()} rotation={[0, Math.PI, 0]} scale={1.15}>
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[4, 1.4, 10]} />
        <meshStandardMaterial color="#5C3A21" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 1.85, 0]}>
        <boxGeometry args={[3.4, 0.25, 9.2]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.65} />
      </mesh>
      <mesh castShadow position={[0, 5.6, -0.4]}>
        <cylinderGeometry args={[0.12, 0.18, 7.2, 8]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      <mesh castShadow position={[0, 5.8, -0.1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4.8, 4.8]} />
        <meshStandardMaterial color="#EDE5C8" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 0.22, 7.6]}>
        <boxGeometry args={[3.6, 0.28, 12]} />
        <meshStandardMaterial color="#4B2E1F" roughness={0.9} />
      </mesh>
    </group>
  );
}

function PlayerAvatar({ refObject }: { refObject: React.RefObject<THREE.Group> }) {
  return (
    <group ref={refObject} position={[0, 0, -62]}>
      <mesh castShadow position={[0, 1.55, 0]}>
        <capsuleGeometry args={[0.38, 1.1, 6, 12]} />
        <meshStandardMaterial color="#2F5D7C" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 2.45, 0]}>
        <sphereGeometry args={[0.36, 16, 12]} />
        <meshStandardMaterial color="#D9B38C" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0.44]}>
        <boxGeometry args={[0.75, 0.7, 0.18]} />
        <meshStandardMaterial color="#7A4E2D" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-0.24, 0.45, 0]}>
        <capsuleGeometry args={[0.12, 0.55, 4, 8]} />
        <meshStandardMaterial color="#1F2937" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.24, 0.45, 0]}>
        <capsuleGeometry args={[0.12, 0.55, 4, 8]} />
        <meshStandardMaterial color="#1F2937" roughness={0.85} />
      </mesh>
    </group>
  );
}

function IslandTree({ spec, biome }: { spec: TreeSpec; biome: IslandBiome }) {
  const theme = biomeTheme[biome];
  if (spec.dead) {
    return (
      <group position={spec.position} rotation={[0, spec.rotation, 0]} scale={spec.scale}>
        <mesh castShadow position={[0, 2.4, 0]} rotation={[0.2, 0, -0.16]}>
          <cylinderGeometry args={[0.18, 0.34, 4.8, 6]} />
          <meshStandardMaterial color={theme.trunk} roughness={0.95} />
        </mesh>
        <mesh castShadow position={[0.9, 3.6, 0]} rotation={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.07, 0.14, 2.4, 5]} />
          <meshStandardMaterial color={theme.trunk} roughness={0.95} />
        </mesh>
      </group>
    );
  }

  if (spec.palm) {
    return (
      <group position={spec.position} rotation={[0, spec.rotation, 0]} scale={spec.scale}>
        <mesh castShadow position={[0, 2.45, 0]} rotation={[0, 0, 0.18]}>
          <cylinderGeometry args={[0.17, 0.32, 4.9, 7]} />
          <meshStandardMaterial color={theme.trunk} roughness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4].map((leaf) => (
          <mesh key={leaf} castShadow position={[0, 4.95, 0]} rotation={[0.35, (leaf / 5) * Math.PI * 2, 0.15]}>
            <coneGeometry args={[0.65, 3.8, 5]} />
            <meshStandardMaterial color={theme.foliage} roughness={0.9} flatShading />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={spec.position} rotation={[0, spec.rotation, 0]} scale={spec.scale}>
      <mesh castShadow position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.24, 0.38, 3.1, 7]} />
        <meshStandardMaterial color={theme.trunk} roughness={0.82} />
      </mesh>
      <mesh castShadow position={[0, 4.2, 0]}>
        <coneGeometry args={[1.7, 4.2, 7]} />
        <meshStandardMaterial color={theme.foliage} roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 5.85, 0]}>
        <coneGeometry args={[1.25, 3.1, 7]} />
        <meshStandardMaterial color={theme.foliage} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function ObjectiveStructure({ objective, biome, seed }: { objective: LandingObjective; biome: IslandBiome; seed: number }) {
  const baseY = terrainHeight(objective.position.x, objective.position.z, seed, biome);

  if (objective.icon === 'beacon') {
    return (
      <group position={[objective.position.x, baseY, objective.position.z]}>
        <mesh castShadow position={[0, 6, 0]}>
          <cylinderGeometry args={[1.25, 1.75, 12, 10]} />
          <meshStandardMaterial color="#F5F0D8" roughness={0.78} />
        </mesh>
        <mesh castShadow position={[0, 12.8, 0]}>
          <coneGeometry args={[2.1, 2.2, 10]} />
          <meshStandardMaterial color="#B5362D" roughness={0.7} />
        </mesh>
        <pointLight position={[0, 12.1, 0]} color="#FFF59D" intensity={2.2} distance={62} />
        <mesh position={[0, 12.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[2.5, 21, 18, 1, true]} />
          <meshBasicMaterial color="#FFF59D" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  if (objective.icon === 'artifact') {
    return (
      <group position={[objective.position.x, baseY, objective.position.z]}>
        {[0, 1, 2, 3, 4].map((index) => {
          const angle = (index / 5) * Math.PI * 2;
          return (
            <mesh key={index} castShadow position={[Math.cos(angle) * 6, 2, Math.sin(angle) * 6]}>
              <cylinderGeometry args={[0.55, 0.75, 4 + (index % 2), 7]} />
              <meshStandardMaterial color="#A0AEC0" roughness={0.88} />
            </mesh>
          );
        })}
        <mesh castShadow position={[0, 3.1, 0]}>
          <octahedronGeometry args={[1.15, 0]} />
          <meshStandardMaterial color="#00FFFF" emissive="#00FFFF" emissiveIntensity={1.8} roughness={0.35} />
        </mesh>
        <pointLight position={[0, 3.1, 0]} color="#00FFFF" intensity={1.8} distance={44} />
      </group>
    );
  }

  if (objective.icon === 'vent') {
    return (
      <group position={[objective.position.x, baseY, objective.position.z]}>
        <mesh castShadow position={[0, 1.2, 0]}>
          <coneGeometry args={[8, 3.4, 9]} />
          <meshStandardMaterial color="#202020" roughness={0.96} flatShading />
        </mesh>
        <mesh position={[0, 2.95, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.35, 12]} />
          <meshStandardMaterial color="#FF5A1F" emissive="#FF2B0A" emissiveIntensity={1.4} roughness={0.45} />
        </mesh>
      </group>
    );
  }

  if (objective.icon === 'wreckage') {
    return (
      <group position={[objective.position.x, baseY + 0.15, objective.position.z]} rotation={[0, -0.45, 0]}>
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[8, 0.45, 2]} />
          <meshStandardMaterial color="#5C3A21" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-2, 1.7, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 5, 6]} />
          <meshStandardMaterial color="#3E2723" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.7, 1.7, 0.1]} rotation={[0, 0, 0.35]}>
          <planeGeometry args={[2.6, 2.8]} />
          <meshStandardMaterial color="#CFC6A6" side={THREE.DoubleSide} roughness={0.95} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[objective.position.x, baseY, objective.position.z]}>
      <mesh receiveShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[7, 8, 0.2, 12]} />
        <meshStandardMaterial color="#6D7E40" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.55, 0.85, 6.4, 8]} />
        <meshStandardMaterial color="#6A4328" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 7.1, 0]}>
        <sphereGeometry args={[3.1, 14, 10]} />
        <meshStandardMaterial color="#2C7A42" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function IslandWildlife({ seed, biome }: { seed: number; biome: IslandBiome }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const theme = biomeTheme[biome];
  const agents = useMemo(() => {
    const rand = seededRandom(seed + 404);
    return Array.from({ length: 18 }, () => ({
      center: new THREE.Vector3((rand() - 0.5) * 170, 0, -30 + rand() * 125),
      radius: 4 + rand() * 12,
      speed: 0.25 + rand() * 0.45,
      phase: rand() * Math.PI * 2,
      size: 0.55 + rand() * 0.45,
    }));
  }, [seed]);

  const geometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.34, 1.05, 5);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: theme.animal,
    roughness: 0.82,
    flatShading: true,
  }), [theme.animal]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = state.clock.elapsedTime;
    agents.forEach((agent, index) => {
      const angle = agent.phase + time * agent.speed;
      const x = agent.center.x + Math.cos(angle) * agent.radius;
      const z = agent.center.z + Math.sin(angle * 0.8) * agent.radius;
      const y = terrainHeight(x, z, seed, biome) + 0.45;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, -angle + Math.PI / 2, 0);
      dummy.scale.setScalar(agent.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, agents.length]} castShadow frustumCulled={false} />;
}

export function IslandLandingScene({ island, onPromptChange }: IslandLandingSceneProps) {
  const biome = island?.biome ?? 'FOREST';
  const seed = island?.seed ?? 101;
  const theme = biomeTheme[biome];
  const camera = useThree((state) => state.camera);
  const playerRef = useRef<THREE.Group>(null);
  const playerPosition = useRef(new THREE.Vector3(0, 0, -62));
  const currentPrompt = useRef<LandingPrompt | null>(null);
  const interactionState = useRef({ nearShip: false, nearObjective: false });
  const completedObjectives = useRef<Set<string>>(new Set());

  const objective = useMemo(() => makeObjective(island), [island]);
  const terrainGeometry = useMemo(() => buildTerrain(seed, biome), [seed, biome]);
  const trees = useMemo(() => createTreeSpecs(seed, biome), [seed, biome]);
  const rocks = useMemo(() => createRockSpecs(seed, biome), [seed, biome]);

  useEffect(() => {
    completedObjectives.current.clear();
    playerPosition.current.set(0, terrainHeight(0, -62, seed, biome), -62);
    currentPrompt.current = null;
    onPromptChange(null);
  }, [seed, biome, onPromptChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE') return;

      if (interactionState.current.nearShip) {
        useUIStore.getState().setDocked(false);
        onPromptChange(null);
        return;
      }

      if (!interactionState.current.nearObjective) return;
      if (completedObjectives.current.has(objective.id)) {
        notificationSystem.push(`${objective.title} is already complete.`, 'info', 2.2);
        return;
      }

      useGameStore.getState().addResource(objective.resource, objective.amount);
      const questStore = useQuestStore.getState();

      if (objective.questId) {
        const quest = questStore.activeQuests.find((item) => item.id === objective.questId && !item.isCompleted);
        if (quest) {
          questStore.updateProgress(quest.id, Math.max(0, quest.targetAmount - quest.currentProgress));
        }
      } else if (objective.exploreProgress) {
        const quest = questStore.activeQuests.find((item) => item.type === 'EXPLORE' && item.id.startsWith('quest_') && !item.isCompleted);
        if (quest) {
          questStore.updateProgress(quest.id, 1);
        }
      }

      completedObjectives.current.add(objective.id);
      audioManager.playPickupSound();
      notificationSystem.push(`${objective.title} completed. +${objective.amount} ${objective.resource}.`, 'success', 3.2);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [objective, onPromptChange]);

  useEffect(() => {
    return () => onPromptChange(null);
  }, [onPromptChange]);

  useFrame((_, delta) => {
    const player = playerRef.current;
    if (!player) return;

    const movement = new THREE.Vector3();
    if (inputManager.isKeyPressed('KeyW') || inputManager.isKeyPressed('ArrowUp')) movement.z += 1;
    if (inputManager.isKeyPressed('KeyS') || inputManager.isKeyPressed('ArrowDown')) movement.z -= 1;
    if (inputManager.isKeyPressed('KeyA') || inputManager.isKeyPressed('ArrowLeft')) movement.x -= 1;
    if (inputManager.isKeyPressed('KeyD') || inputManager.isKeyPressed('ArrowRight')) movement.x += 1;

    if (movement.lengthSq() > 0) {
      movement.normalize();
      const speed = inputManager.isBoosting() ? 13 : 7.5;
      playerPosition.current.addScaledVector(movement, speed * Math.min(delta, 0.08));
      clampToIsland(playerPosition.current);
      player.rotation.y = Math.atan2(movement.x, movement.z);
    }

    playerPosition.current.y = terrainHeight(playerPosition.current.x, playerPosition.current.z, seed, biome);
    player.position.copy(playerPosition.current);

    const followPosition = new THREE.Vector3(
      playerPosition.current.x,
      playerPosition.current.y + 15,
      playerPosition.current.z - 22
    );
    camera.position.lerp(followPosition, 1 - Math.exp(-delta * 5));
    camera.lookAt(playerPosition.current.x, playerPosition.current.y + 2.1, playerPosition.current.z + 5);

    const shipDistance = playerPosition.current.distanceTo(SHIP_POSITION);
    const objectiveDistance = playerPosition.current.distanceTo(objective.position);
    interactionState.current.nearShip = shipDistance < RETURN_RADIUS;
    interactionState.current.nearObjective = objectiveDistance < OBJECTIVE_RADIUS;

    let nextPrompt: LandingPrompt | null = null;
    if (interactionState.current.nearShip) {
      nextPrompt = {
        kind: 'SHIP',
        title: 'Return to Ship',
        description: 'Press E beside the moored ship to sail back out.',
      };
    } else if (interactionState.current.nearObjective) {
      nextPrompt = {
        kind: 'OBJECTIVE',
        title: objective.title,
        description: completedObjectives.current.has(objective.id)
          ? 'This objective is complete.'
          : `Press E to ${objective.description.toLowerCase()}`,
      };
    }

    if (
      nextPrompt?.kind !== currentPrompt.current?.kind ||
      nextPrompt?.title !== currentPrompt.current?.title ||
      nextPrompt?.description !== currentPrompt.current?.description
    ) {
      currentPrompt.current = nextPrompt;
      onPromptChange(nextPrompt);
    }
  });

  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.sky, 120, 420]} />

      <mesh receiveShadow geometry={terrainGeometry} position={[0, 0, ISLAND_CENTER_Z]}>
        <meshStandardMaterial color={theme.ground} roughness={0.96} flatShading />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -82]}>
        <planeGeometry args={[270, 38, 1, 1]} />
        <meshStandardMaterial color={theme.shore} roughness={0.92} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, -176]}>
        <planeGeometry args={[420, 210, 1, 1]} />
        <meshStandardMaterial color="#0E6C86" roughness={0.38} metalness={0.05} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, -98]}>
        <planeGeometry args={[270, 12, 1, 1]} />
        <meshStandardMaterial color="#7FC8CF" transparent opacity={0.45} roughness={0.25} />
      </mesh>

      <DockedShip />

      {trees.map((tree, index) => (
        <IslandTree key={`tree_${index}`} spec={tree} biome={biome} />
      ))}

      {rocks.map((rock, index) => (
        <mesh key={`rock_${index}`} castShadow receiveShadow position={rock.position} rotation={rock.rotation} scale={rock.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={theme.rock} roughness={0.96} flatShading />
        </mesh>
      ))}

      <ObjectiveStructure objective={objective} biome={biome} seed={seed} />
      <IslandWildlife seed={seed} biome={biome} />
      <PlayerAvatar refObject={playerRef} />

      <mesh position={SHIP_POSITION.toArray()} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RETURN_RADIUS - 0.2, RETURN_RADIUS, 48]} />
        <meshBasicMaterial color="#F7D46A" transparent opacity={0.36} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[objective.position.x, terrainHeight(objective.position.x, objective.position.z, seed, biome) + 0.05, objective.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[OBJECTIVE_RADIUS - 0.2, OBJECTIVE_RADIUS, 48]} />
        <meshBasicMaterial color="#7DE7FF" transparent opacity={0.32} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}
