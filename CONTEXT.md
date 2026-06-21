# CONTEXT — Liquid Glass Lyrics (Spotify Desktop App)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Electron Transparent Window             │
│  ┌───────────────────────────────────────────────┐   │
│  │         HTML Overlay (ControlPanel)            │   │
│  ├───────────────────────────────────────────────┤   │
│  │           R3F Canvas (alpha:true)              │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │        GlassSurface (full-screen quad)   │   │   │
│  │  │  SDF rounded rect + Fresnel + 7-layer   │   │   │
│  │  │  chromatic dispersion + bevel highlights│   │   │
│  │  │  discard outside → desktop shows through │   │   │
│  │  └──────────────┬──────────────────────────┘   │   │
│  │                 │ u_content (sampler2D)          │   │
│  │  ┌──────────────▼──────────────────────────┐   │   │
│  │  │         FBO (2048×2048)                   │   │   │
│  │  │  ┌────────────────────────────────────┐  │   │   │
│  │  │  │ FluidBody (Gerstner wave plane)    │  │   │   │
│  │  │  │ - 5-wave Gerstner summation        │  │   │   │
│  │  │  │ - Depth-based water color gradient │  │   │   │
│  │  │  │ - Crest specular + caustic sim     │  │   │   │
│  │  │  │ - Audio-reactive (bass/energy/trbl)│  │   │   │
│  │  │  ├────────────────────────────────────┤  │   │   │
│  │  │  │ LyricsText (CanvasTexture plane)   │  │   │   │
│  │  │  │ - Glass-etch emboss rendering      │  │   │   │
│  │  │  │ - Typewriter character reveal      │  │   │   │
│  │  │  │ - Centered above wave surface      │  │   │   │
│  │  │  └────────────────────────────────────┘  │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Glossary

### Visual Layer

- **LiquidTank (液态缸)** — Root orchestrator component. Owns FBO, audio data flow, and renders GlassSurface with the FBO texture.
- **GlassSurface (玻璃表面)** — Full-screen plane with custom shaderMaterial. Applies SDF rounded-rect mask, Fresnel edge reflections, 7-layer chromatic dispersion, and bevel specular highlights. Discards fragments outside the SDF boundary for true Electron transparency.
- **FluidBody (流体体积)** — FBO content shader rendering procedural water. Uses 5-wave Gerstner summation for realistic fluid dynamics. Renders depth-graded water coloring, crest specular highlights, and caustic-like light interference.
- **LyricsText (歌词文字)** — CanvasTexture-based text plane rendered inside the FBO scene. Uses emboss/deboss effect for "glass-burned" typography. Controlled by a typewriter animation hook.
- **FBO (帧缓冲)** — 2048×2048 off-screen render target. Contains the FluidBody wave scene and LyricsText. Sampled by GlassSurface as `u_content`.
- **ControlPanel (控制面板)** — HTML/CSS overlay positioned above the WebGL canvas via z-index. Contains Bass/Energy/Treble sliders and audio source selector.

### Wave Dynamics

- **Gerstner Wave (Gerstner 波浪)** — Physically-based ocean wave model. Each wave component contributes horizontal displacement (steepness) plus vertical displacement (height). `x += Q*A*cos(freq*dot(dir,pos) + time*speed)`, `y += A*sin(...)`. More realistic than pure sine — produces sharper crests and flatter troughs.
- **Wave Quintet (五波叠加)** — Five Gerstner components: primary swell (bass-driven), secondary roll, cross swell, detail ripple (treble-driven), micro detail. Each has distinct direction, frequency, amplitude, steepness, and phase.
- **Idle Breeze (静音微风)** — Minimum 10-15% amplitude even with zero audio input. Prevents dead-flat water surface. All wave speeds have a base multiplier of 0.3× when audio is silent.
- **Crest Specular (波峰高光)** — Exponential falloff `exp(-dist * k)` at wave crests. Two layers: broad crest glow (k=80) and sharp specular line (k=200). Intensity modulated by u_volume.
- **Caustic Simulation (焦散模拟)** — Interference pattern from crossed sinusoids `sin(x·f1) * cos(y·f2)` modulated in time. Subtle (8% blend) only in shallow water region.

### Optical Layer

