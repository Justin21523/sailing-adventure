/**
 * InputManager.ts
 * Centralized input abstraction layer.
 * Unifies keyboard inputs and virtual touch controls into a single API 
 * for the physics engine to consume, preventing duplicated input logic.
 */

export class InputManager {
  private pressedKeys: Set<string> = new Set();
  
  // Virtual inputs for mobile touch controls (-1.0 to 1.0)
  private virtualRudder: number = 0;
  private virtualSailTrim: number = 0; // -1 (In), 0 (Neutral), 1 (Out)
  private virtualThrottle: number = 0; // -1 (Reverse), 0 (Neutral), 1 (Full Ahead)

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      // Prevent context menu on long press for mobile
      window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.pressedKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.pressedKeys.delete(e.code);
  };

  /**
   * Called by MobileControls UI to inject virtual joystick/slider values.
   */
  public setVirtualRudder(value: number): void {
    this.virtualRudder = Math.max(-1, Math.min(1, value));
  }

  public setVirtualSailTrim(value: number): void {
    this.virtualSailTrim = Math.max(-1, Math.min(1, value));
  }

  public setVirtualThrottle(value: number): void {
    this.virtualThrottle = Math.max(-1, Math.min(1, value));
  }
  /**
   * Returns the combined rudder input from Keyboard (A/D) and Virtual Touch.
   */
  public getRudder(): number {
    let rudder = this.virtualRudder;
    if (this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft')) rudder -= 1;
    if (this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight')) rudder += 1;
    return Math.max(-1, Math.min(1, rudder));
  }

  public getThrottle(): number {
    let throttle = this.virtualThrottle;
    if (this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp')) throttle += 1;
    if (this.pressedKeys.has('KeyS') || this.pressedKeys.has('ArrowDown')) throttle -= 1;
    return Math.max(-1, Math.min(1, throttle));
  }
  
  public isBoosting(): boolean {
    return this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight') || this.pressedKeys.has('Space');
  }
  
  /**
   * Returns the combined sail trim input from Keyboard (W/S) and Virtual Touch.
   */
  public getSailTrim(): number {
    let trim = this.virtualSailTrim;
    if (this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp')) trim -= 1;
    if (this.pressedKeys.has('KeyS') || this.pressedKeys.has('ArrowDown')) trim += 1;
    return Math.max(-1, Math.min(1, trim));
  }

  public isKeyPressed(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
  }
}

export const inputManager = new InputManager();