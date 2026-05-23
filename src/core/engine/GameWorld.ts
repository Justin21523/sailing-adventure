/**
 * GameWorld.ts
 * Central registry for pure TypeScript game systems.
 * Acts as a singleton hub to share physics and environmental state between 
 * the R3F render loop, non-React modules (like Audio), and UI telemetry 
 * without relying on React Context or prop-drilling.
 */

import { ShipPhysics } from '@/core/physics/ShipPhysics';
import { WindDynamics } from '@/core/physics/WindDynamics';
import { BuoyancySystem } from '@/core/physics/BuoyancySystem';

class GameWorld {
  public readonly shipPhysics: ShipPhysics;
  public readonly windDynamics: WindDynamics;
  public readonly buoyancySystem: BuoyancySystem;

  constructor() {
    this.shipPhysics = new ShipPhysics();
    this.windDynamics = new WindDynamics();
    this.buoyancySystem = new BuoyancySystem();
    
    // Set initial environmental conditions
    this.windDynamics.setBaseDirection({ x: 0.5, y: 0, z: 1 }); // South-East wind
  }

  public reset(): void {
    this.shipPhysics.reset();
    this.windDynamics.reset();
    this.buoyancySystem.reset();
  }
}

// Export a single frozen instance to be used across the entire application
export const gameWorld = new GameWorld();