/**
 * GameLoop.ts (Fixed)
 * FIX: Resolved TS2412 errors with exactOptionalPropertyTypes by explicitly allowing undefined.
 */

export type UpdateCallback = (deltaTime: number, elapsedTime: number) => void;
export type FixedUpdateCallback = (fixedDeltaTime: number, elapsedTime: number) => void;

export interface GameLoopConfig {
  onUpdate?: UpdateCallback | undefined;
  onFixedUpdate?: FixedUpdateCallback | undefined;
  onRender?: UpdateCallback | undefined;
  fixedTimeStep?: number;
  maxDeltaTime?: number;
}

export class GameLoop {
  private rafId: number | null = null;
  private isRunning: boolean = false;
  private lastTimestamp: number = 0;
  private elapsedTime: number = 0;
  private accumulator: number = 0;
  private timeScale: number = 1;

  private onUpdate: UpdateCallback | undefined;
  private onFixedUpdate: FixedUpdateCallback | undefined;
  private onRender: UpdateCallback | undefined;
  private fixedTimeStep: number;
  private maxDeltaTime: number;

  constructor(config: GameLoopConfig) {
    this.onUpdate = config.onUpdate;
    this.onFixedUpdate = config.onFixedUpdate;
    this.onRender = config.onRender;
    this.fixedTimeStep = config.fixedTimeStep ?? 1 / 60;
    this.maxDeltaTime = config.maxDeltaTime ?? 0.1;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.tick(this.lastTimestamp);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  private tick = (timestamp: number): void => {
    if (!this.isRunning) return;

    let frameDelta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    if (frameDelta > this.maxDeltaTime) frameDelta = this.maxDeltaTime;

    const scaledDelta = frameDelta * this.timeScale;
    this.elapsedTime += scaledDelta;

    if (this.onFixedUpdate) {
      this.accumulator += scaledDelta;
      while (this.accumulator >= this.fixedTimeStep) {
        this.onFixedUpdate(this.fixedTimeStep, this.elapsedTime);
        this.accumulator -= this.fixedTimeStep;
      }
    }

    if (this.onUpdate) this.onUpdate(scaledDelta, this.elapsedTime);
    if (this.onRender) this.onRender(scaledDelta, this.elapsedTime);

    this.rafId = requestAnimationFrame(this.tick);
  };

  public dispose(): void {
    this.stop();
    this.onUpdate = undefined;
    this.onFixedUpdate = undefined;
    this.onRender = undefined;
  }
}