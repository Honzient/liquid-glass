/* ──────────────────────────────────────────────────────────────
   Fluid Body Shader — renders water inside the glass tank.
   5-wave Gerstner summation + depth gradient + caustic sim
   + crest specular + volumetric light rays.

   Uniforms:
     u_time   — elapsed seconds (drives wave animation)
     u_bass   — 0–1  low-frequency audio energy → wave amplitude
     u_energy — 0–1  mid-frequency energy → wave speed
     u_treble — 0–1  high-frequency energy → detail ripple
     u_volume — 0–1  overall RMS volume → specular boost
   ───────────────────────────────────────────────────────────── */

uniform float u_time;
uniform float u_bass;
uniform float u_energy;
uniform float u_treble;
uniform float u_volume;
varying vec2 vUv;

/* ── Gerstner wave component ── */
vec2 gerstner(vec2 p, vec2 dir, float amp, float freq, float speed, float steep, float t) {
  float phase = freq * dot(dir, p) + t * speed;
  return vec2(dir.x * steep * amp * cos(phase), amp * sin(phase));
}

void main() {
  vec2 uv = vUv;

  /* ── Idle floor: waves never fully still ── */
  float idleFloor = 0.18;

  /* ── Audio-driven amplitude / speed ── */
  float bassBlend   = max(idleFloor, u_bass);
  float energyBlend = max(idleFloor, u_energy);
  float trebleBlend = max(idleFloor, u_treble);
  float volBoost    = 1.0 + u_volume * 0.6;

  /* ── Wave amplitudes ── */
  float a1 = 0.045 * bassBlend;
  float a2 = 0.028 * bassBlend;
  float a3 = 0.020 * energyBlend;
  float a4 = 0.010 * trebleBlend;
  float a5 = 0.005 * trebleBlend * 0.7;

  /* ── Wave speeds ── */
  float sp1 = 0.7 + u_energy * 0.8;
  float sp2 = 1.1 + u_energy * 1.0;
  float sp3 = 1.4 + u_energy * 1.2;
  float sp4 = 2.0 + u_energy * 1.5;
  float sp5 = 2.6 + u_energy * 1.8;

  /* ── 5-wave Gerstner summation ── */
  vec2 disp = vec2(0.0);
  float h = 0.0;
  vec2 w;

  w = gerstner(uv, normalize(vec2( 1.00,  0.00)), a1,  6.0, sp1, 0.50, u_time);
  disp += w; h += w.y;
  w = gerstner(uv, normalize(vec2( 0.85,  0.12)), a2, 11.0, sp2, 0.42, u_time + 1.7);
  disp += w; h += w.y;
  w = gerstner(uv, normalize(vec2( 0.72, -0.08)), a3, 17.0, sp3, 0.36, u_time + 3.1);
  disp += w; h += w.y;
  w = gerstner(uv, normalize(vec2( 0.88,  0.25)), a4, 32.0, sp4, 0.24, u_time + 4.6);
  disp += w; h += w.y;
  w = gerstner(uv, normalize(vec2( 0.55, -0.28)), a5, 50.0, sp5, 0.17, u_time + 5.9);
  disp += w; h += w.y;

  float waveY = 0.50 + h;

  /* ── Water body palette ── */
  vec3 shallow = vec3(0.045, 0.20, 0.38);
  vec3 mid     = vec3(0.025, 0.12, 0.28);
  vec3 deep    = vec3(0.012, 0.05, 0.14);
  vec3 abyss   = vec3(0.008, 0.025, 0.08);

  /* ── Pixel under water? ── */
  float inWater = step(uv.y, waveY);

  /* ── Depth (normalized, 0 at surface, 1 at bottom) ── */
  float depth = clamp(1.0 - uv.y / max(waveY, 0.01), 0.0, 1.0);

  /* ── Depth-graded water color ── */
  vec3 waterColor = mix(shallow, mid, smoothstep(0.0, 0.25, depth));
  waterColor = mix(waterColor, deep, smoothstep(0.25, 0.60, depth));
  waterColor = mix(waterColor, abyss, smoothstep(0.60, 1.0, depth));

  /* ── Volumetric light: rays fade with depth ── */
  float lightRay = exp(-depth * 2.5) * 0.12;
  waterColor += lightRay * vec3(0.10, 0.25, 0.50);

  /* ── Crest glow (broad) ── */
  float crestDist = abs(uv.y - waveY);
  float crestGlow = exp(-crestDist * 80.0) * (0.30 + u_volume * 0.30) * volBoost;
  waterColor = mix(waterColor, vec3(0.18, 0.50, 0.85), crestGlow);

  /* ── Crest specular (sharp line) ── */
  float specLine = exp(-crestDist * 220.0) * (0.40 + u_volume * 0.45) * volBoost;
  waterColor = mix(waterColor, vec3(0.50, 0.80, 1.00), specLine);

  /* ── Caustic light interference ── */
  float caustic  = sin(uv.x * 140.0 + u_time * 0.55) * cos(uv.y * 100.0 - u_time * 0.40);
  caustic += sin(uv.x *  80.0 - u_time * 0.35) * cos(uv.y *  65.0 + u_time * 0.50);
  caustic += sin(uv.x * 190.0 + u_time * 0.70) * cos(uv.y * 150.0 - u_time * 0.55);
  caustic = caustic * 0.5 + 0.5;
  float causticStr = inWater * (1.0 - depth) * lightRay * (0.6 + u_volume * 0.8);
  waterColor += caustic * causticStr * vec3(0.20, 0.50, 0.80);

  /* ── Sub-surface scattering hint (shallow water glows) ── */
  float sss = exp(-depth * 1.8) * inWater * 0.06;
  waterColor += sss * vec3(0.15, 0.35, 0.60);

  /* ── Bottom gradient (darkens toward tank floor) ── */
  float bottomFade = smoothstep(0.0, 0.22, uv.y) * inWater;
  waterColor = mix(waterColor * 0.22, waterColor, bottomFade);

  /* ── Above water: dark tank interior ── */
  float aboveWater = 1.0 - inWater;
  vec3 tankInterior = vec3(0.004, 0.010, 0.025);
  // Subtle gradient: darker at top (away from water)
  tankInterior = mix(tankInterior, tankInterior * 0.5, smoothstep(0.50, 1.0, uv.y));
  // Faint reflection of water surface above
  float aboveRefl = exp(-abs(uv.y - waveY) * 35.0) * aboveWater * 0.06;
  tankInterior += aboveRefl * vec3(0.10, 0.25, 0.50);

  vec3 color = mix(tankInterior, waterColor, inWater);

  gl_FragColor = vec4(color, 1.0);
}
