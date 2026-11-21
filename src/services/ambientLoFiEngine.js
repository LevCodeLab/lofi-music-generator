/**
 * Procedural Ambient Lo-Fi Synthesizer Engine
 * Generates real-time mellow 7th chords, tape wow/flutter detune, sub-bass warmth,
 * and vinyl dust texture purely with the browser Web Audio API (zero MP3/WAV assets).
 */

export const CHORD_PRESETS = {
  midnight_study: {
    id: 'midnight_study',
    label: 'Midnight Study',
    bpm: 72,
    cutoffHz: 950,
    chordNames: ['Dm7', 'G7', 'Cmaj7', 'Am7'],
    chords: [
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [196.00, 246.94, 293.66, 349.23], // G7
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 164.81, 220.00, 261.63], // Am7
    ],
  },
  rainy_balcony: {
    id: 'rainy_balcony',
    label: 'Rainy Balcony',
    bpm: 66,
    cutoffHz: 820,
    chordNames: ['Fm7', 'Bb7', 'Ebmaj7', 'Cm7'],
    chords: [
      [174.61, 207.65, 261.63, 311.13], // Fm7
      [116.54, 174.61, 207.65, 293.66], // Bb7
      [155.56, 196.00, 233.08, 293.66], // Ebmaj7
      [130.81, 155.56, 196.00, 233.08], // Cm7
    ],
  },
  warm_tape: {
    id: 'warm_tape',
    label: 'Warm Tape 98',
    bpm: 78,
    cutoffHz: 1120,
    chordNames: ['Em7', 'A7', 'Dmaj7', 'Bm7'],
    chords: [
      [164.81, 196.00, 246.94, 293.66], // Em7
      [110.00, 164.81, 196.00, 277.18], // A7
      [146.83, 185.00, 220.00, 277.18], // Dmaj7
      [123.47, 146.83, 185.00, 220.00], // Bm7
    ],
  },
  late_chai: {
    id: 'late_chai',
    label: '3AM Chai Loop',
    bpm: 68,
    cutoffHz: 900,
    chordNames: ['Gm7', 'C7', 'Fmaj7', 'Dm7'],
    chords: [
      [196.00, 233.08, 293.66, 349.23], // Gm7
      [130.81, 196.00, 233.08, 329.63], // C7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [146.83, 174.61, 220.00, 261.63], // Dm7
    ],
  },
};

/**
 * Fill a Float32Array PCM channel buffer with soft tape hiss and random vinyl dust pops.
 */
export function fillVinylCrackleBuffer(output, crackleProbability = 0.002, hissGain = 0.015) {
  for (let i = 0; i < output.length; i++) {
    const crackle = Math.random() < crackleProbability ? (Math.random() * 2 - 1) * 0.4 : 0;
    output[i] = (Math.random() * 2 - 1) * hissGain + crackle;
  }
  return output;
}

export class AmbientLoFiEngine {
  constructor(audioContextFactory = null) {
    this.audioContextFactory = audioContextFactory;
    this.audioCtx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.masterGain = null;
    this.filterNode = null;
    this.analyserNode = null;
    this.noiseGainNode = null;
    this.timerId = null;
    this.noiseNode = null;
    this.currentStep = 0;

    this.presetId = 'midnight_study';
    this.volume = 0.85;
    this.crackleAmount = 0.08;
    this.cutoffHz = CHORD_PRESETS.midnight_study.cutoffHz;
    this.bpm = CHORD_PRESETS.midnight_study.bpm;
    this.listeners = new Set();
  }

  get currentPreset() {
    return CHORD_PRESETS[this.presetId] || CHORD_PRESETS.midnight_study;
  }

  get chords() {
    return this.currentPreset.chords;
  }

  get currentChordName() {
    const names = this.currentPreset.chordNames;
    const idx = Math.max(0, this.currentStep - 1) % names.length;
    return names[idx];
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emitChange() {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      presetId: this.presetId,
      presetLabel: this.currentPreset.label,
      currentChordName: this.currentChordName,
      currentStep: this.currentStep,
      bpm: this.bpm,
      cutoffHz: this.cutoffHz,
      crackleAmount: this.crackleAmount,
      volume: this.volume,
    };
  }

