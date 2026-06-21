/* GlassSurface fragment shader — SDF mask + Fresnel + 7-layer chromatic dispersion */

uniform sampler2D u_content;
uniform vec2 u_contentResolution;
uniform vec2 u_glassSize;
uniform float u_glassRadius;
uniform float u_refractionAmount;
uniform float u_chromaticAberration;
uniform float u_time;
varying vec2 vUv;

/* ── SDF: rounded rectangle ── */
float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

/* ── Numerical gradient ── */
vec2 gradSdRoundedRect(vec2 p, vec2 b, float r) {
  const float eps = 0.0005;
  return vec2(
    sdRoundedRect(p + vec2(eps, 0.0), b, r) - sdRoundedRect(p - vec2(eps, 0.0), b, r),
    sdRoundedRect(p + vec2(0.0, eps), b, r) - sdRoundedRect(p - vec2(0.0, eps), b, r)
  ) / (2.0 * eps);
}

/* ── Schlick Fresnel ── */
float fresnelSchlick(float cosTheta, float ior) {
  float r0 = (1.0 - ior) / (1.0 + ior);
  r0 *= r0;
  return r0 + (1.0 - r0) * pow(1.0 - cosTheta, 5.0);
}

/* ── 7-layer chromatic dispersion ── */
vec3 dispersion7Layer(sampler2D tex, vec2 uv, vec2 dir, float strength) {
  vec3 color = vec3(0.0);
  float s = strength;

  // Red — outermost (longest wavelength, most refracted)
  color.r += texture2D(tex, uv + dir * s * 1.00).r;

  // Orange
  color += texture2D(tex, uv + dir * s * 0.83).rgb * vec3(1.0, 0.55, 0.0) * 0.15;

  // Yellow
  color += texture2D(tex, uv + dir * s * 0.67).rgb * vec3(1.0, 1.0, 0.0) * 0.10;

  // Green — center (reference wavelength)
  color.g += texture2D(tex, uv).g;

  // Cyan
  color += texture2D(tex, uv + dir * s * -0.17).rgb * vec3(0.0, 1.0, 1.0) * 0.10;

  // Blue
  color += texture2D(tex, uv + dir * s * -0.33).rgb * vec3(0.0, 0.5, 1.0) * 0.15;

  // Violet — innermost (shortest wavelength, least refracted)
  color.b += texture2D(tex, uv + dir * s * -0.50).b;

  return color;
}

void main() {
  vec2 uv = vUv;
  vec2 halfSize = u_glassSize * 0.5;
  vec2 position = (uv - 0.5) * u_glassSize;

  /* ── Glass boundary test ── */
  float sd = sdRoundedRect(position, halfSize, u_glassRadius);

  // Outside glass → transparent (desktop shows through)
  if (sd > 0.0) {
    discard;
  }

  /* ── Surface normal ── */
  vec2 grad = gradSdRoundedRect(position, halfSize, u_glassRadius);
  vec2 normal = length(grad) > 0.001 ? normalize(grad) : vec2(0.0, 1.0);

  /* ── Edge proximity ── */
  float dist = clamp(abs(sd) / u_glassRadius, 0.0, 1.0);

  /* ── Refraction offset (stronger near edges) ── */
  float refractionStrength = u_refractionAmount * (0.35 + 0.65 * dist);
  vec2 offset = normal * refractionStrength;

  /* ── Chromatic dispersion ── */
  vec3 refractedColor = dispersion7Layer(u_content, uv, offset, u_chromaticAberration);

  /* ── Fresnel edge reflection ── */
  float viewAngle = 1.0 - dist * 0.85;
  float fresnel = fresnelSchlick(viewAngle, 1.5);

  /* ── Edge highlight ── */
  float edge = 1.0 - smoothstep(0.0, 1.0, dist);
  vec2 lightDir = normalize(vec2(0.6, 0.8));
  float bevel = dot(normal, lightDir) * 0.5 + 0.5;
  float highlight = edge * (0.03 + bevel * 0.28);

  /* ── Compose ── */
  vec3 color = refractedColor;

  // Fresnel reflection at edges (cool white-blue)
  vec3 reflectionTint = vec3(0.82, 0.90, 1.0);
  color = mix(color, reflectionTint, fresnel * edge * 0.55);

  // Bevel specular highlight (warm)
  color += highlight * vec3(1.0, 0.97, 0.85);

  // Glass body tint near edges (faint blue-cyan)
  color = mix(color, color * vec3(0.92, 0.96, 1.05), edge * 0.35);

  gl_FragColor = vec4(color, 1.0);
}
