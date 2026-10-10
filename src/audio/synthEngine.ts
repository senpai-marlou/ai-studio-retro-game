/**
 * 80s Vaporwave Synth & SFX Engine
 * Fully procedural Web Audio API synthesis: zero external audio assets required.
 */

export interface TrackInfo {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  genre: string;
  duration: number; // in seconds
  color: string;
  description: string;
}

export const TRACKS: TrackInfo[] = [
  {
    id: 0,
    title: "NEON HORIZON '84",
    artist: "Sunset Cruiser",
    bpm: 104,
    genre: "Dreamy Retrowave",
    duration: 148,
    color: "#ff2a85",
    description: "Lush analog pads, nostalgic arpeggios & cruising 80s bassline."
  },
  {
    id: 1,
    title: "CYBER HIGHWAY PURSUIT",
    artist: "Midnight Runner",
    bpm: 124,
    genre: "High-Octane Outrun",
    duration: 136,
    color: "#00f0ff",
    description: "Driving synth bass, punching gated drums & heroic lead synths."
  },
  {
    id: 2,
    title: "PALM GROVE CASSETTE",
    artist: "Vapour Mirage",
    bpm: 88,
    genre: "Chill Vaporwave",
    duration: 164,
    color: "#b5179e",
    description: "Relaxed sunset chords, tape flutter & mellow sub frequencies."
  }
];

type ChangeListener = () => void;

class SynthEngine {
  private ctx: AudioContext | null = null;
  private musicMasterGain: GainNode | null = null;
  private sfxMasterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isPlaying = false;
  private currentTrackIndex = 0;
  private musicVolume = 0.7;
  private sfxVolume = 0.8;

  private schedulerTimer: number | null = null;
  private currentStep = 0;
  private nextStepTime = 0;
  private elapsedSeconds = 0;
  private trackTimer: number | null = null;

