import { useRef, useMemo } from "react";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import GLASS_VERT from "../shaders/glass.vert?raw";
import GLASS_FRAG from "../shaders/glass.frag?raw";

/* ── Custom shader material ── */
const GlassShaderMaterial = shaderMaterial(
  {
    u_content: null as THREE.Texture | null,
    u_contentResolution: new THREE.Vector2(1, 1),
    u_glassSize: new THREE.Vector2(1, 1),
    u_glassRadius: 0.12,
    u_refractionAmount: 0.025,
    u_chromaticAberration: 0.05,
    u_time: 0,
  },
  GLASS_VERT,
  GLASS_FRAG,
);

extend({ GlassShaderMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      glassShaderMaterial: any;
    }
  }
}

/* ── Props ── */
export interface GlassSurfaceProps {
  contentTexture: THREE.Texture;
  glassWidth: number;
  glassHeight: number;
  glassRadius?: number;
  refractionAmount?: number;
  chromaticAberration?: number;
}

/**
 * Full-screen glass plane.
 *
 * Shader layers (inspired by Kyant0/AndroidLiquidGlass):
 *   1. SDF rounded rect → glass boundary
 *   2. Three-region masking → body / inner-edge / outer-rim
 *   3. Content magnification → subtle lens effect
 *   4. 7-layer chromatic dispersion → rainbow edge fringing
 *   5. 5×5 Gaussian blur → frosted glass body
 *   6. Schlick Fresnel → edge reflections
 *   7. Directional lighting → top glow + bottom shade
 *   8. Procedural environment reflection → sky/ground
 *   9. Glass rim darkness → thickness illusion
 *   10. discard outside → Electron desktop transparency
 */
export default function GlassSurface({
  contentTexture,
  glassWidth,
  glassHeight,
  glassRadius = 0.12,
  refractionAmount = 0.025,
  chromaticAberration = 0.05,
}: GlassSurfaceProps) {
  const materialRef = useRef<any>(null);

  const resolutionVec = useMemo(
    () => new THREE.Vector2(glassWidth, glassHeight),
    [glassWidth, glassHeight],
  );

  const glassSizeVec = useMemo(
    () => new THREE.Vector2(glassWidth, glassHeight),
    [glassWidth, glassHeight],
  );

  return (
    <mesh>
      <planeGeometry args={[glassWidth, glassHeight]} />
      <glassShaderMaterial
        ref={materialRef}
        u_content={contentTexture}
        u_contentResolution={resolutionVec}
        u_glassSize={glassSizeVec}
        u_glassRadius={glassRadius}
        u_refractionAmount={refractionAmount}
        u_chromaticAberration={chromaticAberration}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
