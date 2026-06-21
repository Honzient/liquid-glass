import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshPhysicalMaterial } from "three";
import CustomShaderMaterial from "three-custom-shader-material";

const VERTEX_SHADER = /* glsl */ `
  uniform float u_time;
  uniform float u_bass;
  uniform float u_energy;
  uniform float u_treble;
  uniform float u_boxHeight;

  float threshold = u_boxHeight * 0.5 - 0.05;
  if (position.y > threshold) {
    // Idle breeze amplitude (5-10% of max)
    float idleAmp = 0.008;

    // Bass-driven base swell amplitude
    float amp1 = idleAmp + u_bass * 0.12;

    // Secondary wave amplitude (phase-shifted for organic feel)
    float amp2 = idleAmp * 0.6 + u_bass * 0.06;

    // Treble-driven detail ripple amplitude
    float amp3 = idleAmp * 0.15 + u_treble * 0.04;

    // Energy-driven wave speeds
    float speed1 = 0.8 + u_energy * 0.5;
    float speed2 = 1.5 + u_energy * 0.8;
    float speed3 = 2.2 + u_energy * 1.2;

    // 3-wave triad along X axis (pure sine, no noise)
    float wave1 = sin(position.x * 0.5 + u_time * speed1) * amp1;
    float wave2 = sin(position.x * 1.2 + u_time * speed2 + 1.8) * amp2;
    float wave3 = sin(position.x * 2.5 + u_time * speed3 + 3.5) * amp3;

    transformed.y += wave1 + wave2 + wave3;
  }
`;

interface InnerBoxProps {
  width: number;
  height: number;
  depth: number;
}

export default function InnerBox({ width, height, depth }: InnerBoxProps) {
  const materialRef = useRef<any>(null);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_bass: { value: 0 },
      u_energy: { value: 0 },
      u_treble: { value: 0 },
      u_boxHeight: { value: height },
    }),
    [height]
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value += delta;
    }
  });

  return (
    <mesh>
      <boxGeometry args={[width, height, depth, 128, 1, 32]} />
      <CustomShaderMaterial
        ref={materialRef}
        baseMaterial={MeshPhysicalMaterial}
        vertexShader={VERTEX_SHADER}
        uniforms={uniforms}
        color="#051525"
        transmission={0.8}
        roughness={0.3}
        metalness={0}
        transparent={true}
        opacity={0.85}
        ior={1.33}
        thickness={0.5}
      />
    </mesh>
  );
}
