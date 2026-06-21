/**
 * AudioEngine — Web Audio API capture + analysis engine.
 *
 * Three modes:
 *   - "demo"  : simulated rhythmic audio (default, works without external source)
 *   - "mic"   : microphone input
 *   - "system": system audio loopback (WASAPI, requires Electron desktopCapturer)
 *
 * Output (per frame): { bass, energy, treble, volume, beat }
 * All values are smoothed with exponential moving average.
 */

export interface AudioFrame {
  bass: number;   // 0–1, low frequency energy (20–250 Hz)
  energy: number; // 0–1, mid frequency energy (250–2000 Hz)
  treble: number; // 0–1, high frequency energy (2000–20000 Hz)
  volume: number; // 0–1, overall RMS volume
  beat: boolean;  // true when bass exceeds 1.4× trailing average
}

type AudioSource = "demo" | "mic" | "system";

const FFT_SIZE = 2048;
const SMOOTHING = 0.15; // EMA α
const BEAT_THRESHOLD = 1.4;
const BEAT_COOLDOWN = 200; // ms

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioNode | null = null;
  private sourceType: AudioSource = "demo";
  private started = false;

  // Demo oscillators
  private demoNodes: AudioNode[] = [];
  private demoGain: GainNode | null = null;

  // FFT buffers (initialized empty, resized in start())
  private freqData = new Uint8Array(0);
  private timeData = new Float32Array(0);

  // Smoothed output
  bass = 0;
  energy = 0;
  treble = 0;
  volume = 0;

  // Beat detection state
  private bassHistory: number[] = [];
  private beatCooldown = 0;
  private _beat = false;

  // Band bin ranges (FFT_SIZE=2048, sample rate 44100 → bin width ~21.5Hz)
  private readonly BASS_LO = 1;
  private readonly BASS_HI = 12; // ~20–260 Hz
  private readonly ENERGY_LO = 13;
  private readonly ENERGY_HI = 93; // ~280–2000 Hz
  private readonly TREBLE_LO = 94;
  private readonly TREBLE_HI = 512; // ~2000–11000 Hz

  async start(source: AudioSource = "demo"): Promise<void> {
    if (this.started) return; // Idempotent
    this.started = true;
    this.sourceType = source;
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.4;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Float32Array(this.analyser.fftSize);

    if (source === "demo") {
      this.startDemo();
    } else if (source === "mic") {
      await this.startMic();
    } else if (source === "system") {
      await this.startSystem();
    }
  }

  /** Called every frame. Returns current audio frame. */
  update(dt: number): AudioFrame {
    if (!this.analyser) {
      return { bass: 0, energy: 0, treble: 0, volume: 0, beat: false };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getFloatTimeDomainData(this.timeData);

    // Compute band RMS
    const bassRaw = this.rms(this.freqData, this.BASS_LO, this.BASS_HI);
    const energyRaw = this.rms(this.freqData, this.ENERGY_LO, this.ENERGY_HI);
    const trebleRaw = this.rms(this.freqData, this.TREBLE_LO, this.TREBLE_HI);

    // Overall volume from time-domain
    let volSum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      volSum += this.timeData[i] * this.timeData[i];
    }
    const volumeRaw = Math.sqrt(volSum / this.timeData.length) * 4; // scale up

    // Exponential moving average smoothing
    const a = SMOOTHING;
    this.bass = this.bass + a * (bassRaw - this.bass);
    this.energy = this.energy + a * (energyRaw - this.energy);
    this.treble = this.treble + a * (trebleRaw - this.treble);
    this.volume = this.volume + a * (volumeRaw - this.volume);

    // Beat detection
    this.bassHistory.push(this.bass);
    if (this.bassHistory.length > 43) this.bassHistory.shift(); // ~1s history at 60fps

    const avgBass =
      this.bassHistory.reduce((a, b) => a + b, 0) / this.bassHistory.length;

    this.beatCooldown -= dt * 1000;
    if (this.bass > avgBass * BEAT_THRESHOLD && this.beatCooldown <= 0) {
      this._beat = true;
      this.beatCooldown = BEAT_COOLDOWN;
    } else {
      this._beat = false;
    }

    return {
      bass: this.bass,
      energy: this.energy,
      treble: this.treble,
      volume: this.volume,
      beat: this._beat,
    };
  }

  dispose(): void {
    this.started = false;
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.analyser = null;
    this.source = null;
    this.demoNodes = [];
    this.demoGain = null;
  }

  /* ── Private: RMS helper ── */
  private rms(data: Uint8Array, lo: number, hi: number): number {
    let sum = 0;
    const n = hi - lo + 1;
    for (let i = lo; i <= hi; i++) {
      const v = data[i] / 255;
      sum += v * v;
    }
    return Math.sqrt(sum / n);
  }

  /* ── Demo mode: simulated rhythmic audio ── */
  private startDemo(): void {
    if (!this.ctx || !this.analyser) return;

    // Master gain → analyser
    this.demoGain = this.ctx.createGain();
    this.demoGain.gain.value = 0.5;
    this.demoGain.connect(this.analyser);

    this.createDemoKick();
    this.createDemoSynth();
    this.createDemoHihat();
  }

  private createDemoKick(): void {
    if (!this.ctx || !this.demoGain) return;
    // Low-frequency pulse simulating kick drum at ~120 BPM
    const kickGain = this.ctx.createGain();
    kickGain.gain.value = 0;
    kickGain.connect(this.demoGain!);

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 55;
    osc.connect(kickGain);
    osc.start();

    // Rhythmic envelope: pulse every 500ms
    const now = this.ctx.currentTime;
    const interval = 0.5;
    for (let i = 0; i < 200; i++) {
      const t = now + i * interval;
      kickGain.gain.setValueAtTime(1.0, t);
      kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    }

    this.demoNodes.push(osc, kickGain);
  }

  private createDemoSynth(): void {
    if (!this.ctx || !this.demoGain) return;
    // Mid-frequency pad with slow sweep
    const synthGain = this.ctx.createGain();
    synthGain.gain.value = 0.15;
    synthGain.connect(this.demoGain!);

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 440;
    osc.connect(synthGain);

    // Slow frequency modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.3;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    osc.start();

    this.demoNodes.push(osc, lfo, lfoGain, synthGain);
  }

  private createDemoHihat(): void {
    if (!this.ctx || !this.demoGain) return;
    // High-frequency noise bursts
    const bufferSize = this.ctx.sampleRate * 0.05; // 50ms
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const now = this.ctx.currentTime;
    const interval = 0.25; // 16th notes at 120 BPM
    for (let i = 0; i < 800; i++) {
      const t = now + i * interval;
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = "highpass";
      bandpass.frequency.value = 4000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
      src.connect(bandpass);
      bandpass.connect(g);
      g.connect(this.demoGain!);
      src.start(t);
      src.stop(t + 0.05);
      this.demoNodes.push(src, bandpass, g);
    }
  }

  /* ── Microphone mode ── */
  private async startMic(): Promise<void> {
    if (!this.ctx || !this.analyser) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const micSource = this.ctx.createMediaStreamSource(stream);
    micSource.connect(this.analyser);
    this.source = micSource;
  }

  /* ── System audio loopback (WASAPI) ── */
  private async startSystem(): Promise<void> {
    if (!this.ctx || !this.analyser) return;
    // Attempt desktop audio capture (requires Electron with proper permissions)
    // Falls back to demo if unavailable
    try {
      const stream = await (navigator.mediaDevices as any).getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: "default",
          },
        },
      });
      const sysSource = this.ctx.createMediaStreamSource(stream);
      sysSource.connect(this.analyser);
      this.source = sysSource;
    } catch {
      console.warn("[AudioEngine] System audio capture failed, falling back to demo");
      this.startDemo();
    }
  }
}

/** Singleton instance */
let instance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!instance) instance = new AudioEngine();
  return instance;
}

export function disposeAudioEngine(): void {
  instance?.dispose();
  instance = null;
}
