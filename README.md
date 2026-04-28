# Solar System Explorer

An interactive, browser-based 3D solar system simulation built with **React + Three.js** (`@react-three/fiber` + `@react-three/drei`). Click any world to focus the camera and read about it; pause, scrub speed, and reset the view from the bottom HUD.

## Features

- Glowing emissive Sun with corona, halo, and bloom postprocessing
- All 8 planets with axial tilt, self-rotation, and orbital motion
- Earth with cloud layer, atmospheric glow, and an orbiting Moon
- Saturn's banded rings and a fainter Uranus ring
- Asteroid belt of ~2,400 instanced bodies between Mars and Jupiter
- Subtle 6,000-point starfield background
- Smooth orbital trails that highlight on focus
- Click-to-focus camera with eased transitions; camera tracks moving planets
- Pause/play, logarithmic speed slider (0.05× → 20×), and reset view
- Glassmorphism HUD, info card with diameter / orbital period / distance, and a quick-jump chip row
- Keyboard shortcuts: `Space` to pause, `Esc` to deselect
- Responsive layout for desktop and tablet

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

To produce a production bundle:

```bash
npm run build
npm run preview
```

## How it's structured

```
src/
├── App.jsx                 # App shell, keyboard shortcuts, loader fade
├── main.jsx                # React entry
├── styles.css              # Dark futuristic UI styles
├── data/planets.js         # Planet constants: sizes, distances, colors, facts
├── store/useStore.js       # zustand store: paused, speed, focusedId
├── utils/textures.js       # Procedural canvas textures (no external assets)
└── components/
    ├── Scene.jsx           # Canvas + lights + bloom + OrbitControls
    ├── Sun.jsx             # Emissive sun + halo + sun-as-pointlight
    ├── Planet.jsx          # Planet body + atmosphere + rings + moon + label
    ├── Moon.jsx            # (inlined into Planet — Earth is the only host)
    ├── SaturnRings.jsx     # Ring disk with custom radial UV mapping
    ├── AsteroidBelt.jsx    # InstancedMesh belt with per-rock orbital state
    ├── OrbitTrail.jsx      # Circular line per orbit
    ├── CameraRig.jsx       # Click-to-focus camera tween + tracking
    ├── HUD.jsx             # Pause / speed slider / reset
    ├── InfoCard.jsx        # Focused-body info panel
    ├── ChipRow.jsx         # Planet quick-jump chips
    └── Loader.jsx          # Loading veil
```

## Asset sources

Real planetary textures are downloaded into `public/textures/` on first install by `scripts/fetch-textures.mjs` (also runs as `npm run postinstall`). Sources:

- **Solar System Scope** ([solarsystemscope.com/textures](https://www.solarsystemscope.com/textures/)) — 2K maps for the Sun, Mercury, Venus, Earth (day map + clouds), Mars, Jupiter, Saturn (surface + ring alpha), Uranus, Neptune, and the Moon. Licensed **CC BY 4.0** by Solar System Scope (Inove). Their data is derived from NASA imagery.
- **three.js examples** ([threejs.org/examples](https://threejs.org/examples/textures/planets/)) — Earth normal map and specular map. Public-domain NASA-derived data redistributed by the Three.js project.

The fetcher is idempotent and writes ~6 MB of JPGs/PNGs total. If a download fails for a given asset, the app falls back to a procedural canvas texture (defined in `src/utils/textures.js`) so it still runs.

## Notes on accuracy

Distances and sizes are **compressed for legibility**. Real ratios would either make every inner planet a sub-pixel speck or push Neptune off-screen. The simulation does preserve:

- Correct **ordering** and visual size hierarchy
- **Relative orbital periods** (Mercury fastest → Neptune slowest)
- **Axial tilts**, including Venus and Uranus rotating retrograde / sideways
- Identifying features (Saturn's rings, Earth's clouds + Moon, Jupiter's Great Red Spot)

## Tech

- React 18, Vite 5
- three.js 0.160
- @react-three/fiber 8, @react-three/drei 9, @react-three/postprocessing 2
- zustand 4
