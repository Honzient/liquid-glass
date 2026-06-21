import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import GlassSurface from "./GlassSurface";
import { useViewport } from "../hooks/useViewport";
import { createTextTexture } from "../utils/textTexture";
import FLUID_VERT from "../shaders/fluid.vert?raw";
import FLUID_FRAG from "../shaders/fluid.frag?raw";

/* ── Constants ── */
const FBO_SIZE = 2048;
const PLACEHOLDER_LYRICS = "—  lyrics  —";

/* ── Build the FBO content scene (imperative Three.js) ── */
function buildFBOScene(initialTextTex: THREE.Texture) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#051525");

  /* ── Fluid wave plane ── */
  const fluidMat = new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0 },
      u_bass: { value: 0.5 },     // idle demo value
      u_energy: { value: 0.5 },
      u_treble: { value: 0.5 },
      u_volume: { value: 0.5 },
    },
    vertexShader: FLUID_VERT,
    fragmentShader: FLUID_FRAG,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fluidMat));

  /* ── Lyrics text plane (centered, in front of water) ── */
  const textMat = new THREE.MeshBasicMaterial({
    map: initialTextTex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.14), textMat);
  textPlane.position.set(0, 0.10, 0.05);
  scene.add(textPlane);

  /* ── Orthographic camera ── */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5;

  return { scene, camera, fluidMat, textMat };
}

/* ═════════════════════════════════════════════════════════════════════
   LIQUID TANK — main orchestrator
   ═════════════════════════════════════════════════════════════════════ */
export default function LiquidTank() {
  const { worldWidth, worldHeight } = useViewport();
  const { gl } = useThree();
  const fbo = useFBO(FBO_SIZE, FBO_SIZE, {});

  /* ── Refs for imperative FBO scene ── */
  const fboSceneRef = useRef<THREE.Scene | null>(null);
  const fboCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const fluidMatRef = useRef<THREE.ShaderMaterial | null>(null);

  /* ── Initial text texture ── */
  const initialTex = useMemo(() => createTextTexture(PLACEHOLDER_LYRICS), []);

  /* ── Build FBO scene once ── */
  useEffect(() => {
    const { scene, camera, fluidMat } = buildFBOScene(initialTex);
    fboSceneRef.current = scene;
    fboCameraRef.current = camera;
    fluidMatRef.current = fluidMat;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Each frame: advance time → render FBO ── */
  useFrame((_, delta) => {
    const scene = fboSceneRef.current;
    const camera = fboCameraRef.current;
    const fluidMat = fluidMatRef.current;
    if (!scene || !camera) return;

    // Advance fluid animation
    if (fluidMat) {
      fluidMat.uniforms.u_time.value += delta;
      // TODO: connect u_bass / u_energy / u_treble / u_volume
      //       to real audio data via AudioInterface
    }

    gl.setRenderTarget(fbo);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
  });

  /* ── Glass optical parameters ── */
  const glassRadius = Math.min(worldWidth, worldHeight) * 0.06;

  return (
    <GlassSurface
      contentTexture={fbo.texture}
      glassWidth={worldWidth}
      glassHeight={worldHeight}
      glassRadius={glassRadius}
      refractionAmount={0.028}
      chromaticAberration={0.05}
    />
  );
}
