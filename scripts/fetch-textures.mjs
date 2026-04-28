// Fetches real planet textures into public/textures/ on first install.
// Sources:
//   - solarsystemscope.com (CC BY 4.0, 2K originals)
//   - threejs.org/examples/textures/planets (Earth normal + specular)
// Re-running is idempotent: existing files are skipped.

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'textures')

const SSS = 'https://www.solarsystemscope.com/textures/download'
const THREEJS = 'https://threejs.org/examples/textures/planets'

// Each asset has a primary URL and optional fallbacks. The first one
// that returns a sufficiently large response wins.
const ASSETS = [
  { name: 'sun.jpg', urls: [`${SSS}/2k_sun.jpg`] },
  { name: 'mercury.jpg', urls: [`${SSS}/2k_mercury.jpg`] },
  { name: 'venus.jpg', urls: [`${SSS}/2k_venus_atmosphere.jpg`, `${SSS}/2k_venus_surface.jpg`] },
  // Earth gets the 8K daymap so you can see countries when zoomed in.
  // Normal/specular stay at 2K (SSS only ships TIFs in 8K, which Three.js can't load).
  {
    name: 'earth.jpg',
    urls: [`${SSS}/8k_earth_daymap.jpg`, `${SSS}/2k_earth_daymap.jpg`, `${THREEJS}/earth_atmos_2048.jpg`]
  },
  { name: 'earth_normal.jpg', urls: [`${THREEJS}/earth_normal_2048.jpg`] },
  { name: 'earth_specular.jpg', urls: [`${THREEJS}/earth_specular_2048.jpg`] },
  {
    name: 'earth_clouds.jpg',
    urls: [`${SSS}/8k_earth_clouds.jpg`, `${SSS}/2k_earth_clouds.jpg`]
  },
  // NASA Black Marble city lights — 8K version from Solar System Scope.
  // Falls back to the threejs 2K version if the 8K URL is unreachable.
  { name: 'earth_lights.jpg', urls: [`${SSS}/8k_earth_nightmap.jpg`, `${THREEJS}/earth_lights_2048.png`] },
  { name: 'mars.jpg', urls: [`${SSS}/2k_mars.jpg`, `${THREEJS}/mars_1k_color.jpg`] },
  { name: 'jupiter.jpg', urls: [`${SSS}/2k_jupiter.jpg`] },
  { name: 'saturn.jpg', urls: [`${SSS}/2k_saturn.jpg`] },
  { name: 'saturn_rings.png', urls: [`${SSS}/2k_saturn_ring_alpha.png`] },
  { name: 'uranus.jpg', urls: [`${SSS}/2k_uranus.jpg`] },
  { name: 'neptune.jpg', urls: [`${SSS}/2k_neptune.jpg`] },
  { name: 'moon.jpg', urls: [`${SSS}/2k_moon.jpg`, `${THREEJS}/moon_1024.jpg`] }
]

await mkdir(OUT, { recursive: true })

let ok = 0
let fail = 0
for (const a of ASSETS) {
  const out = join(OUT, a.name)
  if (existsSync(out)) {
    console.log('· skip', a.name)
    ok++
    continue
  }
  let success = false
  for (const url of a.urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 5000) throw new Error('too small (' + buf.length + ' bytes)')
      await writeFile(out, buf)
      console.log('✓', a.name, '(' + (buf.length / 1024).toFixed(0) + ' kB)')
      success = true
      ok++
      break
    } catch (e) {
      console.log('  ✗', url, '-', e.message)
    }
  }
  if (!success) {
    fail++
    console.warn('FAILED:', a.name)
  }
}

console.log(`\nDone — ${ok} ok, ${fail} failed.`)
if (fail > 0) {
  // Don't fail the install — the app falls back to procedural textures
  // for any asset we couldn't fetch.
  process.exit(0)
}
