import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import GLASS_VERT from "../shaders/glass.vert?raw";
import GLASS_FRAG from "../shaders/glass.frag?raw";

/* ── Custom shader material (drei utility) ── */
const GlassShaderMaterial = shaderMaterial(
  {
    u_content: null as THREE.Texture | null,
    u_contentResolution: new THREE.Vector2(1, 1),
    u_glassSize: new THREE.Vector2(1, 1),
    u_glassRadius: 0.15,
    u_refractionAmount: 0.025,
    u_chromaticAberration: 0.06,
    u_time: 0,
  },
  GLASS_VERT,
  GLASS_FRAG,
);

extend({ GlassShaderMaterial });

/* ── JSX type declaration ── */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      glassShaderMaterial: any;
    }
  }
}

interface GlassSurfaceProps {
  contentTexture: THREE.Texture;
  glassWidth: number;
  glassHeight: number;
  glassRadius?: number;
  refractionAmount?: number;
  chromaticAberration?: number;
}

/**
 * Full-screen glass plane that applies:
 *   - SDF rounded-rect mask (discard outside → Electron transparency)
 *   - Fresnel edge reflections
 *   - 7-layer chromatic dispersion
 *   - Bevel specular highlights
 *
 * Samples the FBO texture (u_content) which contains the fluid waves + lyrics.
 */
export default function GlassSurface({
  contentTexture,
  glassWidth,
  glassHeight,
  glassRadius = 0.15,
  refractionAmount = 0.025,
  chromaticAberration = 0.06,
}: GlassSurfaceProps) {
  const materialRef = useRef<THREE.ShaderMaterial & {
    uniforms: Record<string, any>;
  }>(null);

  const resolutionVec = useMemo(
    () => new THREE.Vector2(glassWidth, glassHeight),
    [glassWidth, glassHeight],
  );

  const glassSizeVec = useMemo(
    () => new THREE.Vector2(glassWidth, glassHeight),
    [glassWidth, glassHeight],
  );

  // Update chromaticAberration uniform when prop changes
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_chromaticAberration.value = chromaticAberration;
    }
  });

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
