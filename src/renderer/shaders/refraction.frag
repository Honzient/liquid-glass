uniform sampler2D u_content;
uniform vec2 u_resolution;
uniform vec2 u_glassSize;
uniform float u_glassRadius;
uniform float u_refractionAmount;
uniform float u_chromaticAberration;
varying vec2 vUv;

/* ── SDF: rounded rectangle ── */
float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 d = abs(p) - halfSize + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

/* ── numerical gradient of the SDF ── */
vec2 gradSdRoundedRect(vec2 p, vec2 halfSize, float r) {
  const float eps = 0.001;
  return vec2(
    sdRoundedRect(p + vec2(eps, 0.0), halfSize, r) -
    sdRoundedRect(p - vec2(eps, 0.0), halfSize, r),
    sdRoundedRect(p + vec2(0.0, eps), halfSize, r) -
    sdRoundedRect(p - vec2(0.0, eps), halfSize, r)
  ) / (2.0 * eps);
}

/* ── 7-layer chromatic dispersion ── */
vec3 dispersion7Layer(sampler2D tex, vec2 uv, vec2 dir, float strength) {
  vec3 color = vec3(0.0);
  float s = strength;

  // Red layer   — outermost refraction
  color.r += texture2D(tex, uv + dir * s * 1.00).r;

  // Orange layer
  color += texture2D(tex, uv + dir * s * 0.83).rgb * vec3(1.0, 0.55, 0.0) * 0.15;

  // Yellow layer
  color += texture2D(tex, uv + dir * s * 0.67).rgb * vec3(1.0, 1.0, 0.0) * 0.10;

  // Green layer — center
  color.g += texture2D(tex, uv).g;

  // Cyan layer
  color += texture2D(tex, uv + dir * s * -0.17).rgb * vec3(0.0, 1.0, 1.0) * 0.10;

  // Blue layer
  color += texture2D(tex, uv + dir * s * -0.33).rgb * vec3(0.0, 0.5, 1.0) * 0.15;

  // Violet layer — innermost refraction
  color.b += texture2D(tex, uv + dir * s * -0.50).b;

  // Blend towards center sample to avoid over-saturation
  vec3 center = texture2D(tex, uv).rgb;
  color = mix(center, color, strength);

  return color;
}

void main() {
  vec2 uv = vUv;

  // Transform UV to centered coordinates (origin at viewport centre)
  vec2 position = (uv - 0.5) * u_resolution;

  vec2 halfSize = u_glassSize * 0.5;

  // SDF distance to the rounded-rect glass boundary
  float sd = sdRoundedRect(position, halfSize, u_glassRadius);

  // Outside the glass → fully transparent (Electron desktop shows through)
  if (sd > 0.0) {
    discard;
  }

  // Numerical gradient → per-pixel normal of the glass surface
  vec2 grad = gradSdRoundedRect(position, halfSize, u_glassRadius);
  vec2 normal = normalize(grad);

  // Refraction offset proportional to gradient magnitude at the edge
  float refractionStrength = u_refractionAmount * abs(sd) / u_glassRadius;
  refractionStrength = clamp(refractionStrength, 0.0, u_refractionAmount);
  vec2 offset = normal * refractionStrength;

  // 7-layer chromatic dispersion
  vec3 refractedColor = dispersion7Layer(u_content, uv, offset, u_chromaticAberration);

  // ── Edge highlight ──
  float edgeDist = abs(sd) / u_glassRadius;
  float edge = 1.0 - smoothstep(0.0, 1.0, edgeDist);

  // Bevel specular based on light direction vs surface normal
  vec2 lightDir = normalize(vec2(0.6, 0.8));
  float bevel = dot(normal, lightDir) * 0.5 + 0.5;
  float highlight = edge * (0.08 + bevel * 0.25);

  vec3 color = refractedColor + highlight * vec3(1.0, 0.97, 0.85);

  // Subtle glass tint (faint blue-cyan)
  color = mix(color, color * vec3(0.95, 0.98, 1.05), edge * 0.3);

  gl_FragColor = vec4(color, 1.0);
}
