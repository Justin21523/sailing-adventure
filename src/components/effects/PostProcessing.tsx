/**
 * PostProcessing.tsx (Fixed)
 * Cinematic camera effects pipeline.
 * FIX: Removed dependency on the external 'postprocessing' package for ToneMapping.
 * ToneMapping is now handled natively by the Three.js WebGL renderer in App.tsx for better performance.
 */

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useSettingsStore } from '@/stores/settingsStore';

export function PostProcessing() {
  const enabled = useSettingsStore((s) => s.postProcessingEnabled);
  const tier = useSettingsStore((s) => s.performanceTier);

  if (!enabled) return null;

  // Scale bloom intensity based on performance tier
  const bloomIntensity = tier === 'ULTRA' ? 0.8 : tier === 'HIGH' ? 0.5 : 0.2;

  return (
    <EffectComposer multisampling={0}>
      <Bloom 
        intensity={bloomIntensity} 
        luminanceThreshold={0.8} 
        luminanceSmoothing={0.9} 
        mipmapBlur 
      />
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
    </EffectComposer>
  );
}