- **SDF Rounded Rect (符号距离函数圆角矩形)** — Defines the glass boundary. `sd = length(max(abs(p)-halfSize+radius,0)) + min(max(px,py),0) - radius`. sd > 0 → outside glass → discard.
- **Fresnel Reflectance (菲涅尔反射)** — Schlick approximation: `R(θ) = R₀ + (1-R₀)(1-cosθ)⁵` where R₀ = ((1-IOR)/(1+IOR))² and IOR = 1.5. Increases reflectivity at grazing angles (near glass edges).
- **Chromatic Dispersion 7-Layer (七层色散)** — Wavelength-dependent texture sampling offsets: Red (offset×1.00), Orange (0.83), Yellow (0.67), Green (0, center), Cyan (-0.17), Blue (-0.33), Violet (-0.50). Each layer weighted by its spectral contribution. Final result blended with center sample to prevent oversaturation.
- **Bevel Highlight (倒角高光)** — `dot(normal, lightDir) * 0.5 + 0.5` masked by edge proximity. Simulates light catching the beveled glass edge.
- **u_treble Dual Mapping (u_treble 双重映射)** — (1) Physical: drives detail wave amplitude in FluidBody; (2) Optical: modulates `u_chromaticAberration` in GlassSurface (base 0.04, peak 0.18). Creates high-frequency color fringing that dances with the music.

### Audio Pipeline

- **AudioEngine (音频引擎)** — Singleton class managing Web Audio API context, AnalyserNode (FFT size 2048), and audio source. Supports three modes: demo (simulated rhythms), microphone, system audio loopback. Extracts frequency bands: bass (20-250Hz), energy (250-2000Hz), treble (2000-20000Hz).
- **Demo Mode (演示模式)** — Simulated audio using OscillatorNode + LFO. Bass: 55Hz sine with rhythmic gain envelope (simulated kick). Mid: 440Hz triangle with slow sweep. High: white noise with periodic bursts. No real audio source required — waves dance automatically.
- **Frequency Bands (频段)** — bass = RMS of FFT bins 0-25 (20-250Hz). energy = RMS of bins 26-200 (250-2000Hz). treble = RMS of bins 201-1024 (2000-20000Hz). All values smoothed with exponential moving average (α=0.15).
- **Beat Detection (节拍检测)** — Bass energy exceeds 1.4× the trailing average → beat trigger. Cooldown of 200ms prevents double-triggers.

### Lyrics System

- **Typewriter Effect (打字机效果)** — Characters revealed one at a time at configurable speed (default 80ms/char). Uses useTypewriter hook with requestAnimationFrame-driven timer.
- **Glass-Etch Text (玻璃烧制文字)** — Canvas 2D rendering technique: shadow offset (+2,+2) for depth, highlight offset (-1,-1) for raised edge, main text in semi-transparent white, outer glow with blue tint. Creates appearance of text embossed into glass.
- **Text Placement (文字定位)** — Plane centered at origin in FBO space, Y offset +0.15 above wave midline. Width ≈ 0.7, height ≈ 0.14 (proportional to viewport). Rendered with transparent background so fluid waves show through.

### Platform

- **Electron Window (电子窗口)** — Frameless, transparent, 1024×600 default, resizable. `transparent: true`, `frame: false`, `hasShadow: false`. macOS: compatible but untested.
- **R3F Canvas (React Three Fiber 画布)** — `alpha: true`, `premultipliedAlpha: true`. Camera: perspective FOV 12° at [0,0,20] for near-orthographic side view.
- **Shader Pipeline (着色器管线)** — Custom shaderMaterial (drei utility) for both GlassSurface and FluidBody. No CSM dependency in critical path (kept as optional enhancement). Uniforms flow: AudioEngine → React state → useFrame → shaderMaterial.uniforms.
- **Target Platform** — Windows 11, Electron 33, Vite 6, React 18, Three.js 0.170, R3F 8.17, Drei 9.117. 60fps target.

### Future Integration

- **Spotify Web Playback SDK** — Will provide real audio source replacing demo oscillators. Connect to AudioEngine via MediaElementAudioSourceNode.
- **Spotify Lyrics API** — Will supply timed lyrics text for typewriter display. Current state uses placeholder text.
- **System Audio Loopback** — WASAPI loopback capture via `navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'desktop' } } })`. Requires Electron `desktopCapturer` integration.
