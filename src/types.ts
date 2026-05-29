/**
 * Global Type Definitions for the 3D Sailing Adventure.
 * Centralizes all interfaces, enums, and types used across the engine, stores, and UI.
 */

// Represents standard 3D vector tuples to avoid heavy THREE.Vector3 object creation in state
export type Vector3Tuple = [number, number, number];
export type QuaternionTuple = [number, number, number, number];

export type GameStatus = 'INITIALIZING' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
export type WeatherCondition = 'CLEAR' | 'CLOUDY' | 'FOGGY' | 'RAIN' | 'STORM';
export type TimeOfDay = 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
export type PerformanceTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export interface ResourceInventory {
  wood: number;
  gold: number;
  cloth: number;
  rum: number;
}

export type ResourceType = keyof ResourceInventory;

export interface ShipStats {
  hullHealth: number;
  maxHullHealth: number;
  sailHealth: number;
  maxSailHealth: number;
  baseSpeed: number;
  turnRate: number;
  cargoCapacity: number;
}

/**
 * High-frequency transform data. 
 * Note: This is typically kept in a pure TS class/ref, not synced to Zustand every frame.
 */
export interface ShipTransform {
  position: Vector3Tuple;
  rotation: Vector3Tuple; // Euler angles in radians
  quaternion: QuaternionTuple;
  velocity: Vector3Tuple;
  angularVelocity: Vector3Tuple;
}

export interface WindState {
  direction: Vector3Tuple; // Normalized vector
  speed: number; // meters per second
  gustiness: number; // 0 to 1
}

export interface WeatherState {
  condition: WeatherCondition;
  timeOfDay: TimeOfDay;
  sunPosition: Vector3Tuple;
  fogDensity: number;
  waveHeight: number;
  wind: WindState;
}

export interface GameSettings {
  performanceTier: PerformanceTier;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  showFps: boolean;
  invertYAxis: boolean;
  shadowsEnabled: boolean;
  postProcessingEnabled: boolean;
}

export interface UpgradeLevel {
  hull: number;
  sails: number;
  rudder: number;
  cannons: number;
}

export interface LandingPrompt {
  kind: 'SHIP' | 'OBJECTIVE';
  title: string;
  description: string;
}
