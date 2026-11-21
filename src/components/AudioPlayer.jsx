import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, VolumeX, SkipForward, Disc } from 'lucide-react';

export const AudioPlayer = ({
  synthState,
  onTogglePlay,
  onToggleMute,
  onNextPreset,
}) => {
  const [barHeights, setBarHeights] = useState([6, 10, 14, 12, 8, 16, 11, 9, 13, 10, 6]);

  useEffect(() => {
    if (!synthState.isPlaying || synthState.isMuted) {
      setBarHeights([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
      return undefined;
    }

    const interval = setInterval(() => {
      setBarHeights(
        Array.from({ length: 11 }, () => Math.floor(Math.random() * 18) + 6)
      );
    }, 130);

    return () => clearInterval(interval);
  }, [synthState.isPlaying, synthState.isMuted]);

  return (
    <div className="persistent-audio-player" role="region" aria-label="Procedural Lo-Fi Transport">
      <div className="player-left">
        <div className="disc-badge">
          <Disc size={18} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono-badge">
              {synthState.isPlaying ? 'SYNTH LIVE' : 'STANDBY'}
            </span>
            <span className="player-title">{synthState.presetLabel}</span>
          </div>
          <span className="player-meta">
            Chord: {synthState.currentChordName} · {synthState.bpm} BPM · LPF {synthState.cutoffHz} Hz
          </span>
        </div>
      </div>

      <div className="player-center">
        <div className="player-waveform-live">
          {barHeights.map((lvl, i) => (
            <span
              key={i}
              className="live-wave-bar"
              style={{
                height: `${lvl}px`,
                background: synthState.isPlaying && !synthState.isMuted ? '#FFFFFF' : '#3F3F46',
              }}
            />
          ))}
        </div>
      </div>

      <div className="player-right">
        <button
          type="button"
          className="btn"
          onClick={onToggleMute}
          title={synthState.isMuted ? 'Unmute Output' : 'Mute Output'}
        >
          {synthState.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          type="button"
          className="btn"
          onClick={onNextPreset}
          title="Next Chord Progression"
        >
          <SkipForward size={15} />
          <span>Next Loop</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onTogglePlay}
        >
          {synthState.isPlaying ? <Square size={14} /> : <Play size={14} />}
          <span>{synthState.isPlaying ? 'Stop Synth' : 'Start Synth'}</span>
        </button>
      </div>
    </div>
  );
};
