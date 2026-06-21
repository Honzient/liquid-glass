/* ──────────────────────────────────────────────────────────────
   Liquid Glass Surface Shader
   Technique adapted from Kyant0's AndroidLiquidGlass (AGSL)
   re-implemented in GLSL for WebGL / Three.js

   Layers:
     1. Superellipse SDF → glass boundary mask
     2. Three-region masking → body / inner-edge / outer-rim
     3. Content magnification → subtle lens effect
     4. 7-layer chromatic dispersion → rainbow fringing at edges
     5. 5×5 blur → frosted glass body
     6. Schlick Fresnel → edge reflections
     7. Directional lighting → top glow + bottom shade
     8. Procedural environment reflection → sky/ground on surface
     9. Glass rim darkness → thickness illusion
   ───────────────────────────────────────────────────────────── */

uniform sampler2D u_content;
uniform vec2      u_contentResolution;
uniform vec2      u_glassSize;
uniform float     u_glassRadius;
uniform float     u_refractionAmount;
uniform float     u_chromaticAberration;
uniform float     u_time;
varying vec2      vUv;

/* ── SDF: rounded rectangle ── */
float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

/* ── Numerical gradient of SDF → surface normal ── */
vec2 sdGradient(vec2 p, vec2 b, float r) {
  const float eps = 0.0005;
  return vec2(
    sdRoundedRect(p + vec2(eps, 0.0), b, r) - sdRoundedRect(p - vec2(eps, 0.0), b, r),
    sdRoundedRect(p + vec2(0.0, eps), b, r) - sdRoundedRect(p - vec2(0.0, eps), b, r)
  ) / (2.0 * eps);
}

/* ── Schlick Fresnel approximation ── */
float schlickFresnel(float cosTheta, float ior) {
  float r0 = (1.0 - ior) / (1.0 + ior);
  r0 *= r0;
  return r0 + (1.0 - r0) * pow(1.0 - abs(cosTheta), 5.0);
}

/* ── 7-layer chromatic dispersion ──
   Red (long wavelength) refracted most → outermost fringe
   Violet (short wavelength) refracted least → innermost fringe
   Green at center — no displacement.                                      */
vec3 dispersion7(sampler2D tex, vec2 uv, vec2 dir, float strength) {
  vec3 c = vec3(0.0);
  float s = strength;

  c.r += texture2D(tex, uv + dir * s *  1.00).r;                          // Red
  c   += texture2D(tex, uv + dir * s *  0.83).rgb * vec3(1.0,0.55,0.0)*0.15; // Orange
  c   += texture2D(tex, uv + dir * s *  0.67).rgb * vec3(1.0,1.0,0.0)*0.10; // Yellow
  c.g += texture2D(tex, uv).g;                                              // Green (center)
  c   += texture2D(tex, uv + dir * s * -0.17).rgb * vec3(0.0,1.0,1.0)*0.10; // Cyan
  c   += texture2D(tex, uv + dir * s * -0.33).rgb * vec3(0.0,0.5,1.0)*0.15; // Blue
  c.b += texture2D(tex, uv + dir * s * -0.50).b;                           // Violet

  return c;
}

