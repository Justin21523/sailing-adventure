/**
 * ShipTelemetry.tsx
 * The critical bridge between the 60fps R3F physics loop and the 10fps React UI.
 * Reads data from the GameWorld singletons and throttles updates to Zustand stores
 * to prevent React reconciliation from destroying frame rate.
 */

import { useFrame } from '@react-three/fiber';
import { useShipStore } from '@/stores/shipStore';
import { useWeatherStore } from '@/stores/weatherStore';
import { gameWorld } from '@/core/engine/GameWorld';
import type { Vector3Tuple } from '@/types';

// Update UI roughly 10 times per second (100ms interval)
const TELEMETRY_INTERVAL = 0.1; 

export function ShipTelemetry() {
  let timeSinceLastUpdate = 0;

  useFrame((_, delta) => {
    timeSinceLastUpdate += delta;

    if (timeSinceLastUpdate >= TELEMETRY_INTERVAL) {
      timeSinceLastUpdate = 0;

      const physics = gameWorld.shipPhysics;
      const wind = gameWorld.windDynamics;
      const time = performance.now() / 1000; // Approximate time for wind state

      // 1. Calculate Ship Metrics
      // Convert m/s to Knots (1 m/s ≈ 1.94384 knots)
      const speedKnots = Math.abs(physics.speed) * 1.94384;
      
      // Convert Radians to Degrees (0-360), where 0 is +Z (North in our setup)
      let headingDeg = (physics.heading * 180) / Math.PI;
      headingDeg = ((headingDeg % 360) + 360) % 360; // Normalize to 0-360

      const pos: Vector3Tuple = [physics.position.x, physics.position.y, physics.position.z];

      // 2. Calculate Wind Metrics
      const windState = wind.getWindState(time);
      const windSpeedKnots = windState.speed * 1.94384;
      
      // Calculate wind direction in degrees (where the wind is blowing TO)
      let windDirDeg = Math.atan2(windState.direction.x, windState.direction.z) * (180 / Math.PI);
      windDirDeg = ((windDirDeg % 360) + 360) % 360;

      // 3. Push to Zustand Stores (Triggers React UI updates safely)
      useShipStore.getState().updateTelemetry(speedKnots, headingDeg, pos);
      useWeatherStore.getState().updateWind(windSpeedKnots, windDirDeg);
    }
  });

  return null;
}