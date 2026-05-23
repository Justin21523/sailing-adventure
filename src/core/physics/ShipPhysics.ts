/**
 * ShipPhysics.ts
 * Pure TypeScript physics simulation for the ship.
 * Decoupled from Three.js objects to ensure high-performance math calculations 
 * without triggering React re-renders or Three.js matrix updates unnecessarily.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export class ShipPhysics {
  // Transform state
  public position: Vec3 = { x: 0, y: 0, z: 0 };
  public rotation: Vec3 = { x: 0, y: 0, z: 0 }; // Euler angles
  
  // Kinematic state
  public velocity: Vec3 = { x: 0, y: 0, z: 0 };
  public speed: number = 0; // Scalar speed along local Z axis (forward/backward)
  public heading: number = 0; // Radians (Y-axis rotation)

  // Configuration constants
  public maxSpeed: number = 15;
  public acceleration: number = 4.0;
  public turnSpeed: number = 1.8;
  public drag: number = 0.92; // Water resistance factor
  public angularDrag: number = 0.85;

  // Input state (Normalized -1.0 to 1.0)
  public throttle: number = 0; 
  public rudder: number = 0;   

  /**
   * Steps the physics simulation forward by deltaTime.
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    // 1. Apply throttle to longitudinal speed
    // Lerp towards target speed for smooth acceleration/deceleration
    const targetSpeed = this.throttle * this.maxSpeed;
    const speedDiff = targetSpeed - this.speed;
    this.speed += speedDiff * this.acceleration * dt;
    
    // Apply drag when no throttle is applied to simulate water friction
    if (Math.abs(this.throttle) < 0.1) {
      this.speed *= Math.pow(this.drag, dt * 60);
    }

    // 2. Apply rudder to heading (Yaw)
    // Turning effectiveness scales with speed (can't turn if stationary)
    const speedFactor = Math.min(Math.abs(this.speed) / 5.0, 1.0);
    const turnAmount = this.rudder * this.turnSpeed * speedFactor * dt;
    
    // Invert turning direction if reversing
    this.heading += this.speed >= 0 ? turnAmount : -turnAmount;

    // 3. Calculate world velocity vector based on heading
    // Assuming +Z is forward in local space
    this.velocity.x = Math.sin(this.heading) * this.speed;
    this.velocity.z = Math.cos(this.heading) * this.speed;
    
    // 4. Integrate position
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    
    // 5. Sync Euler rotation for Three.js Mesh
    this.rotation.y = this.heading;
  }

  /**
   * Resets physics state to initial values.
   */
  public reset(): void {
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.speed = 0;
    this.heading = 0;
    this.throttle = 0;
    this.rudder = 0;
  }
}