  init() {
    if (!this.audioCtx) {
      if (this.audioContextFactory) {
        this.audioCtx = this.audioContextFactory();
      } else if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return false;
        this.audioCtx = new AudioContextClass();
      } else {
        return false;
      }
    }
    if (this.audioCtx.state === 'suspended' && this.audioCtx.resume) {
      this.audioCtx.resume();
    }
    return true;
  }

  createTapeCrackle() {
    if (!this.audioCtx) return;
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    fillVinylCrackleBuffer(data);

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1400;
    noiseFilter.Q.value = 0.8;

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.value = this.crackleAmount;
    this.noiseGainNode = noiseGain;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start();
    this.noiseNode = noise;
  }

  playSoftPulse(now) {
    if (!this.audioCtx || !this.isPlaying) return;
    const kickOsc = this.audioCtx.createOscillator();
    const kickGain = this.audioCtx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(98, now);
    kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.14);

    kickGain.gain.setValueAtTime(0.08, now);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    kickOsc.connect(kickGain);
    kickGain.connect(this.filterNode);
    kickOsc.start(now);
    kickOsc.stop(now + 0.25);
  }

  playChord(frequencies) {
    if (!this.audioCtx || !this.isPlaying) return;
    const now = this.audioCtx.currentTime;
    const stepSeconds = (60 / this.bpm) * 4;
    const chordDuration = stepSeconds * 1.05;

    frequencies.forEach((freq, index) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      const detuneCents = (Math.random() - 0.5) * 9;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneCents, now);

      const peakVolume = 0.06 / frequencies.length;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakVolume, now + 0.85);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration);

      osc.connect(gain);
      gain.connect(this.filterNode);

      osc.start(now);
      osc.stop(now + chordDuration + 0.1);
    });

    // Warm root bass note one octave below lowest chord tone
    const bassOsc = this.audioCtx.createOscillator();
    const bassGain = this.audioCtx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(frequencies[0] * 0.5, now);
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.linearRampToValueAtTime(0.032, now + 0.4);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration);
    bassOsc.connect(bassGain);
    bassGain.connect(this.filterNode);
    bassOsc.start(now);
    bassOsc.stop(now + chordDuration + 0.1);

    this.playSoftPulse(now);
  }

  start() {
    if (this.isPlaying) return;
    if (!this.init()) return;

    this.isPlaying = true;

    this.masterGain = this.audioCtx.createGain();
    const targetGain = this.isMuted ? 0.0001 : this.volume;
    this.masterGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, this.audioCtx.currentTime + 1.1);

    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(this.cutoffHz, this.audioCtx.currentTime);
    this.filterNode.Q.value = 1.2;

    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 512;
    this.analyserNode.smoothingTimeConstant = 0.82;

    this.filterNode.connect(this.masterGain);
    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.audioCtx.destination);

    this.createTapeCrackle();

    const tick = () => {
      if (!this.isPlaying) return;
      const chord = this.chords[this.currentStep % this.chords.length];
      this.playChord(chord);
      this.currentStep++;
      this.emitChange();
      const stepMs = Math.round((60 / this.bpm) * 4 * 1000);
      this.timerId = setTimeout(tick, stepMs);
    };

    tick();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (this.masterGain && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
        setTimeout(() => {
          try {
            if (this.noiseNode) {
              this.noiseNode.stop();
              this.noiseNode.disconnect();
              this.noiseNode = null;
            }
            if (this.masterGain) {
              this.masterGain.disconnect();
              this.masterGain = null;
            }
          } catch {}
        }, 480);
      } catch {}
    }

    this.emitChange();
  }

  setPreset(presetId) {
    if (!CHORD_PRESETS[presetId]) return;
    this.presetId = presetId;
    this.bpm = CHORD_PRESETS[presetId].bpm;
    this.setLowpassCutoff(CHORD_PRESETS[presetId].cutoffHz);
    this.emitChange();
  }

  setLowpassCutoff(hz) {
    this.cutoffHz = Math.max(280, Math.min(3200, Number(hz) || 950));
    if (this.filterNode && this.audioCtx) {
      this.filterNode.frequency.setValueAtTime(this.cutoffHz, this.audioCtx.currentTime);
    }
    this.emitChange();
  }

  setCrackleAmount(amount) {
    this.crackleAmount = Math.max(0, Math.min(0.25, Number(amount) || 0));
    if (this.noiseGainNode && this.audioCtx) {
      this.noiseGainNode.gain.setValueAtTime(this.crackleAmount, this.audioCtx.currentTime);
    }
    this.emitChange();
  }

  setBpm(bpm) {
    this.bpm = Math.max(48, Math.min(110, Number(bpm) || 72));
    this.emitChange();
  }

  setMasterVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol)));
    if (this.masterGain && this.audioCtx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.volume), this.audioCtx.currentTime);
    }
    this.emitChange();
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.masterGain && this.audioCtx) {
      const target = this.isMuted ? 0.0001 : Math.max(0.0001, this.volume);
      this.masterGain.gain.setValueAtTime(target, this.audioCtx.currentTime);
    }
    this.emitChange();
  }

  getWaveformData(targetBuffer) {
    if (!this.analyserNode || !this.isPlaying) {
      targetBuffer.fill(128);
      return targetBuffer;
    }
    this.analyserNode.getByteTimeDomainData(targetBuffer);
    return targetBuffer;
  }
}

export const ambientLoFi = new AmbientLoFiEngine();
