# Contributing to lofi-music-generator

Keep patches lightweight, dependency-free on the DSP side, and tested.

## Running Checks

```bash
npm install
npm test
npm run build
```

## Style Notes

- Do not bundle binary `.mp3`, `.wav`, or `.ogg` loops; synthesize textures directly via `AudioContext`.
- Keep all UI buttons and badges monochrome (`#141418` fill, `#26262E` border, `#FFFFFF` active fill with `#000000` text).
