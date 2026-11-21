/**
 * Example: Registering a custom 9th-chord progression in CHORD_PRESETS
 * Run with: node examples/custom-chord-preset.js
 */
import { CHORD_PRESETS, fillVinylCrackleBuffer } from '../src/services/ambientLoFiEngine.js';

CHORD_PRESETS.monsoon_desk = {
  id: 'monsoon_desk',
  label: 'Monsoon Desk',
  bpm: 64,
  cutoffHz: 780,
  chordNames: ['Am9', 'Dm9', 'G13', 'Cmaj9'],
  chords: [
    [110.00, 164.81, 196.00, 246.94],
    [146.83, 174.61, 220.00, 329.63],
    [196.00, 246.94, 293.66, 329.63],
    [130.81, 164.81, 196.00, 293.66],
  ],
};

const sampleBuffer = fillVinylCrackleBuffer(new Float32Array(128));
console.log('Registered preset:', CHORD_PRESETS.monsoon_desk.label);
console.log('Generated sample vinyl frame[0..3]:', Array.from(sampleBuffer.slice(0, 4)));
