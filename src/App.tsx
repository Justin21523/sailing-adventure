/**
 * App.tsx
 * Root component assembling the 3D Canvas, lighting, environment, and game entities.
 * FIX: Uses fixed positioning and explicit inline dimensions to guarantee the canvas 
 * fills the entire viewport, bypassing potential Tailwind compilation delays or overrides.
 */

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { OceanMesh } from '@/components/ocean/OceanMesh';
import { ShipController } from '@/components/ship/ShipController';
import { CameraFollow } from '@/components/ship/CameraFollow';
import { ShipTelemetry } from '@/components/ship/ShipTelemetry';
import { HUD } from '@/ui/HUD';
import { WakeEffect } from '@/components/effects/WakeEffect';
import { type LootEntity } from '@/core/systems/EventSystem';
import { FloatingLoot } from '@/components/environment/FloatingLoot';
import { OceanFlotsam } from '@/components/environment/OceanFlotsam';
import { Wildlife } from '@/components/environment/Wildlife';
import { PostProcessing } from '@/components/effects/PostProcessing';
import { audioManager } from '@/core/audio/AudioManager';
import { UpgradeShop } from '@/ui/UpgradeShop';
import { useUpgradeStore } from '@/stores/upgradeStore';
import { EnvironmentController } from '@/components/environment/EnvironmentController';
import { EngineBridge } from '@/core/engine/EngineBridge';
import { MobileControls } from '@/ui/MobileControls';
import { NotificationToast } from '@/ui/NotificationToast';
import { CameraShake } from '@/components/effects/CameraShake';
import { IslandInteractionZone } from '@/components/environment/IslandInteractionZone';
import { ShipDamageVFX } from '@/components/ship/ShipDamageVFX';
import { PauseMenu } from '@/ui/PauseMenu';
import { InteractionPrompt } from '@/ui/InteractionPrompt';
import { GameOverScreen } from '@/ui/GameOverScreen';
import { useUIStore } from '@/stores/uiStore';
import { ExplorationPanel } from '@/ui/ExplorationPanel';
import { IslandObjectiveUI } from '@/ui/IslandObjectiveUI';
import type { IslandData } from '@/core/systems/ChunkManager';
import { EnhancedIsland } from '@/components/environment/EnhancedIsland';
import { IslandLandingScene } from '@/components/environment/IslandLandingScene';
import type { LandingPrompt } from '@/types';
import  { CombatHUD } from '@/ui/CombatHUD';
import  { CannonSystem } from '@/components/ship/CannonSystem';
import { EnemyFleet } from '@/components/environment/EnemyFleet';
import { CombatVFX } from '@/components/effects/CombatVFX';
import { ProjectileRenderer } from '@/components/effects/ProjectileRenderer';
import { TradePanel } from '@/ui/TradePanel';
import { WhirlpoolRenderer } from '@/components/environment/Whirlpool';
import { KrakenTentacle } from '@/components/environment/KrakenTentacle';
import { WreckageRenderer } from '@/components/environment/Wreckage';
import { CaptainAbilities } from '@/components/ship/CaptainAbilities';
import { MerchantFleet } from '@/components/environment/MerchantFleet';
import { MerchantTradePanel } from '@/ui/MerchantTradePanel';
import { TreasureSpotRenderer } from '@/components/environment/TreasureSpot';
import { CompassHUD } from '@/ui/CompassHUD';
import { CrewPanel } from '@/ui/CrewPanel';
import { ShipVisuals } from '@/components/ship/ShipVisuals';
import { FishingVFX } from '@/components/effects/FishingVFX';
import { FishingMinigameUI } from '@/ui/FishingMinigameUI';

/**
 * Procedural Ship Placeholder.
 * Visual representation of the ship. Physics and transforms are handled by ShipController.
 */
