import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import GlassSurface from "./GlassSurface";
import { useViewport } from "../hooks/useViewport";
import { useAudioData } from "../hooks/useAudioData";
import { useTypewriter } from "../hooks/useTypewriter";
import { createTextTexture } from "../utils/textTexture";
import FLUID_VERT from "../shaders/fluid.vert?raw";
import FLUID_FRAG from "../shaders/fluid.frag?raw";

/* ── Constants ── */
const FBO_SIZE = 2048;
const PLACEHOLDER_TEXT = "like water through glass";

/* ── Imperative FBO content scene builder ── */
function buildFBOScene(
  textTex: THREE.Texture,
): {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  fluidMat: THREE.ShaderMaterial;
  textMat: THREE.MeshBasicMaterial;
  textPlane: THREE.Mesh;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#051525");

  // ── Fluid wave plane (full FBO) ──
  const fluidMat = new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0 },
      u_bass: { value: 0 },
      u_energy: { value: 0 },
      u_treble: { value: 0 },
      u_volume: { value: 0 },
    },
    vertexShader: FLUID_VERT,
    fragmentShader: FLUID_FRAG,
  });
  const fluidPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fluidMat);
  scene.add(fluidPlane);

  // ── Text plane (centered, in front of fluid) ──
  const textGeo = new THREE.PlaneGeometry(0.8, 0.16);
  const textMat = new THREE.MeshBasicMaterial({
    map: textTex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const textPlane = new THREE.Mesh(textGeo, textMat);
  textPlane.position.z = 0.05;
  scene.add(textPlane);

  // ── Orthographic camera for FBO ──
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 5;

  return { scene, camera, fluidMat, textMat, textPlane };
}

/* ── LiquidTank Component ── */
export default function LiquidTank() {
  const audio = useAudioData();
  const { worldWidth, worldHeight } = useViewport();
  const { gl } = useThree();
  const fbo = useFBO(FBO_SIZE, FBO_SIZE, {});

  // Typewriter for placeholder lyrics
  const { displayedText } = useTypewriter(PLACEHOLDER_TEXT, {
    speed: 8,
    loop: true,
    startDelay: 500,
  });

  // Initial texture (will be updated in useEffect)
  const initialTex = useMemo(() => createTextTexture(" "), []);

  // Refs for FBO scene objects
  const fboSceneRef = useRef<THREE.Scene | null>(null);
  const fboCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const fluidMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const textMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Build FBO scene once on mount
  useEffect(() => {
    const { scene, camera, fluidMat, textMat } = buildFBOScene(initialTex);
    fboSceneRef.current = scene;
    fboCameraRef.current = camera;
    fluidMatRef.current = fluidMat;
    textMatRef.current = textMat;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update text texture when typewriter reveals new characters
  useEffect(() => {
    const textMat = textMatRef.current;
    if (!textMat) return;

    const newTex = createTextTexture(displayedText || " ");
    if (textMat.map) textMat.map.dispose();
    textMat.map = newTex;
    textMat.needsUpdate = true;
  }, [displayedText]);

  // Render FBO each frame: update fluid uniforms → render
  useFrame(() => {
    const scene = fboSceneRef.current;
    const camera = fboCameraRef.current;
    const fluidMat = fluidMatRef.current;
    if (!scene || !camera) return;

    // Push audio data to fluid shader
    if (fluidMat) {
      fluidMat.uniforms.u_bass.value = audio.bass;
      fluidMat.uniforms.u_energy.value = audio.energy;
      fluidMat.uniforms.u_treble.value = audio.treble;
      fluidMat.uniforms.u_volume.value = audio.volume;
    }

    // Render FBO content
    gl.setRenderTarget(fbo);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
  });

  // Chromatic aberration: base 0.04, treble drives it up to 0.18
  const chromaticAberration = 0.04 + audio.treble * 0.14;

  return (
    <GlassSurface
      contentTexture={fbo.texture}
      glassWidth={worldWidth}
      glassHeight={worldHeight}
      glassRadius={0.15}
      refractionAmount={0.025}
      chromaticAberration={chromaticAberration}
    />
  );
}
