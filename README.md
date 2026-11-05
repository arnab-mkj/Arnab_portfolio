# Arnab Mukherjee — Portfolio

Personal portfolio of Arnab Mukherjee: computational optics, metasurfaces and scientific machine learning.
Live: https://arnabmkj.netlify.app/

Plain static site (`index.html`, `style.css`, `app.js`). No build step, no dependencies.

## Features
- **Live wave-interference hero.** Your cursor is a coherent light source. Click to add emitters, double-click to reset.
- **Metalens Lab.** A real scalar Huygens–Fresnel simulation of a metasurface lens that runs in the browser. Tune wavelength, focal length, aperture and design wavelength to see focusing and chromatic aberration.
- **Command palette.** `Ctrl/⌘ + K` or `/` jumps to sections, toggles the theme, copies the email and more.
- Light/dark theme (remembered), scroll progress, reveal animations, tilt cards, project filters and an expandable experience timeline.
- Tic-tac-toe against a minimax AI (🎮), plus a Konami-code easter egg.
- Respects `prefers-reduced-motion` and works on mobile.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.
