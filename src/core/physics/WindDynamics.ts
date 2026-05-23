/**
 * WindDynamics.ts
 * Simulates a dynamic wind field using procedural noise approximations.
 * Provides wind direction and speed vectors for the sailing physics.
 */

import type { Vec3 } from './ShipPhysics';

export interface WindState {
  direction: Vec3; // Normalized vector
  speed: number;   // Meters per second
}

export class WindDynamics {
  private baseDirection: Vec3 = { x: 1, y: 0, z: 0 }; // Default: East
  private baseSpeed: number = 8.0; // 8 m/s base wind speed

  /**
   * Sets the global prevailing wind direction.
   */
  public setBaseDirection(dir: Vec3): void {
    const length = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
    if (length > 0) {
      this.baseDirection = { x: dir.x / length, y: 0, z: dir.z / length };
    }
  }

  /**
   * Calculates the current wind state at a given time.
   * Uses layered sine waves to simulate gusts and slight direction shifts.
   */
  public getWindState(time: number): WindState {
    // 1. Calculate Gusts (Speed variations)
    // Combine low frequency swell and high frequency turbulence
    const gustFactor = 
      Math.sin(time * 0.2) * 0.3 + 
      Math.sin(time * 1.5) * 0.15 + 
      Math.sin(time * 3.7) * 0.05;
      
    const currentSpeed = this.baseSpeed * (1.0 + gustFactor);

    // 2. Calculate Direction Shifts
    // Wind direction wobbles slightly over time
    const angleShift = Math.sin(time * 0.1) * 0.2 + Math.sin(time * 0.4) * 0.05;
    
    // Rotate base direction by the angle shift
    const cosA = Math.cos(angleShift);
    const sinA = Math.sin(angleShift);
    
    const dirX = this.baseDirection.x * cosA - this.baseDirection.z * sinA;
    const dirZ = this.baseDirection.x * sinA + this.baseDirection.z * cosA;

    return {
      direction: { x: dirX, y: 0, z: dirZ },
      speed: Math.max(0, currentSpeed)
    };
  }
  /**
   * Resets physics state to initial values.
   */
  public reset(): void {
    this.baseDirection = { x: 1, y: 0, z: 0 };
    this.baseSpeed = 8.0;
  }
}
