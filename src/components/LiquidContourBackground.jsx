import React, { useEffect, useRef } from 'react';
import { ambientLoFi } from '../services/ambientLoFiEngine.js';

export const LiquidContourBackground = ({ isPlaying }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const buffer = new Uint8Array(256);
    let animId = null;
    let phase = 0;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ambientLoFi.getWaveformData(buffer);
      phase += isPlaying ? 0.028 : 0.006;

      // Primary live oscilloscope wave
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isPlaying ? '#FFFFFF' : '#3F3F46';

      const sliceWidth = width / (buffer.length - 1);
      for (let i = 0; i < buffer.length; i++) {
        const sample = (buffer[i] - 128) / 128;
        const syntheticBreath = isPlaying
          ? Math.sin(i * 0.06 + phase) * 8
          : Math.sin(i * 0.04 + phase) * 2;
        const x = i * sliceWidth;
        const y = height * 0.5 + sample * (height * 0.36) + syntheticBreath;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary ghost harmonic contour
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#52525B';
      for (let i = 0; i < buffer.length; i++) {
        const sample = (buffer[i] - 128) / 128;
        const x = i * sliceWidth;
        const y = height * 0.5 + sample * (height * 0.18) + Math.cos(i * 0.05 - phase) * 12;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  return (
    <div
      className="liquid-canvas-container"
      style={{ position: 'relative', width: '100%', height: '220px', overflow: 'hidden' }}
    >
      <svg
        viewBox="0 0 700 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <circle
          cx="460"
          cy="130"
          r="210"
          stroke="#26262E"
          strokeWidth="1.2"
          strokeDasharray="18 12 240 24"
        />
        <circle
          cx="510"
          cy="145"
          r="150"
          stroke="#3F3F46"
          strokeWidth="1"
          strokeDasharray="180 32 60 40"
          opacity="0.7"
        />
        <path
          d="M 40 210 C 210 120, 420 55, 680 75"
          stroke="#26262E"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>

      <canvas
        ref={canvasRef}
        width={800}
        height={220}
        style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
