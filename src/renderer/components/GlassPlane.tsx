import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const GlassShaderMaterial = shaderMaterial(
  {
    u_content: null as THREE.Texture | null,
    u_contentResolution: new THREE.Vector2(1, 1),
    u_glassSize: new THREE.Vector2(1, 1),
    u_glassRadius: 0.05,
    u_refractionAmount: 0.025,
    u_chromaticAberration: 0.06,
    u_time: 0,
  },
  /* vertex */
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  /* fragment */
  `
  uniform sampler2D u_content;
  uniform vec2 u_contentResolution;
  uniform vec2 u_glassSize;
  uniform float u_glassRadius;
  uniform float u_refractionAmount;
  uniform float u_chromaticAberration;
  varying vec2 vUv;

  float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + r;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
  }

  vec2 gradSdRoundedRect(vec2 p, vec2 b, float r) {
    const float eps = 0.0005;
    return vec2(
      sdRoundedRect(p + vec2(eps, 0.0), b, r) - sdRoundedRect(p - vec2(eps, 0.0), b, r),
      sdRoundedRect(p + vec2(0.0, eps), b, r) - sdRoundedRect(p - vec2(0.0, eps), b, r)
    ) / (2.0 * eps);
  }

  vec3 dispersion7Layer(sampler2D tex, vec2 uv, vec2 dir, float strength) {
    vec3 color = vec3(0.0);
    float s = strength;
    color.r += texture2D(tex, uv + dir * s * 1.00).r;
    color += texture2D(tex, uv + dir * s * 0.83).rgb * vec3(1.0, 0.55, 0.0) * 0.15;
    color += texture2D(tex, uv + dir * s * 0.67).rgb * vec3(1.0, 1.0, 0.0) * 0.10;
    color.g += texture2D(tex, uv).g;
    color += texture2D(tex, uv + dir * s * -0.17).rgb * vec3(0.0, 1.0, 1.0) * 0.10;
    color += texture2D(tex, uv + dir * s * -0.33).rgb * vec3(0.0, 0.5, 1.0) * 0.15;
    color.b += texture2D(tex, uv + dir * s * -0.50).b;
    vec3 center = texture2D(tex, uv).rgb;
    return mix(center, color, strength);
  }

  void main() {
    vec2 uv = vUv;
    vec2 halfSize = u_glassSize * 0.5;
    vec2 position = (uv - 0.5) * u_glassSize;

    float sd = sdRoundedRect(position, halfSize, u_glassRadius);

    if (sd > 0.0) {
      discard;
    }

    vec2 grad = gradSdRoundedRect(position, halfSize, u_glassRadius);
    vec2 normal = length(grad) > 0.001 ? normalize(grad) : vec2(0.0, 1.0);

    float dist = clamp(abs(sd) / u_glassRadius, 0.0, 1.0);
    float refractionStrength = u_refractionAmount * (1.0 - dist);
    vec2 offset = normal * refractionStrength;

    vec3 refractedColor = dispersion7Layer(u_content, uv, offset, u_chromaticAberration);

    float edge = 1.0 - smoothstep(0.0, 1.0, dist);
    vec2 lightDir = normalize(vec2(0.6, 0.8));
    float bevel = dot(normal, lightDir) * 0.5 + 0.5;
    float highlight = edge * (0.06 + bevel * 0.22);

    vec3 color = refractedColor + highlight * vec3(1.0, 0.97, 0.85);
    color = mix(color, color * vec3(0.95, 0.98, 1.05), edge * 0.25);

    gl_FragColor = vec4(color, 1.0);
  }`
);

extend({ GlassShaderMaterial });

// Type declaration for the custom JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      glassShaderMaterial: any;
    }
  }
}

interface GlassPlaneProps {
  contentTexture: THREE.Texture;
  glassWidth: number;
  glassHeight: number;
  glassRadius: number;
  refractionAmount: number;
  chromaticAberration: number;
}

export default function GlassPlane({
  contentTexture,
  glassWidth,
  glassHeight,
  glassRadius,
  refractionAmount,
  chromaticAberration,
}: GlassPlaneProps) {
  const materialRef = useRef<any>(null);

  const resolutionVec = useMemo(
    () => new THREE.Vector2(glassWidth, glassHeight),
    [glassWidth, glassHeight]
  );

  const glassSizeVec = useMemo(
    () => new THREE.Vector2(glassWidth, glassHeight),
    [glassWidth, glassHeight]
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value += delta;
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
