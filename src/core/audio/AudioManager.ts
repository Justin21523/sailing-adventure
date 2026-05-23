/**
 * AudioManager.ts
 * Procedural Audio Engine. Generates sound effects and ambient loops entirely via Web Audio API math.
 * Eliminates the need for external audio files (MP3/WAV) while providing dynamic, reactive soundscapes.
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Ambient Nodes
  private windNoise: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private waveNoise: AudioBufferSourceNode | null = null;
  private waveGain: GainNode | null = null;

  private isInitialized = false;

  constructor() {
    // AudioContext must be created/resumed after a user gesture (click/keydown) due to browser autoplay policies
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      
      this.startAmbience();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked by browser policy.', e);
    }
  }

  public setMasterVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * Generates a buffer of Pink Noise (more natural sounding than White Noise for wind/water).
   */
  private generatePinkNoiseBuffer(duration: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // Scale down to prevent clipping
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startAmbience(): void {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.generatePinkNoiseBuffer(4); // 4 second looping buffer

    // 1. Wind Ambience (Lowpass filtered noise)
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.15;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    
    this.windNoise = this.ctx.createBufferSource();
    this.windNoise.buffer = noiseBuffer;
    this.windNoise.loop = true;
    this.windNoise.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windNoise.start();

    // 2. Wave Ambience (Bandpass filtered noise)
    this.waveGain = this.ctx.createGain();
    this.waveGain.gain.value = 0.2;
    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = 'bandpass';
    waveFilter.frequency.value = 800;
    waveFilter.Q.value = 0.5;

    this.waveNoise = this.ctx.createBufferSource();
    this.waveNoise.buffer = noiseBuffer;
    this.waveNoise.loop = true;
    this.waveNoise.connect(waveFilter);
    waveFilter.connect(this.waveGain);
    this.waveGain.connect(this.masterGain);
    this.waveNoise.start();
  }

  /**
   * Dynamically adjusts wind volume based on ship speed and wind strength.
   */
  public updateAmbience(shipSpeed: number, windSpeed: number): void {
    if (!this.ctx || !this.windGain || !this.waveGain) return;
    
    // Wind howls louder when sailing fast or in high winds
    const targetWindVol = 0.1 + Math.min(shipSpeed / 20, 0.4) + Math.min(windSpeed / 20, 0.3);
    this.windGain.gain.setTargetAtTime(targetWindVol, this.ctx.currentTime, 0.5);
    
    // Waves crash louder when moving
    const targetWaveVol = 0.15 + Math.min(shipSpeed / 15, 0.25);
    this.waveGain.gain.setTargetAtTime(targetWaveVol, this.ctx.currentTime, 0.5);
  }

  /**
   * Procedurally synthesizes a "pickup/loot" chime using oscillators.
   */
  public playPickupSound(): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    // Oscillator 1: Quick high pitch
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Oscillator 2: Harmonic fifth
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now + 0.05); // E6
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.4);
  }
}

export const audioManager = new AudioManager();