/* ──────────────────────────────────────────────────────────────
   Audio Interface — stub for future audio capture + analysis.

   When implemented:
     - Capture system audio (WASAPI loopback on Windows)
     - Or connect to Spotify Web Playback SDK audio stream
     - Perform real-time FFT analysis
     - Extract frequency bands: bass, energy, treble
     - Drive wave shader uniforms and chromatic aberration
   ───────────────────────────────────────────────────────────── */

/** Per-frame audio analysis output */
export interface AudioFrame {
  /** 0–1  Low frequency energy (20–250 Hz) */
  bass: number;
  /** 0–1  Mid frequency energy (250–2000 Hz) */
  energy: number;
  /** 0–1  High frequency energy (2000–20000 Hz) */
  treble: number;
  /** 0–1  Overall RMS volume */
  volume: number;
  /** True on beat (bass transient exceeds threshold) */
  beat: boolean;
}

/** Audio source types */
export type AudioSource =
  | "demo"       // Simulated rhythmic audio (no external source needed)
  | "spotify"    // Spotify Web Playback SDK audio
  | "system"     // WASAPI system audio loopback
  | "microphone"; // Microphone input

/** Audio engine configuration */
export interface AudioConfig {
  /** FFT size (power of 2, default: 2048) */
  fftSize: number;
  /** Smoothing time constant for analyser (0–1, default: 0.4) */
  smoothingTime: number;
  /** EMA smoothing factor for band values (0–1, default: 0.15) */
  bandSmoothing: number;
  /** Beat detection: threshold multiplier over trailing average */
  beatThreshold: number;
  /** Beat detection: cooldown in milliseconds */
  beatCooldownMs: number;
}

/**
 * Stub: IAudioEngine interface.
 *
 * Implementations:
 *   - DemoAudioEngine     — simulated oscillators (for UI development)
 *   - SpotifyAudioEngine  — connects to Spotify Web Playback SDK
 *   - SystemAudioEngine   — WASAPI loopback capture
 *   - MicAudioEngine      — microphone input
 */
export interface IAudioEngine {
  /** Start audio capture/analysis */
  start(source: AudioSource, config?: Partial<AudioConfig>): Promise<void>;
  /** Get the latest audio analysis frame */
  update(dt: number): AudioFrame;
  /** Dispose of audio resources */
  dispose(): void;
}

/** React hook return type (when implemented) */
export interface UseAudioDataReturn extends AudioFrame {
  /** Start the audio engine */
  start: (source?: AudioSource) => Promise<void>;
  /** Whether the engine is running */
  ready: boolean;
}
