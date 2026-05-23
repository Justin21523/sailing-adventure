/**
 * weatherStore.ts (Enhanced)
 * Centralized state for all environmental and weather conditions.
 * Updated at a low frequency by the WeatherManager to drive UI and visual systems.
 */

import { create } from 'zustand';
import type { WeatherCondition, TimeOfDay } from '@/types';

export interface WeatherState {
  // Wind Data
  windSpeedKnots: number;
  windDirectionDegrees: number;
  
  // Atmospheric Data
  condition: WeatherCondition;
  timeOfDay: TimeOfDay;
  fogDensity: number;
  waveHeight: number;
  
  // Sun position for lighting/shadows (Euler angles or Vector3 tuple)
  sunElevation: number; // 0 to 90 degrees
  sunAzimuth: number;   // 0 to 360 degrees

  // Actions
  updateWind: (speed: number, directionDeg: number) => void;
  updateAtmosphere: (
    condition: WeatherCondition, 
    time: TimeOfDay, 
    fog: number, 
    waves: number,
    sunElev: number,
    sunAzim: number
  ) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  windSpeedKnots: 12,
  windDirectionDegrees: 45,
  condition: 'CLEAR',
  timeOfDay: 'DAY',
  fogDensity: 0.0015,
  waveHeight: 0.6,
  sunElevation: 45,
  sunAzimuth: 180,

  updateWind: (speed, directionDeg) => {
    set({
      windSpeedKnots: speed,
      windDirectionDegrees: directionDeg,
    });
  },

  updateAtmosphere: (condition, time, fog, waves, sunElev, sunAzim) => {
    set({
      condition,
      timeOfDay: time,
      fogDensity: fog,
      waveHeight: waves,
      sunElevation: sunElev,
      sunAzimuth: sunAzim,
    });
  },
}));