import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createTextTexture } from "../utils/textTexture";
import { useTypewriter } from "../hooks/useTypewriter";

interface LyricsTextProps {
  /** Full text to display (typewriter will reveal characters one at a time) */
  text: string;
  /** Characters per second for typewriter animation */
  typewriterSpeed?: number;
  /** Text plane width in world units */
  planeWidth?: number;
  /** Text plane height in world units */
  planeHeight?: number;
  /** Y position offset from center (default: 0.12, above wave midline) */
  yOffset?: number;
}

/**
 * A plane inside the FBO scene that renders glass-etched lyrics text.
 * Uses CanvasTexture with emboss effect + typewriter animation.
 * The plane has a transparent background so fluid waves show through.
 */
export default function LyricsText({
  text,
  typewriterSpeed = 12,
  planeWidth = 0.8,
  planeHeight = 0.16,
  yOffset = 0.12,
}: LyricsTextProps) {
  const { displayedText } = useTypewriter(text, { speed: typewriterSpeed });

  // Recreate texture whenever displayed text changes
  const texture = useMemo(
    () => createTextTexture(displayedText || " "), // space prevents empty canvas
    [displayedText],
  );

  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  return (
    <mesh position={[0, yOffset, 0.05]}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