function ShipPlaceholder() {
  return (
    <>
      {/* Hull */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.5, 1.2, 7]} />
        <meshStandardMaterial color="#5C3A21" roughness={0.8} />
      </mesh>
      
      {/* Deck */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[2.3, 0.2, 6.8]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.6} />
      </mesh>

      {/* Main Mast */}
      <mesh castShadow position={[0, 4, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 7, 8]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      
      {/* Main Sail */}
      <mesh castShadow position={[0, 4.5, 0.2]}>
        <planeGeometry args={[4, 5]} />
        <meshStandardMaterial color="#F5F5DC" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      
      {/* Front Mast */}
      <mesh castShadow position={[0, 2.5, 2.5]}>
        <cylinderGeometry args={[0.08, 0.12, 4, 8]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      
      {/* Front Sail */}
      <mesh castShadow position={[0, 3, 2.7]}>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial color="#E8E8D0" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
    </>
  );
}

export default function App() {
  // Ref to share the ship's 3D group transform with the CameraFollow component
  const shipRef = useRef<THREE.Group>(null);
  
  // Local state for rendering world entities (Loot and Islands)
  // These are updated via EngineBridge based on the ship's position
  const [activeLoot, setActiveLoot] = useState<LootEntity[]>([]);
  const [activeIslands, setActiveIslands] = useState<IslandData[]>([]);
  const [landingPrompt, setLandingPrompt] = useState<LandingPrompt | null>(null);
  const isDocked = useUIStore((s) => s.isDocked);
  const targetIslandId = useUIStore((s) => s.targetIslandId);
  const dockedIsland = activeIslands.find((island) => island.id === targetIslandId);
  
  // Global Hotkeys & Audio Initialization
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shop
      if (e.code === 'KeyU') useUpgradeStore.getState().toggleShop();
      
      // Pause
      if (e.code === 'KeyP') useUIStore.getState().togglePause();
      
      // Interaction (Dock/Undock)
      if (e.code === 'KeyE') {
        const { activePrompt, isDocked: docked, targetIslandId: islandId } = useUIStore.getState();
        if (activePrompt === 'DOCK' && !docked) {
          useUIStore.getState().setDocked(true, islandId);
        }
      }

      // Escape (Close Menus / Undock)
      if (e.code === 'Escape') {
        useUpgradeStore.getState().closeShop();
        if (useUIStore.getState().isPaused) useUIStore.getState().resume();
      }
    };

    const handleInteraction = () => {
      audioManager.initialize();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);


  return (
    // FIX: Explicit inline styles guarantee 100% viewport coverage regardless of CSS loading state
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0A192F'
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 8, -15], fov: 55, near: 0.1, far: 5000 }}
        gl={{ 
          antialias: true, 
          alpha: false, 
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0
        }}
      >
        <EnemyFleet />
        <ProjectileRenderer />
        <CombatVFX />
        <WreckageRenderer />
        <TreasureSpotRenderer />

        <Suspense fallback={null}>
          {/* Global Lighting */}
          <ambientLight intensity={0.6} color="#B0C4DE" />

          {/* Sky & Atmosphere */}
          <Sky 
            sunPosition={[50, 80, 30]} 
            turbidity={6} 
            rayleigh={1.5} 
            mieCoefficient={0.005} 
            mieDirectionalG={0.8} 
          />
          {/* Environment & Weather Controller */}
          <EnvironmentController />
          <fog attach="fog" args={['#87CEEB', 150, 1200]} />

          {isDocked ? (
            <IslandLandingScene island={dockedIsland} onPromptChange={setLandingPrompt} />
          ) : (
            <>
              {/* Game Entities */}
              <OceanMesh />
              <OceanFlotsam />
              <Wildlife />
              <MerchantFleet />
              
              {/* Render Active Islands (determined by ChunkManager) */}
              {activeIslands.map((island) => (
                <group key={island.id}>
                  <EnhancedIsland data={island} />
                  <IslandInteractionZone data={island} />
                </group>
              ))}
              
              {/* Render Dynamic Loot */}
              {activeLoot.map((loot) => (
                <FloatingLoot key={loot.id} data={loot} />
              ))}

              <ShipController ref={shipRef}>
                <ShipVisuals />
                <FishingVFX />
                <CannonSystem />
                <CaptainAbilities />
              </ShipController>

              {/* VFX at scene root — world-space coords must not inherit ship group transform */}
              <WakeEffect />
              <ShipDamageVFX />

              {/* Third-person camera following the ship */}
              <CameraFollow target={shipRef} />
              <CameraShake />
              {/* Telemetry Bridge: Syncs physics to UI stores safely */}
              <ShipTelemetry />
            </>
          )}
          
          {/* Master Ticker for all Pure TS Systems: Manages weather, loot, chunking, and physics sync */}
          <EngineBridge 
            onLootChange={setActiveLoot} 
            onIslandsChange={setActiveIslands}
          />

          <WhirlpoolRenderer />
          <KrakenTentacle />
          {/* Cinematic Camera Effects */}
          <PostProcessing />
        </Suspense>
      </Canvas>

      {/* React UI Layer: Positioned absolutely over the Canvas */}
      {!isDocked && <HUD islands={activeIslands}/>}
      {!isDocked && <UpgradeShop />}
      {isDocked && <ExplorationPanel islands={activeIslands} prompt={landingPrompt} />}
      {isDocked && <TradePanel />}
      {!isDocked && <MerchantTradePanel />}
      {!isDocked && <MobileControls />}
      <NotificationToast />
      {!isDocked && <InteractionPrompt />}
      {!isDocked && <IslandObjectiveUI />}
      <PauseMenu />
      <GameOverScreen />
      <CombatHUD/>
      <TradePanel/>
      <CompassHUD />
      <CrewPanel />
      <FishingMinigameUI />
    </div>
  );
}
