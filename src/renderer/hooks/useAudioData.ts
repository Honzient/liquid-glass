import { useEffect, useRef, useState, useCallback } from "react";
import { AudioEngine, getAudioEngine, type AudioFrame } from "../audio/AudioEngine";

export interface UseAudioDataReturn extends AudioFrame {
  /** Start the audio engine with the given source */
  start: (source?: "demo" | "mic" | "system") => Promise<void>;
  /** Whether the engine has been started */
  ready: boolean;
}

/**
 * React hook wrapping the singleton AudioEngine.
 * Starts in demo mode automatically on mount.
 * Returns smoothed audio band values each frame.
 */
export function useAudioData(): UseAudioDataReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const [ready, setReady] = useState(false);

  // Audio frame state (updated from rAF loop outside React render cycle)
  const frameRef = useRef<AudioFrame>({
    bass: 0, energy: 0, treble: 0, volume: 0, beat: false,
  });
  const [, forceTick] = useState(0);

  // Poll audio data on rAF
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const engine = getAudioEngine();
    engineRef.current = engine;

    // Auto-start demo mode
    engine.start("demo").then(() => {
      setReady(true);
    });

    // rAF loop: poll audio data and push to ref
    const loop = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      const frame = engine.update(dt);
      frameRef.current = frame;

      // Trigger React re-render ~10 times/sec (avoid 60fps React updates)
      // We use a counter so components using this hook re-render
      rafRef.current = requestAnimationFrame((t) => {
        forceTick((n) => n + 1);
        loop(t);
      });
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const start = useCallback(async (source?: "demo" | "mic" | "system") => {
    await engineRef.current?.start(source);
    setReady(true);
  }, []);

  return {
    ...frameRef.current,
    start,
    ready,
  };
}