  private listeners: Set<ChangeListener> = new Set();
  private ufoOsc: OscillatorNode | null = null;
  private ufoGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Analyser for real-time visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      // Master music gain node
      this.musicMasterGain = this.ctx.createGain();
      this.musicMasterGain.gain.value = this.musicVolume;
      this.musicMasterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // SFX gain node directly to destination
      this.sfxMasterGain = this.ctx.createGain();
      this.sfxMasterGain.gain.value = this.sfxVolume;
      this.sfxMasterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(cb: ChangeListener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentTrack: TRACKS[this.currentTrackIndex],
      currentTrackIndex: this.currentTrackIndex,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      tracks: TRACKS
    };
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async play() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    if (this.ctx) {
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }
    this.startScheduler();
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    this.stopScheduler();
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % TRACKS.length;
    this.currentStep = 0;
    this.elapsedSeconds = 0;
    if (this.isPlaying) {
      this.stopScheduler();
      if (this.ctx) this.nextStepTime = this.ctx.currentTime + 0.05;
      this.startScheduler();
    }
    this.notify();
  }

  public prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    this.currentStep = 0;
    this.elapsedSeconds = 0;
    if (this.isPlaying) {
      this.stopScheduler();
      if (this.ctx) this.nextStepTime = this.ctx.currentTime + 0.05;
      this.startScheduler();
    }
    this.notify();
  }

  public selectTrack(index: number) {
    if (index >= 0 && index < TRACKS.length) {
      this.currentTrackIndex = index;
      this.currentStep = 0;
      this.elapsedSeconds = 0;
      if (this.isPlaying) {
        this.stopScheduler();
        if (this.ctx) this.nextStepTime = this.ctx.currentTime + 0.05;
        this.startScheduler();
      }
      this.notify();
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxMasterGain && this.ctx) {
      this.sfxMasterGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    this.notify();
  }

  // Frequency table for synth notes
  private midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Track composition definition patterns
  // 16 steps per bar
  private scheduleNote(step: number, time: number) {
    if (!this.ctx || !this.musicMasterGain) return;

    const track = TRACKS[this.currentTrackIndex];
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;
    const barCycle = bar % 8; // 8 bar phrase

    if (this.currentTrackIndex === 0) {
      // Track 0: NEON HORIZON '84 (Am -> F -> C -> G)
      // Chords per 2 bars:
      // Bar 0-1: A minor (A2, C3, E3, A3)
      // Bar 2-3: F major (F2, A2, C3, F3)
      // Bar 4-5: C major (C2, E2, G2, C3)
      // Bar 6-7: G major (G2, B2, D3, G3)
      const chordRoots = [45, 45, 41, 41, 48, 48, 43, 43]; // MIDI roots
      const root = chordRoots[barCycle];

      // DRUMS
      // Kick on 0, 4, 8, 12 (4-on-the-floor)
      if (stepInBar % 4 === 0) {
        this.synthesizeKick(time);
      }
      // Gated Snare on 4, 12
      if (stepInBar === 4 || stepInBar === 12) {
        this.synthesizeSnare(time);
      }
      // Hi-hat on every 8th note or 16th
      if (stepInBar % 2 === 0) {
        this.synthesizeHiHat(time, stepInBar % 4 === 2 ? 0.35 : 0.2);
      }

      // ROLLING RETRO BASS (8th notes with octave jumps)
      if (stepInBar % 2 === 0) {
        const isOctave = (stepInBar / 2) % 2 === 1;
        const bassMidi = root - 12 + (isOctave ? 12 : 0);
        this.synthesizeBass(this.midiToFreq(bassMidi), time, 0.16, 'sawtooth');
      }

      // ARPEGGIO (16th notes)
      const arpNotes = [0, 7, 12, 15, 12, 7, 19, 12, 15, 7, 12, 15, 19, 15, 12, 7];
      const arpmidi = root + arpNotes[stepInBar];
      this.synthesizePluck(this.midiToFreq(arpmidi), time, 0.12, 0.15);

      // WARM CHORD PAD (Played on step 0 and held)
      if (stepInBar === 0) {
        const padChord = [root + 12, root + 15, root + 19];
        padChord.forEach((m) => {
          this.synthesizePad(this.midiToFreq(m), time, 3.2);
        });
      }

      // RETRO LEAD MELODY (Enters in bars 4-7)
      if (barCycle >= 4) {
        const leadPattern: { [key: number]: number } = {
          0: 69, 3: 72, 6: 76, 8: 74, 11: 72, 14: 71
        };
        if (leadPattern[stepInBar] !== undefined) {
          this.synthesizeLead(this.midiToFreq(leadPattern[stepInBar]), time, 0.35);
        }
      }
    } else if (this.currentTrackIndex === 1) {
      // Track 1: CYBER HIGHWAY PURSUIT (Dm -> Bb -> C -> Am)
      const roots = [50, 50, 46, 46, 48, 48, 45, 45];
      const root = roots[barCycle];

      // Aggressive Kick on 0, 4, 8, 12 + extra 14
      if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12 || stepInBar === 14) {
        this.synthesizeKick(time, 130);
      }
      // Snare on 4, 12
      if (stepInBar === 4 || stepInBar === 12) {
        this.synthesizeSnare(time, 0.4);
      }
      // Crisp 16th Hi-hats
      this.synthesizeHiHat(time, stepInBar % 2 === 0 ? 0.25 : 0.15);

      // PUMPING OUTRUN BASS (16th notes continuous chug)
      const bassMidi = root - 12 + (stepInBar % 4 === 2 ? 12 : 0);
      this.synthesizeBass(this.midiToFreq(bassMidi), time, 0.1, 'sawtooth');

      // SYNTH STAB CHORDS (on 0, 6, 10)
      if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10) {
        [root, root + 3, root + 7].forEach((m) => {
          this.synthesizeLead(this.midiToFreq(m + 12), time, 0.18, 0.2);
        });
      }

      // HIGH VELOCITY LEAD
      const leadMelody: { [key: number]: number } = {
        0: 74, 2: 74, 4: 77, 6: 76, 8: 74, 10: 72, 12: 74, 14: 76
      };
      if (leadMelody[stepInBar] !== undefined) {
        this.synthesizeLead(this.midiToFreq(leadMelody[stepInBar] + 12), time, 0.15, 0.22);
      }
    } else {
      // Track 2: PALM GROVE CASSETTE (Chill Vaporwave Fmaj7 -> Em7 -> Dm7 -> Am7)
      const roots = [41, 41, 40, 40, 38, 38, 45, 45];
      const root = roots[barCycle];

      // Chill beat: Kick on 0, 10
      if (stepInBar === 0 || stepInBar === 10) {
        this.synthesizeKick(time, 85);
      }
      // Gated rim/snare on 4, 12
      if (stepInBar === 4 || stepInBar === 12) {
        this.synthesizeSnare(time, 0.25);
      }
      // Lazy swing hats
      if (stepInBar % 4 === 2 || stepInBar % 4 === 0) {
        this.synthesizeHiHat(time, 0.15);
      }

      // Smooth Sub Bass
      if (stepInBar === 0 || stepInBar === 6 || stepInBar === 10) {
        this.synthesizeBass(this.midiToFreq(root), time, 0.5, 'sine');
      }

      // Lush Dream Rhodes Chords (steps 0, 8)
      if (stepInBar === 0 || stepInBar === 8) {
        [root + 12, root + 16, root + 19, root + 23].forEach((m) => {
          this.synthesizePluck(this.midiToFreq(m), time, 1.2, 0.22);
        });
      }

      // Dreamy vocal-like synth flute
      if (barCycle >= 2 && (stepInBar === 2 || stepInBar === 6 || stepInBar === 12)) {
        const flutenotes = [69, 72, 76, 79];
        const fNote = flutenotes[(stepInBar + barCycle) % flutenotes.length];
        this.synthesizeLead(this.midiToFreq(fNote), time, 0.5, 0.18);
      }
    }
  }

  // --- Procedural Instrument Synthesizers ---

  private synthesizeKick(time: number, startFreq = 120) {
    if (!this.ctx || !this.musicMasterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.14);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.musicMasterGain);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  private synthesizeSnare(time: number, volume = 0.35) {
    if (!this.ctx || !this.musicMasterGain) return;
    // Tone snap
    const toneOsc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    toneOsc.frequency.setValueAtTime(220, time);
    toneOsc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    toneGain.gain.setValueAtTime(0.4 * volume, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    toneOsc.connect(toneGain);
    toneGain.connect(this.musicMasterGain);
    toneOsc.start(time);
    toneOsc.stop(time + 0.13);

    // Gated noise burst
    const bufferSize = this.ctx.sampleRate * 0.25;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(volume, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicMasterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.25);
  }

  private synthesizeHiHat(time: number, volume = 0.2) {
    if (!this.ctx || !this.musicMasterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicMasterGain);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private synthesizeBass(freq: number, time: number, duration: number, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.musicMasterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + duration);

    gain.gain.setValueAtTime(0.38, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicMasterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizePluck(freq: number, time: number, duration: number, volume = 0.18) {
    if (!this.ctx || !this.musicMasterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + duration);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicMasterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizePad(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.musicMasterGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.004, time); // Subtle lush detune chorus

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicMasterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  private synthesizeLead(freq: number, time: number, duration: number, volume = 0.22) {
    if (!this.ctx || !this.musicMasterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicMasterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Scheduler loop
  private startScheduler() {
    if (this.schedulerTimer) clearInterval(this.schedulerTimer);
    if (this.trackTimer) clearInterval(this.trackTimer);

    const stepIntervalMs = 25; // Check scheduling every 25ms
    this.schedulerTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;

      const track = TRACKS[this.currentTrackIndex];
      const secondsPerBeat = 60.0 / track.bpm;
      const secondsPerStep = secondsPerBeat / 4; // 16th note steps

      // Schedule notes up to 150ms ahead
      while (this.nextStepTime < this.ctx.currentTime + 0.15) {
        this.scheduleNote(this.currentStep, this.nextStepTime);
        this.nextStepTime += secondsPerStep;
        this.currentStep++;
      }
    }, stepIntervalMs);

    // Track clock for UI elapsed time
    this.trackTimer = window.setInterval(() => {
      if (this.isPlaying) {
        this.elapsedSeconds += 1;
        const track = TRACKS[this.currentTrackIndex];
        if (this.elapsedSeconds >= track.duration) {
          this.nextTrack();
        } else {
          this.notify();
        }
      }
    }, 1000);
  }

  private stopScheduler() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.trackTimer) {
      clearInterval(this.trackTimer);
      this.trackTimer = null;
    }
  }

  // ==========================================
  // GAME SOUND EFFECTS (Retro 80s arcade SFX)
  // ==========================================

  public playLaserSound() {
    this.initContext();
    if (!this.ctx || !this.sfxMasterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxMasterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playAlienExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxMasterGain) return;
    const now = this.ctx.currentTime;

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxMasterGain);

    noise.start(now);
    noise.stop(now + 0.21);
  }

  public playPlayerHit() {
    this.initContext();
    if (!this.ctx || !this.sfxMasterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.45);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxMasterGain);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playPowerupSound() {
    this.initContext();
    if (!this.ctx || !this.sfxMasterGain) return;
    const now = this.ctx.currentTime;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain!);

      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  public playWaveClearSound() {
    this.initContext();
    if (!this.ctx || !this.sfxMasterGain) return;
    const now = this.ctx.currentTime;
    const notes = [523, 659, 783, 1046, 1318];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxMasterGain!);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  public playInvaderStep(step: number) {
    this.initContext();
    if (!this.ctx || !this.sfxMasterGain) return;
    const now = this.ctx.currentTime;
    const frequencies = [175, 155, 140, 120];
    const freq = frequencies[step % 4];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxMasterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public startUfoSiren() {
    this.initContext();
    if (!this.ctx || !this.sfxMasterGain || this.ufoOsc) return;

    this.ufoOsc = this.ctx.createOscillator();
    this.ufoGain = this.ctx.createGain();

    this.ufoOsc.type = 'sawtooth';
    this.ufoOsc.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO for warble
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(6, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.ufoOsc.frequency);
    lfo.start();

    this.ufoGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    this.ufoOsc.connect(this.ufoGain);
    this.ufoGain.connect(this.sfxMasterGain);

    this.ufoOsc.start();
  }

  public stopUfoSiren() {
    if (this.ufoOsc && this.ufoGain && this.ctx) {
      try {
        this.ufoGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        this.ufoOsc.stop(this.ctx.currentTime + 0.06);
      } catch {
        // already stopped
      }
      this.ufoOsc = null;
      this.ufoGain = null;
    }
  }
}

export const synthEngine = new SynthEngine();
