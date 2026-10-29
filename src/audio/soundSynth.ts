/**
 * Web Audio API Sound Synthesizer for 3D Endless Runner
 * Zero external audio assets required.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.5;
  private musicIntervalId: number | null = null;
  private isMusicPlaying: boolean = false;
  private musicMasterFilter: BiquadFilterNode | null = null;
  private musicMasterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private isWindPlaying: boolean = false;
  private currentTempoMs: number = 160;

  constructor() {
    // Lazy AudioContext initialization on first user touch/click
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && !this.musicMasterFilter) {
      this.musicMasterFilter = this.ctx.createBiquadFilter();
      this.musicMasterFilter.type = 'lowpass';
      this.musicMasterFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);

      this.musicMasterGain = this.ctx.createGain();
      this.musicMasterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.musicMasterFilter.connect(this.musicMasterGain);
      this.musicMasterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSettings(sound: boolean, music: boolean, vol: number) {
    this.soundEnabled = sound;
    this.musicEnabled = music;
    this.volume = vol;

    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }

    if (!music && this.isMusicPlaying) {
      this.stopMusic();
    } else if (music && !this.isMusicPlaying && this.ctx) {
      this.startMusic();
    }
  }

  // --- Dynamic Audio: Rocket Muffle Filter ---
  public setRocketMuffle(active: boolean) {
    this.initCtx();
    if (!this.ctx || !this.musicMasterFilter) return;
    const targetFreq = active ? 650 : 14000;
    this.musicMasterFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.12);
  }

  // --- Dynamic Audio: Speed-Reactive Tempo ---
  public setMusicSpeed(speed: number) {
    const newTempo = Math.max(105, 160 - Math.floor((speed - 18) * 2.5));
    if (Math.abs(newTempo - this.currentTempoMs) >= 5) {
      this.currentTempoMs = newTempo;
      if (this.isMusicPlaying) {
        // Restart timer at new tempo without interrupting music state
        if (this.musicIntervalId !== null) {
          clearInterval(this.musicIntervalId);
        }
        this.runMusicLoop();
      }
    }
  }

  // --- Wind Rush Noise for Rocket / High-Speed Flight ---
  public setWindRush(active: boolean) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    if (active && !this.isWindPlaying) {
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(550, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

        this.windGain = this.ctx.createGain();
        this.windGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.windGain.gain.linearRampToValueAtTime(0.18 * this.volume, this.ctx.currentTime + 0.3);

        noise.connect(filter);
        filter.connect(this.windGain);
        this.windGain.connect(this.ctx.destination);

        noise.start(this.ctx.currentTime);
        this.isWindPlaying = true;
      } catch {
        // Ignore audio node glitches
      }
    } else if (!active && this.isWindPlaying && this.windGain && this.ctx) {
      try {
        this.windGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        setTimeout(() => {
          this.isWindPlaying = false;
          this.windGain = null;
        }, 260);
      } catch {
        this.isWindPlaying = false;
      }
    }
  }

  // --- Glass Shatter Sound (Shield Break) ---
  public playGlassShatter() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const frequencies = [1480, 2240, 3120, 4200, 5600];
    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.18);

      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.015);
      osc.stop(now + 0.23);
    });

    // Highpass noise sparkle burst
    try {
      const bufLen = Math.floor(this.ctx.sampleRate * 0.15);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.setValueAtTime(2500, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.22 * this.volume, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(f);
      f.connect(g);
      g.connect(this.ctx.destination);
      noise.start(now);
    } catch {
      // safe fallback
    }
  }

  // --- Revive Fanfare ---
  public playReviveFanfare() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    chords.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);

      gain.gain.setValueAtTime(0.25 * this.volume, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.4);
    });
  }

  // --- Near Miss Whoosh ---
  public playNearMissWhoosh() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.18);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- Double Jump Ninja Flip ---
  public playDoubleJump() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // --- Boost Pad Hyper Launch ---
  public playBoostPad() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // --- Theme Change Fanfare ---
  public playThemeFanfare() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major triumphant chord
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.25 * this.volume, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  // --- Spin Wheel Tick ---
  public playWheelTick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // --- Mystery Box Jackpot Chime ---
  public playJackpot() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.3 * this.volume, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.45);
    });
  }

  // --- Skateboard Spawn / Trick Sound ---
  public playSkateboardSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [350, 520, 700, 1040];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.03);

      gain.gain.setValueAtTime(0.2 * this.volume, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.12);
    });
  }

  // --- Train Horn Warning ---
  public playTrainHorn() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [311.13, 369.99].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 0.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.1);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  // --- Thunder Clash ---
  public playThunder() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 1.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // --- Rocket Whoosh ---
  public playRocketWhoosh() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.4);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // --- Magnet Hum ---
  public playMagnetHum() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(330, now + 0.15);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- Footsteps ---
  public playFootstep() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

    gain.gain.setValueAtTime(0.06 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- Coin Collection Chime ---
  public playCoin() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // --- Jump ---
  public playJump() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.18);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- Slide ---
  public playSlide() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // --- Lane Change ---
  public playLaneChange() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.06);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // --- Power-up Acquire ---
  public playPowerUp() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [300, 450, 600, 800, 1050];
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.2 * this.volume, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.15);
    });
  }

  // --- Crash / Hit ---
  public playCrash() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    oscGain.gain.setValueAtTime(0.3 * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // --- Police Inspector Pea-Whistle (Subway Surfers Chase) ---
  public playPoliceWhistle() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Two-burst sharp police whistle with rapid pea-trill modulation
    const bursts = [
      { start: 0, dur: 0.22, baseFreq: 2750 },
      { start: 0.26, dur: 0.42, baseFreq: 2920 },
    ];

    bursts.forEach(b => {
      const t0 = now + b.start;
      const tEnd = t0 + b.dur;

      const carrier = this.ctx!.createOscillator();
      const trillLfo = this.ctx!.createOscillator();
      const trillGain = this.ctx!.createGain();
      const mainGain = this.ctx!.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(b.baseFreq, t0);
      carrier.frequency.linearRampToValueAtTime(b.baseFreq + 120, t0 + b.dur * 0.4);
      carrier.frequency.linearRampToValueAtTime(b.baseFreq - 60, tEnd);

      // Pea trill at 32 Hz
      trillLfo.type = 'sine';
      trillLfo.frequency.setValueAtTime(32, t0);
      trillGain.gain.setValueAtTime(160, t0);

      trillLfo.connect(trillGain);
      trillGain.connect(carrier.frequency);

      mainGain.gain.setValueAtTime(0.001, t0);
      mainGain.gain.linearRampToValueAtTime(0.28 * this.volume, t0 + 0.02);
      mainGain.gain.setValueAtTime(0.26 * this.volume, tEnd - 0.04);
      mainGain.gain.exponentialRampToValueAtTime(0.001, tEnd);

      carrier.connect(mainGain);
      mainGain.connect(this.ctx!.destination);

      carrier.start(t0);
      trillLfo.start(t0);
      carrier.stop(tEnd);
      trillLfo.stop(tEnd);
    });
  }

  // --- Guard Dog Double Bark ("Woof! Woof!") ---
  public playDogBark() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const barks = [0, 0.22];

    barks.forEach(offset => {
      const t0 = now + offset;
      const dur = 0.16;

      // Vocal cord sawtooth pitch drop
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, t0);
      osc.frequency.linearRampToValueAtTime(360, t0 + 0.035);
      osc.frequency.exponentialRampToValueAtTime(115, t0 + dur);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(620, t0);
      filter.Q.setValueAtTime(2.2, t0);

      gain.gain.setValueAtTime(0.01, t0);
      gain.gain.linearRampToValueAtTime(0.36 * this.volume, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t0);
      osc.stop(t0 + dur);

      // Breath / bark rasp noise burst
      try {
        const bufSize = Math.floor(this.ctx!.sampleRate * dur);
        const buf = this.ctx!.createBuffer(1, bufSize, this.ctx!.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = this.ctx!.createBufferSource();
        noise.buffer = buf;

        const nFilter = this.ctx!.createBiquadFilter();
        nFilter.type = 'bandpass';
        nFilter.frequency.setValueAtTime(900, t0);

        const nGain = this.ctx!.createGain();
        nGain.gain.setValueAtTime(0.22 * this.volume, t0);
        nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(this.ctx!.destination);
        noise.start(t0);
      } catch {
        // safe fallback
      }
    });
  }

  public playButtonClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- Background Music Loop with Master Muffle Filter & Reactive Tempo ---
  private musicNoteIdx: number = 0;
  private readonly melody = [
    261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66,
    261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 293.66
  ];

  public startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.runMusicLoop();
  }

  private runMusicLoop() {
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }

    const playStep = () => {
      if (!this.isMusicPlaying || !this.musicEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = this.melody[this.musicNoteIdx % this.melody.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq * 0.5, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.04 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);

      // Route through master filter (for Rocket muffle)
      if (this.musicMasterFilter) {
        gain.connect(this.musicMasterFilter);
      } else {
        gain.connect(this.ctx.destination);
      }

      osc.start(now);
      osc.stop(now + 0.15);

      this.musicNoteIdx++;
    };

    this.musicIntervalId = window.setInterval(playStep, this.currentTempoMs);
  }

  public playCountdownBeep(isFinal: boolean = false) {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.15));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isFinal ? 0.35 : 0.15));
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

export const soundSynth = new SoundSynthesizer();

