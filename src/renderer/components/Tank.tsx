import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import GlassPlane from "./GlassPlane";
import { useViewport } from "../hooks/useViewport";

/* ── Utility: render text to a CanvasTexture ── */
function createTextTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 200;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 72px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 512, 100);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/* ── FBO content: wave shader ── */
const WAVE_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WAVE_FRAG = `
  uniform float u_time;
  uniform float u_bass;
  uniform float u_energy;
  uniform float u_treble;
  varying vec2 vUv;

  void main() {
    float amp1 = 0.035 + u_bass * 0.09;
    float amp2 = 0.018 + u_bass * 0.05;
    float amp3 = 0.008 + u_treble * 0.04;

    float speed1 = 0.8 + u_energy * 0.6;
    float speed2 = 1.5 + u_energy * 0.9;
    float speed3 = 2.2 + u_energy * 1.3;

    float wave1 = sin(vUv.x * 8.0  + u_time * speed1) * amp1;
    float wave2 = sin(vUv.x * 20.0 + u_time * speed2 + 1.8) * amp2;
    float wave3 = sin(vUv.x * 45.0 + u_time * speed3 + 3.5) * amp3;
    float waveY = 0.50 + wave1 + wave2 + wave3;

    vec3 waterDeep    = vec3(0.020, 0.051, 0.118);
    vec3 waterMid     = vec3(0.035, 0.110, 0.220);
    vec3 waterShallow = vec3(0.050, 0.160, 0.310);

    float inWater = step(vUv.y, waveY);
    float depth = clamp(vUv.y / max(waveY, 0.01), 0.0, 1.0);
    vec3 waterColor = mix(waterShallow, waterDeep, depth);

    float crest = smoothstep(0.035, 0.0, abs(vUv.y - waveY));
    waterColor = mix(waterColor, vec3(0.18, 0.45, 0.75), crest * 0.35);

    float specLine = smoothstep(0.010, 0.0, abs(vUv.y - waveY));
    waterColor = mix(waterColor, vec3(0.40, 0.70, 1.00), specLine * 0.50);

    vec3 color = mix(vec3(0.0), waterColor, inWater);
    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ── Scene ── */
const FBO_WIDTH = 2048;
const FBO_HEIGHT = 2048;

function Scene() {
  const { worldWidth, worldHeight } = useViewport();
  const { gl } = useThree();
  const fbo = useFBO(FBO_WIDTH, FBO_HEIGHT, {});

  // Imperative FBO scene
  const fboSceneRef = useRef<THREE.Scene | null>(null);
  const fboCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const waveMatRef = useRef<THREE.ShaderMaterial | null>(null);

  // Text texture (created once)
  const textTex = useMemo(() => createTextTexture("Liquid Glass"), []);

  // Build FBO content scene
  useEffect(() => {
    const fboScene = new THREE.Scene();
    fboScene.background = new THREE.Color("#051525");

    // Wave plane
    const waveMat = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_bass: { value: 0 },
        u_energy: { value: 0 },
        u_treble: { value: 0 },
      },
      vertexShader: WAVE_VERT,
      fragmentShader: WAVE_FRAG,
    });
    const wavePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), waveMat);
    fboScene.add(wavePlane);

    // Text plane (centered, slightly in front of wave plane)
    const textGeo = new THREE.PlaneGeometry(0.8, 0.16);
    const textMat = new THREE.MeshBasicMaterial({
      map: textTex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const textPlane = new THREE.Mesh(textGeo, textMat);
    textPlane.position.z = 0.05;
    fboScene.add(textPlane);

    // Orthographic camera for FBO
    const fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    fboCamera.position.z = 5;

    fboSceneRef.current = fboScene;
    waveMatRef.current = waveMat;
    fboCameraRef.current = fboCamera;
  }, [textTex]);

  // Render FBO each frame
  useFrame((_, delta) => {
    const fboScene = fboSceneRef.current;
    const fboCamera = fboCameraRef.current;
    const waveMat = waveMatRef.current;
    if (!fboScene || !fboCamera) return;

    // Update wave time
    if (waveMat) {
      waveMat.uniforms.u_time.value += delta;
    }

    gl.setRenderTarget(fbo);
    gl.render(fboScene, fboCamera);
    gl.setRenderTarget(null);
  });

  return (
    <>
      <GlassPlane
        contentTexture={fbo.texture}
        glassWidth={worldWidth}
        glassHeight={worldHeight}
        glassRadius={0.15}
        refractionAmount={0.025}
        chromaticAberration={0.06}
      />
    </>
  );
}

export default function Tank() {
  return <Scene />;
}
