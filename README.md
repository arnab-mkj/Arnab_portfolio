# Arnab Mukherjee — Portfolio

Personal portfolio of Arnab Mukherjee, computational scientist: scientific computing, HPC, computational physics, photonics and scientific machine learning.
Live: https://arnabmkj.netlify.app/

Plain static site (`index.html`, `style.css`, `app.js`). No build step, no dependencies.

## Features
- **Live wave-interference hero.** Your cursor is a coherent light source. Click to add emitters, double-click to reset.
- **Simulation Lab.** Three live in-browser simulations:
  - *PDE solver:* Gray–Scott reaction–diffusion with an explicit finite-difference scheme. Draw on it to add seeds.
  - *Wave optics:* scalar Huygens–Fresnel simulation of a metasurface lens, showing focusing and chromatic aberration.
  - *Parallel computing:* a strong-scaling benchmark that splits Monte Carlo π across Web Workers, with a speedup chart and table.
- **Command palette.** `Ctrl/⌘ + K` or `/` jumps to sections, toggles the theme, copies the email and more.
- Light/dark theme (remembered), scroll progress, reveal animations, tilt cards, project filters and an expandable experience timeline.
- Tic-tac-toe against a minimax AI (🎮), plus a Konami-code easter egg.
- Respects `prefers-reduced-motion` and works on mobile.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.
