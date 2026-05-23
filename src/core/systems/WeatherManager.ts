/**
 * WeatherManager.ts
 * Pure TypeScript state machine that drives the weather and time of day.
 * It interpolates between weather states smoothly and pushes updates to the WeatherStore.
 */

import { gameWorld } from '@/core/engine/GameWorld';
import { useWeatherStore } from '@/stores/weatherStore';
import type { WeatherCondition, TimeOfDay } from '@/types';

interface WeatherProfile {
  condition: WeatherCondition;
  baseWindSpeed: number; // m/s
  gustiness: number;
  targetFog: number;
  targetWaveHeight: number;
}

const PROFILES: Record<WeatherCondition, WeatherProfile> = {
  CLEAR:  { condition: 'CLEAR',  baseWindSpeed: 6,  gustiness: 0.1, targetFog: 0.001, targetWaveHeight: 0.4 },
  CLOUDY: { condition: 'CLOUDY', baseWindSpeed: 10, gustiness: 0.3, targetFog: 0.002, targetWaveHeight: 0.8 },
  FOGGY:  { condition: 'FOGGY',  baseWindSpeed: 4,  gustiness: 0.05,targetFog: 0.015, targetWaveHeight: 0.3 },
  RAIN:   { condition: 'RAIN',   baseWindSpeed: 14, gustiness: 0.5, targetFog: 0.005, targetWaveHeight: 1.2 },
  STORM:  { condition: 'STORM',  baseWindSpeed: 22, gustiness: 0.9, targetFog: 0.008, targetWaveHeight: 2.5 },
};

export class WeatherManager {
  private currentTime: number = 8; // Start at 8:00 AM (Hours 0-24)
  private timeScale: number = 60;  // 1 real second = 1 in-game minute
  
  private currentCondition: WeatherCondition = 'CLEAR';
  private nextCondition: WeatherCondition = 'CLEAR';
  private transitionProgress: number = 1.0; // 1.0 means fully transitioned
  
  private storeUpdateTimer: number = 0;
  private readonly STORE_UPDATE_INTERVAL = 0.2; // Push to Zustand 5 times a second

  public update(delta: number): void {
    // 1. Advance Time of Day
    this.currentTime += (delta * this.timeScale) / 60; // Convert minutes to hours
    if (this.currentTime >= 24) this.currentTime -= 24;

    // 2. Handle Weather Transitions
    if (this.transitionProgress < 1.0) {
      this.transitionProgress += delta * 0.1; // 10 seconds to fully change weather
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.currentCondition = this.nextCondition;
      }
    } else {
      // Random chance to trigger a new weather event every few seconds
      if (Math.random() < 0.002) {
        this.triggerRandomWeatherEvent();
      }
    }

    // 3. Calculate Interpolated Environmental Values
    const currentProfile = PROFILES[this.currentCondition];
    const nextProfile = PROFILES[this.nextCondition];
    const t = this.transitionProgress;

    const windSpeed = this.lerp(currentProfile.baseWindSpeed, nextProfile.baseWindSpeed, t);
    const waveHeight = this.lerp(currentProfile.targetWaveHeight, nextProfile.targetWaveHeight, t);
    const fogDensity = this.lerp(currentProfile.targetFog, nextProfile.targetFog, t);

    // 4. Sync with Physics Engine (High frequency, no React)
    // Convert wind speed to a direction vector (simplified: blowing towards Azimuth)
    const windAzimuth = (this.currentTime * 15) % 360; // Wind shifts slowly with time
    const windRad = (windAzimuth * Math.PI) / 180;
    gameWorld.windDynamics.setBaseDirection({
      x: Math.sin(windRad),
      y: 0,
      z: Math.cos(windRad)
    });

    // 5. Throttled Push to Zustand Store (Low frequency, drives UI & Visuals)
    this.storeUpdateTimer += delta;
    if (this.storeUpdateTimer >= this.STORE_UPDATE_INTERVAL) {
      this.storeUpdateTimer = 0;
      
      const timeOfDay = this.getTimeOfDayPhase();
      const sunElevation = this.calculateSunElevation();
      
      useWeatherStore.getState().updateWind(windSpeed * 1.94384, windAzimuth); // m/s to knots
      useWeatherStore.getState().updateAtmosphere(
        this.currentCondition,
        timeOfDay,
        fogDensity,
        waveHeight,
        sunElevation,
        windAzimuth
      );
    }
  }

  private triggerRandomWeatherEvent(): void {
    const conditions: WeatherCondition[] = ['CLEAR', 'CLOUDY', 'FOGGY', 'RAIN', 'STORM'];
    // Weighted random: Clear/Cloudy more likely than Storm
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05];
    let r = Math.random();
    let chosen: WeatherCondition = 'CLEAR';
    
    for (let i = 0; i < conditions.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = conditions[i];
        break;
      }
    }

    if (chosen !== this.currentCondition) {
      this.nextCondition = chosen;
      this.transitionProgress = 0;
    }
  }

  private getTimeOfDayPhase(): TimeOfDay {
    if (this.currentTime >= 5 && this.currentTime < 7) return 'DAWN';
    if (this.currentTime >= 7 && this.currentTime < 17) return 'DAY';
    if (this.currentTime >= 17 && this.currentTime < 19) return 'DUSK';
    return 'NIGHT';
  }

  private calculateSunElevation(): number {
    // Simple sine wave for sun elevation: 0 at midnight, 90 at noon
    // Peaks at 12:00 (Noon)
    const hourAngle = ((this.currentTime - 6) / 12) * Math.PI; 
    const elevation = Math.sin(hourAngle) * 90;
    return Math.max(-10, elevation); // Allow slightly below horizon for twilight
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}

export const weatherManager = new WeatherManager();