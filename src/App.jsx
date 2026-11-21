import React, { useEffect, useState } from 'react';
import { Sliders } from 'lucide-react';
import { ambientLoFi, CHORD_PRESETS } from './services/ambientLoFiEngine.js';
import { LiquidContourBackground } from './components/LiquidContourBackground.jsx';
import { AudioPlayer } from './components/AudioPlayer.jsx';

const PRESET_LIST = Object.values(CHORD_PRESETS);

export default function App() {
  const [synthState, setSynthState] = useState(() => ambientLoFi.getState());

  useEffect(() => {
    const unsub = ambientLoFi.subscribe(setSynthState);
    return () => {
      unsub();
      ambientLoFi.stop();
    };
  }, []);

  const handleTogglePlay = () => {
    if (synthState.isPlaying) ambientLoFi.stop();
    else ambientLoFi.start();
  };

  const handleNextPreset = () => {
    const idx = PRESET_LIST.findIndex((p) => p.id === synthState.presetId);
    const next = PRESET_LIST[(idx + 1) % PRESET_LIST.length];
    ambientLoFi.setPreset(next.id);
  };

  const activeChordNames = CHORD_PRESETS[synthState.presetId]?.chordNames || [];

  return (
    <div className="studio-shell">
      <header className="studio-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sliders size={19} />
          <span className="studio-title">lofi-music-generator</span>
        </div>
        <span className="mono-badge">ZERO-MP3 WEB AUDIO SYNTH</span>
      </header>

      <section className="card">
        <div className="preset-row">
          {PRESET_LIST.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`btn ${synthState.presetId === preset.id ? 'active' : ''}`}
              onClick={() => ambientLoFi.setPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="visualizer-frame">
          <LiquidContourBackground isPlaying={synthState.isPlaying} />
        </div>

        <div className="chord-strip">
          {activeChordNames.map((chord) => (
            <div
              key={chord}
              className={`chord-cell ${synthState.isPlaying && synthState.currentChordName === chord ? 'current' : ''}`}
            >
              {chord}
            </div>
          ))}
        </div>

        <div className="controls-grid">
          <div className="knob-card">
            <div className="knob-top">
              <span>Tape Lowpass</span>
              <span className="knob-val">{synthState.cutoffHz} Hz</span>
            </div>
            <input
              type="range"
              min="320"
              max="2400"
              step="20"
              value={synthState.cutoffHz}
              onChange={(e) => ambientLoFi.setLowpassCutoff(Number(e.target.value))}
            />
          </div>

          <div className="knob-card">
            <div className="knob-top">
              <span>Vinyl Crackle</span>
              <span className="knob-val">{Math.round((synthState.crackleAmount / 0.2) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              value={synthState.crackleAmount}
              onChange={(e) => ambientLoFi.setCrackleAmount(Number(e.target.value))}
            />
          </div>

          <div className="knob-card">
            <div className="knob-top">
              <span>Tempo</span>
              <span className="knob-val">{synthState.bpm} BPM</span>
            </div>
            <input
              type="range"
              min="52"
              max="98"
              step="1"
              value={synthState.bpm}
              onChange={(e) => ambientLoFi.setBpm(Number(e.target.value))}
            />
          </div>

          <div className="knob-card">
            <div className="knob-top">
              <span>Master Gain</span>
              <span className="knob-val">{Math.round(synthState.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={synthState.volume}
              onChange={(e) => ambientLoFi.setMasterVolume(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <AudioPlayer
        synthState={synthState}
        onTogglePlay={handleTogglePlay}
        onToggleMute={() => ambientLoFi.setMuted(!synthState.isMuted)}
        onNextPreset={handleNextPreset}
      />
    </div>
  );
}
