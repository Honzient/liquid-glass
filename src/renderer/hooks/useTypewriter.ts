import { useState, useEffect, useRef, useCallback } from "react";

export interface UseTypewriterOptions {
  /** Characters revealed per second (default: 12) */
  speed?: number;
  /** Delay before starting (ms, default: 300) */
  startDelay?: number;
  /** Whether to loop back to beginning (default: false) */
  loop?: boolean;
  /** Called when full text is revealed */
  onComplete?: () => void;
}

export interface UseTypewriterReturn {
  /** Currently visible text */
  displayedText: string;
  /** Index of the next character to reveal */
  progress: number;
  /** 0–1 fraction of total text revealed */
  fraction: number;
  /** Whether the full text has been revealed */
  done: boolean;
  /** Reset the typewriter to start over */
  reset: () => void;
}

/**
 * Typewriter animation hook.
 * Reveals characters one at a time at configurable speed.
 */
export function useTypewriter(
  fullText: string,
  options: UseTypewriterOptions = {},
): UseTypewriterReturn {
  const { speed = 12, startDelay = 300, loop = false, onComplete } = options;

  const [charIndex, setCharIndex] = useState(0);
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const totalChars = fullText.length;

  // Reset when text changes
  useEffect(() => {
    setCharIndex(0);
    doneRef.current = false;
  }, [fullText]);

  // Typewriter interval
  useEffect(() => {
    const intervalMs = 1000 / speed;

    const delayTimer = setTimeout(() => {
      timerRef.current = setInterval(() => {
        setCharIndex((prev) => {
          const next = prev + 1;
          if (next >= totalChars) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!doneRef.current) {
              doneRef.current = true;
              onCompleteRef.current?.();
            }
            if (loop) {
              // Restart after pause
              setTimeout(() => {
                setCharIndex(0);
                doneRef.current = false;
              }, 1200);
            }
            return totalChars;
          }
          return next;
        });
      }, intervalMs);
    }, startDelay);

    return () => {
      clearTimeout(delayTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fullText, speed, startDelay, loop, totalChars]);

  const reset = useCallback(() => {
    setCharIndex(0);
    doneRef.current = false;
  }, []);

  return {
    displayedText: fullText.slice(0, charIndex),
    progress: charIndex,
    fraction: totalChars > 0 ? charIndex / totalChars : 0,
    done: charIndex >= totalChars,
    reset,
  };
}