/* ── 5×5 Gaussian blur (sigma ≈ 1.0) ── */
vec3 blur5(sampler2D tex, vec2 uv, vec2 texel, float radius) {
  float k[5];
  k[0] = 0.06136; k[1] = 0.24477; k[2] = 0.38774; k[3] = 0.24477; k[4] = 0.06136;

  vec3 color = vec3(0.0);
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      float w = k[x+2] * k[y+2];
      color += texture2D(tex, uv + vec2(float(x), float(y)) * texel * radius).rgb * w;
    }
  }
  return color;
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════════════ */
void main() {
  vec2 uv = vUv;
  vec2 halfSize = u_glassSize * 0.5;
  vec2 position = (uv - 0.5) * u_glassSize;

  /* ── 1. Glass boundary (SDF) ── */
  float sd = sdRoundedRect(position, halfSize, u_glassRadius);

  /* ── 2. Edge distance (0 = deep inside, 1 = at boundary, >1 = outside) ── */
  float edgeT = clamp(sd / u_glassRadius, -0.05, 1.1);

  /* ── 3. Three-region masking (AndroidLiquidGlass technique) ── */
  float glassBody  = 1.0 - smoothstep(-0.05, 0.50, edgeT);               // inner 50%
  float innerEdge  = smoothstep(0.35, 0.65, edgeT) *
                     (1.0 - smoothstep(0.60, 0.90, edgeT));               // bevel region
  float outerRim   = smoothstep(0.75, 1.02, edgeT);                       // thickness rim
  float inGlass    = step(edgeT, 1.02);                                    // anywhere inside

  /* ── Discard outside glass → desktop shows through ── */
  if (edgeT > 1.02) { discard; }

  /* ── 4. Surface normal (from SDF gradient) ── */
  vec2 grad = sdGradient(position, halfSize, u_glassRadius);
  vec2 N = length(grad) > 0.001 ? normalize(grad) : vec2(0.0, 1.0);

  /* ── 5. Content magnification (lens effect, strongest at center) ── */
  float distFromCenter = length(position / halfSize);
  float mag = 1.0 + u_refractionAmount * 0.6 * (1.0 - distFromCenter) * glassBody;
  vec2 contentUV = (uv - 0.5) / mag + 0.5;

  /* ── 6. Refraction offset (stronger near edges) ── */
  float refrStrength = u_refractionAmount * smoothstep(0.15, 0.85, edgeT);
  vec2 refrOffset = N * refrStrength;

  /* ── 7. Chromatic dispersion (edges only) ── */
  float dispersionMask = smoothstep(0.25, 0.9, edgeT);
  float ca = u_chromaticAberration * dispersionMask;
  vec2 sampleUV = contentUV + refrOffset;
  vec3 sharpColor = dispersion7(u_content, sampleUV, N, ca);

  /* ── 8. Subtle blur (frosted glass body) ── */
  vec2 texel = 1.0 / u_contentResolution;
  vec3 blurColor = blur5(u_content, sampleUV, texel, 1.2);
  float blurBlend = innerEdge * 0.25 + outerRim * 0.45;
  vec3 contentColor = mix(sharpColor, blurColor, blurBlend);

  /* ── 9. Fresnel reflection ── */
  float viewAngle = mix(0.0, 0.88, smoothstep(0.0, 1.0, edgeT));
  float fresnel = schlickFresnel(viewAngle, 1.52);

  /* ── 10. Bevel specular highlight ── */
  vec2 lightDir = normalize(vec2(0.50, 0.78));
  float bevel = dot(N, lightDir) * 0.5 + 0.5;                             // remap to 0–1
  float bevelGlow = innerEdge * bevel * 0.45;

  /* ── 11. Vertical lighting gradient ── */
  float vert = position.y / halfSize.y;                                    // -1=bottom, 1=top
  float topGlow    = smoothstep(0.10, 0.80, vert) * inGlass * 0.06;
  float bottomShade = (1.0 - smoothstep(-0.75, 0.0, vert)) * inGlass * 0.09;

  /* ── 12. Procedural environment reflection ── */
  vec3 sky    = vec3(0.77, 0.87, 1.00);
  vec3 horizon = vec3(0.45, 0.55, 0.72);
  vec3 ground = vec3(0.12, 0.15, 0.28);
  float reflY = vert * 0.5 + 0.5;
  vec3 envRefl = mix(ground, horizon, smoothstep(0.28, 0.48, reflY));
  envRefl = mix(envRefl, sky, smoothstep(0.48, 0.82, reflY));

  /* ── 13. Glass rim darkness (thickness illusion) ── */
  float rimDark = outerRim * 0.55;

  /* ═════════════════════════════════════════════════════════════════
     COMPOSE
     ═════════════════════════════════════════════════════════════════ */
  vec3 color = contentColor;

  /* Environment reflection on glass surface (via Fresnel) */
  float envStrength = fresnel * smoothstep(0.20, 1.0, edgeT) * 0.50;
  color = mix(color, envRefl, envStrength);

  /* Bevel specular highlight (warm white) */
  color += bevelGlow * vec3(1.00, 0.95, 0.80);

  /* Top directional glow */
  color += topGlow * vec3(0.88, 0.94, 1.00);

  /* Bottom shade */
  color *= 1.0 - bottomShade;

  /* Glass body tint (optical glass: faint blue-green cast) */
  color = mix(color, color * vec3(0.93, 0.97, 1.04), innerEdge * 0.35);

  /* Outer rim — glass thickness appearance */
  color *= 1.0 - rimDark;

  /* Warm fringe at the extreme edge (chromatic fringe boost) */
  color += outerRim * 0.04 * vec3(0.9, 0.6, 0.3);

  gl_FragColor = vec4(color, 1.0);
}
