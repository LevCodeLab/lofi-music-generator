import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHORD_PRESETS,
  fillVinylCrackleBuffer,
  AmbientLoFiEngine,
} from '../src/services/ambientLoFiEngine.js';

function createMockAudioContext() {
  const param = () => ({
    value: 0,
    setValueAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v) { this.value = v; },
    exponentialRampToValueAtTime(v) { this.value = v; },
  });

  return {
    state: 'running',
    sampleRate: 4000,
    currentTime: 0,
    destination: {},
    resume() {},
    createGain() {
      return { gain: param(), connect() {}, disconnect() {} };
    },
    createBiquadFilter() {
      return { type: 'lowpass', frequency: param(), Q: param(), connect() {} };
    },
    createAnalyser() {
      return {
        fftSize: 512,
        smoothingTimeConstant: 0.8,
        connect() {},
        getByteTimeDomainData(buf) { buf.fill(132); },
      };
    },
    createBuffer(_ch, length) {
      const arr = new Float32Array(length);
      return { getChannelData: () => arr };
    },
    createBufferSource() {
      return { buffer: null, loop: false, connect() {}, start() {}, stop() {}, disconnect() {} };
    },
    createOscillator() {
      return {
        type: 'sine',
        frequency: param(),
        detune: param(),
        connect() {},
        start() {},
        stop() {},
      };
    },
  };
}

test('CHORD_PRESETS defines valid 4-voice frequency voicings across all presets', () => {
  const keys = Object.keys(CHORD_PRESETS);
  assert.ok(keys.length >= 4);
  for (const key of keys) {
    const preset = CHORD_PRESETS[key];
    assert.equal(preset.chords.length, 4);
    assert.equal(preset.chordNames.length, 4);
    for (const chord of preset.chords) {
      assert.equal(chord.length, 4);
      assert.ok(chord.every((hz) => hz > 80 && hz < 600));
    }
  }
});

test('fillVinylCrackleBuffer synthesizes bounded PCM samples without NaN or clipping', () => {
  const pcm = new Float32Array(8000);
  fillVinylCrackleBuffer(pcm, 0.005, 0.02);
  let nonZero = 0;
  for (let i = 0; i < pcm.length; i++) {
    assert.ok(!Number.isNaN(pcm[i]));
    assert.ok(Math.abs(pcm[i]) <= 1.0);
    if (pcm[i] !== 0) nonZero++;
  }
  assert.ok(nonZero > 7000);
});

test('AmbientLoFiEngine starts, advances chord steps, updates DSP params, and stops cleanly', () => {
  const engine = new AmbientLoFiEngine(createMockAudioContext);
  assert.equal(engine.isPlaying, false);

  engine.start();
  assert.equal(engine.isPlaying, true);
  assert.equal(engine.currentStep, 1);

  engine.setPreset('late_chai');
  assert.equal(engine.getState().presetId, 'late_chai');

  engine.setLowpassCutoff(740);
  assert.equal(engine.getState().cutoffHz, 740);

  const wave = engine.getWaveformData(new Uint8Array(64));
  assert.equal(wave[0], 132);

  engine.stop();
  assert.equal(engine.isPlaying, false);
});
