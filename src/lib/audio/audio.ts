/**
 * Tiny Web Audio synth engine — all sound effects are generated with
 * oscillators/noise, so there are no binary audio assets and nothing to license.
 * Audio must be unlocked from a user gesture (browser autoplay policy).
 */

export type Sfx =
  | "move"
  | "rotate"
  | "softdrop"
  | "harddrop"
  | "lock"
  | "hold"
  | "lineclear"
  | "tetris"
  | "tspin"
  | "levelup"
  | "gameover"
  | "count"
  | "go"
  | "ui";

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private muted = false;
  private musicOn = false;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;

  /** Create/resume the AudioContext. Must be called from a user gesture. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.0; // ramped up when music starts
      this.musicBus.connect(this.master);

      // Pre-render a short white-noise buffer for percussive effects.
      const len = Math.floor(this.ctx.sampleRate * 0.3);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.musicOn) this.startMusic();
  }

  get isUnlocked() {
    return !!this.ctx && this.ctx.state === "running";
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        muted ? 0 : 0.9,
        this.ctx.currentTime,
        0.02,
      );
    }
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  // --- low-level voices -----------------------------------------------------

  private tone(opts: {
    freq: number;
    dur: number;
    type?: OscillatorType;
    gain?: number;
    when?: number;
    glideTo?: number;
    bus?: GainNode | null;
  }) {
    if (!this.ctx) return;
    const bus = opts.bus ?? this.sfxBus;
    if (!bus) return;
    const t0 = this.ctx.currentTime + (opts.when ?? 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = opts.type ?? "triangle";
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, opts.glideTo),
        t0 + opts.dur,
      );
    }
    const peak = opts.gain ?? 0.3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  private noise(opts: {
    dur: number;
    gain?: number;
    when?: number;
    filter?: number;
    type?: BiquadFilterType;
  }) {
    if (!this.ctx || !this.noiseBuffer || !this.sfxBus) return;
    const t0 = this.ctx.currentTime + (opts.when ?? 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = opts.type ?? "lowpass";
    filter.frequency.value = opts.filter ?? 1800;
    const g = this.ctx.createGain();
    const peak = opts.gain ?? 0.2;
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxBus);
    src.start(t0);
    src.stop(t0 + opts.dur + 0.02);
  }

  private arp(freqs: number[], step: number, dur: number, gain = 0.28) {
    freqs.forEach((f, i) =>
      this.tone({ freq: f, dur, type: "triangle", gain, when: i * step }),
    );
  }

  // --- public SFX -----------------------------------------------------------

  play(name: Sfx) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "move":
        this.tone({ freq: 220, dur: 0.05, type: "square", gain: 0.12 });
        break;
      case "rotate":
        this.tone({ freq: 360, dur: 0.07, type: "triangle", gain: 0.16, glideTo: 460 });
        break;
      case "softdrop":
        this.tone({ freq: 150, dur: 0.04, type: "sine", gain: 0.1 });
        break;
      case "harddrop":
        this.noise({ dur: 0.1, gain: 0.25, filter: 1400 });
        this.tone({ freq: 120, dur: 0.12, type: "sine", gain: 0.3, glideTo: 60 });
        break;
      case "lock":
        this.tone({ freq: 200, dur: 0.06, type: "square", gain: 0.14, glideTo: 150 });
        this.noise({ dur: 0.04, gain: 0.08, filter: 2200 });
        break;
      case "hold":
        this.tone({ freq: 300, dur: 0.06, type: "triangle", gain: 0.16 });
        this.tone({ freq: 440, dur: 0.08, type: "triangle", gain: 0.14, when: 0.05 });
        break;
      case "lineclear":
        this.arp([523, 659, 784], 0.06, 0.16);
        break;
      case "tspin":
        this.arp([587, 740, 880, 1175], 0.05, 0.18, 0.3);
        break;
      case "tetris":
        this.arp([523, 659, 784, 1047], 0.07, 0.24, 0.32);
        this.tone({ freq: 1568, dur: 0.3, type: "sine", gain: 0.14, when: 0.28 });
        break;
      case "levelup":
        this.tone({ freq: 392, dur: 0.5, type: "triangle", gain: 0.26, glideTo: 1046 });
        break;
      case "gameover":
        this.arp([523, 440, 349, 262], 0.14, 0.4, 0.28);
        break;
      case "count":
        this.tone({ freq: 440, dur: 0.12, type: "square", gain: 0.2 });
        break;
      case "go":
        this.tone({ freq: 880, dur: 0.35, type: "triangle", gain: 0.3, glideTo: 1320 });
        break;
      case "ui":
        this.tone({ freq: 520, dur: 0.05, type: "sine", gain: 0.12 });
        break;
    }
  }

  // --- gentle background music loop ----------------------------------------

  private startMusic() {
    if (!this.ctx || !this.musicBus || this.musicTimer) return;
    this.musicBus.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.5);
    // A calm, original pentatonic arpeggio (not a copyrighted melody).
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    const pattern = [0, 2, 4, 5, 4, 2, 3, 1];
    const stepMs = 260;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicBus || this.muted) return;
      const note = scale[pattern[this.musicStep % pattern.length]];
      this.tone({
        freq: note,
        dur: 0.5,
        type: "sine",
        gain: 0.2,
        bus: this.musicBus,
      });
      if (this.musicStep % 4 === 0) {
        this.tone({
          freq: note / 2,
          dur: 0.7,
          type: "triangle",
          gain: 0.12,
          bus: this.musicBus,
        });
      }
      this.musicStep++;
    }, stepMs);
  }

  private stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    }
  }
}

export const audioEngine = new AudioEngine();
