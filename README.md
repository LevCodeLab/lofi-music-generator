# lofi-music-generator

![Web Audio](https://img.shields.io/badge/Web_Audio_API-Procedural_DSP-141418?style=flat-square&color=141418&labelColor=26262E)
![Assets](https://img.shields.io/badge/Audio_Files-0_KB-141418?style=flat-square&color=141418&labelColor=26262E)
![Frontend](https://img.shields.io/badge/React-Vite-141418?style=flat-square&color=141418&labelColor=26262E)
![License](https://img.shields.io/badge/License-MIT-141418?style=flat-square&color=141418&labelColor=26262E)

Zero MP3 LoFi music and vinyl crackle generator built purely with the browser Web Audio API.

Streaming 50MB playlists on slow WiFi while debugging code felt silly. This tiny synth makes warm chords, sub bass, and dusty vinyl pops straight from math and 3am adrak chai. Zero `.mp3` or `.wav` files exist in this repo. It is not a missing folder bhai, it is pure browser math.

![lofi-music-generator preview](./assets/preview.svg)

## What it does

- Plays endless mellow jazz chords in your browser with zero audio files.
- Synthesizes warm vinyl dust pops and soft tape hiss in real time.
- Lets you slide tempo, tape warmth filter, crackle amount, and volume live.
- Draws a smooth 60fps wave on `<canvas>` from the live audio output.

## Run it in 60 seconds

```bash
git clone https://github.com/LevCodeLab/lofi-music-generator.git
cd lofi-music-generator
npm install
npm run dev
```

Open `http://localhost:5173` and click **Start Synth**.

Run unit tests anytime:

```bash
npm test
```

## Which file to edit

| File | What to change here |
| :--- | :--- |
| `src/services/ambientLoFiEngine.js` | Edit chord notes, BPM presets, filter warmth, and vinyl crackle math |
| `src/components/LiquidContourBackground.jsx` | Edit the live 60fps `<canvas>` wave visualizer |
| `src/components/AudioPlayer.jsx` | Edit the bottom play, stop, and mute bar |
| `src/App.jsx` | Edit preset buttons and live sliders |
| `test/engine.test.js` | Edit synth unit tests |

## License

MIT License. Clone it, break it, ship it.
