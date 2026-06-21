/* FluidBody fragment shader — 5-wave Gerstner summation + caustic simulation */

uniform float u_time;
uniform float u_bass;
uniform float u_energy;
uniform float u_treble;
uniform float u_volume;
varying vec2 vUv;

/* Gerstner wave: returns (x_offset, y_height) */
vec2 gerstner(vec2 p, vec2 dir, float amp, float freq, float speed, float steep, float t) {
  float phase = freq * dot(dir, p) + t * speed;
  return vec2(dir.x * steep * amp * cos(phase), amp * sin(phase));
}

void main() {
  vec2 uv = vUv;

  /* ── Audio-driven parameters ── */
  float idle = 0.15;
  float bassBlend  = max(idle, u_bass);
  float energyBlend = max(idle, u_energy);
  float trebleBlend = max(idle, u_treble);

  float a1 = 0.042 * bassBlend;
  float a2 = 0.026 * bassBlend;
  float a3 = 0.018 * energyBlend;
  float a4 = 0.008 * trebleBlend;
  float a5 = 0.004 * trebleBlend * 0.7;

  float s1 = 0.7 + u_energy * 0.8;
  float s2 = 1.1 + u_energy * 1.0;
  float s3 = 1.4 + u_energy * 1.2;
  float s4 = 2.0 + u_energy * 1.6;
  float s5 = 2.6 + u_energy * 2.0;

  /* ── 5-wave Gerstner summation ── */
  vec2 disp = vec2(0.0);
  float height = 0.0;

  vec2 w;

  w = gerstner(uv, normalize(vec2(1.0, 0.0)),   a1, 6.0,  s1, 0.50, u_time);
  disp += w;  height += w.y;

  w = gerstner(uv, normalize(vec2(0.85, 0.12)), a2, 11.0, s2, 0.42, u_time + 1.7);
  disp += w;  height += w.y;

  w = gerstner(uv, normalize(vec2(0.72, -0.08)), a3, 17.0, s3, 0.35, u_time + 3.1);
  disp += w;  height += w.y;

  w = gerstner(uv, normalize(vec2(0.9, 0.22)),  a4, 32.0, s4, 0.22, u_time + 4.6);
  disp += w;  height += w.y;

  w = gerstner(uv, normalize(vec2(0.55, -0.25)), a5, 50.0, s5, 0.15, u_time + 5.9);
  disp += w;  height += w.y;

  float waveY = 0.50 + height;

  /* ── Water body colors ── */
  vec3 waterShallow = vec3(0.04, 0.18, 0.35);
  vec3 waterMid     = vec3(0.02, 0.10, 0.25);
  vec3 waterDeep    = vec3(0.01, 0.04, 0.12);

  float inWater = step(uv.y, waveY);
  float depth = clamp(uv.y / max(waveY, 0.01), 0.0, 1.0);

  vec3 waterColor = mix(waterShallow, waterDeep, depth);
  waterColor = mix(waterColor, waterMid, smoothstep(0.25, 0.65, depth) * 0.55);

  /* ── Crest specular (two layers) ── */
  float crestDist = abs(uv.y - waveY);
  float crestGlow = exp(-crestDist * 80.0) * (0.35 + u_volume * 0.25);
  waterColor = mix(waterColor, vec3(0.18, 0.48, 0.85), crestGlow);

  float specLine = exp(-crestDist * 200.0) * (0.45 + u_volume * 0.40);
  waterColor = mix(waterColor, vec3(0.45, 0.75, 1.0), specLine);

  /* ── Caustic-like light interference ── */
  float caustic  = sin(uv.x * 130.0 + u_time * 0.6) * cos(uv.y * 95.0 - u_time * 0.4);
  caustic += sin(uv.x * 75.0 - u_time * 0.35) * cos(uv.y * 60.0 + u_time * 0.5);
  caustic = caustic * 0.5 + 0.5;
  caustic *= inWater * (1.0 - depth) * (0.04 + u_volume * 0.05);
  waterColor += caustic * vec3(0.25, 0.55, 0.85);

  /* ── Bottom shadow ── */
  float bottomLight = smoothstep(0.0, 0.2, uv.y) * inWater;
  waterColor = mix(waterColor * 0.25, waterColor, bottomLight);

  /* ── Above water: dark empty space ── */
  vec3 color = mix(vec3(0.005, 0.012, 0.03), waterColor, inWater);

  gl_FragColor = vec4(color, 1.0);
}
