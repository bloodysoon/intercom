import type { SoundId } from "@/features/intercom/types";

type Wave = OscillatorType;

interface ToneSpec {
  freq: number;
  to?: number;
  type?: Wave;
  at?: number;
  dur: number;
  gain?: number;
  attack?: number;
  filter?: number;
}

interface NoiseSpec {
  at?: number;
  dur: number;
  gain?: number;
  band: number;
  q?: number;
}

/**
 * Synthesised device sounds (no audio files to load or fail).
 * Designed to be subtle and "hardware-like": soft sine chimes, filtered buzzes,
 * a relay click for the lock. Volumes are deliberately modest so they sit
 * under dialogue and can be replaced in post if needed.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  /** Must be called from a user gesture at least once (autoplay policies). */
  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    // iOS: playing a silent buffer inside the gesture fully unlocks output.
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  }

  get ready(): boolean {
    return this.ctx?.state === "running";
  }

  play(id: SoundId): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    const t = ctx.currentTime + 0.01;
    try {
      SOUNDS[id](this, t);
    } catch {
      // Never let audio break the display.
    }
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      const ctx = new Ctor({ latencyHint: "interactive" });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      const master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(comp).connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      return ctx;
    } catch {
      return null;
    }
  }

  tone(base: number, s: ToneSpec): void {
    const ctx = this.ctx!;
    const start = base + (s.at ?? 0);
    const end = start + s.dur;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = s.type ?? "sine";
    osc.frequency.setValueAtTime(s.freq, start);
    if (s.to) osc.frequency.exponentialRampToValueAtTime(s.to, end);
    const peak = s.gain ?? 0.2;
    const attack = s.attack ?? 0.006;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    let node: AudioNode = osc;
    if (s.filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = s.filter;
      node = osc.connect(lp);
    }
    node.connect(env).connect(this.master!);
    osc.start(start);
    osc.stop(end + 0.05);
  }

  noise(base: number, s: NoiseSpec): void {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) {
      const len = ctx.sampleRate * 0.5;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    const start = base + (s.at ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = s.band;
    bp.Q.value = s.q ?? 1.5;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(s.gain ?? 0.3, start + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, start + s.dur);
    src.connect(bp).connect(env).connect(this.master!);
    src.start(start);
    src.stop(start + s.dur + 0.05);
  }
}

const SOUNDS: Record<SoundId, (e: AudioEngine, t: number) => void> = {
  key: (e, t) => {
    e.noise(t, { dur: 0.012, band: 3800, gain: 0.08, q: 2 });
    e.tone(t, { freq: 1480, type: "triangle", dur: 0.09, gain: 0.09 });
  },
  cameraOn: (e, t) => {
    e.tone(t, { freq: 660, dur: 0.35, gain: 0.1, attack: 0.03 });
    e.tone(t, { freq: 990, at: 0.14, dur: 0.5, gain: 0.09, attack: 0.03 });
  },
  scan: (e, t) => {
    [880, 1046, 1318, 1568].forEach((f, i) => e.tone(t, { freq: f, at: i * 0.085, dur: 0.12, gain: 0.06 }));
    e.tone(t, { freq: 300, to: 1800, type: "sawtooth", dur: 0.6, gain: 0.015, filter: 1600, attack: 0.1 });
  },
  failure: (e, t) => {
    e.tone(t, { freq: 494, type: "square", dur: 0.2, gain: 0.07, filter: 1400 });
    e.tone(t, { freq: 370, type: "square", at: 0.22, dur: 0.34, gain: 0.07, filter: 1200 });
  },
  success: (e, t) => {
    [1046.5, 1318.5, 1568].forEach((f, i) =>
      e.tone(t, { freq: f, at: i * 0.11, dur: 0.55, gain: 0.08, attack: 0.008 }),
    );
  },
  denied: (e, t) => {
    e.tone(t, { freq: 185, type: "sawtooth", dur: 0.16, gain: 0.08, filter: 900 });
    e.tone(t, { freq: 185, type: "sawtooth", at: 0.22, dur: 0.22, gain: 0.08, filter: 900 });
  },
  unlock: (e, t) => {
    // Relay / solenoid: sharp click + low thunk.
    e.noise(t, { dur: 0.03, band: 2400, gain: 0.35, q: 3 });
    e.tone(t, { freq: 140, to: 60, dur: 0.16, gain: 0.25 });
    e.noise(t, { at: 0.09, dur: 0.02, band: 1800, gain: 0.2, q: 3 });
    // Confirmation chime.
    [784, 1046.5, 1318.5, 1568].forEach((f, i) =>
      e.tone(t, { freq: f, at: 0.22 + i * 0.09, dur: 0.7, gain: 0.07 }),
    );
  },
};

let engine: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  engine ??= new AudioEngine();
  return engine;
}
