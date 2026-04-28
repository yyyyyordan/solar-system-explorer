import * as THREE from 'three'

/**
 * Procedural texture generators
 * --------------------------------
 * For each planet we generate three things from the same height field:
 *   - color map     (the visible surface)
 *   - normal map    (bumps, craters, banding shadows)
 *   - roughness map (where applicable — Earth oceans are smooth, land is rough)
 *
 * All three share a single Float32 height buffer so we only pay for noise
 * sampling once per planet.
 *
 * Resolution: 1536x768. Higher than v1 (was 1024x512) so detail holds up
 * when zoomed in, low enough to keep startup snappy.
 */

const W = 1536
const H = 768

// ---------- Hash-based pseudo-random ----------
function hash2D(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695040888963407) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff
}
function smoothstep(t) {
  return t * t * (3 - 2 * t)
}
function valueNoise(x, y, seed) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const a = hash2D(xi, yi, seed)
  const b = hash2D(xi + 1, yi, seed)
  const c = hash2D(xi, yi + 1, seed)
  const d = hash2D(xi + 1, yi + 1, seed)
  const u = smoothstep(xf)
  const v = smoothstep(yf)
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}
function fbm(x, y, octaves, seed, lacunarity = 2.0, gain = 0.5) {
  let sum = 0
  let amp = 1
  let freq = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i * 17)
    norm += amp
    amp *= gain
    freq *= lacunarity
  }
  return sum / norm
}
// "Ridged" noise — flips the noise around 0.5, sharpens, used for crisp
// mountain ridges and crater rims.
function ridge(x, y, octaves, seed) {
  let sum = 0
  let amp = 1
  let freq = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise(x * freq, y * freq, seed + i * 31)
    sum += amp * (1 - Math.abs(n - 0.5) * 2)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

// ---------- Color helpers ----------
function hexToRgb(hex) {
  const v = parseInt(hex.replace('#', ''), 16)
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
}
function lerpColor(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
function triLerp(dark, mid, base, t) {
  if (t < 0.5) return lerpColor(dark, mid, t * 2)
  return lerpColor(mid, base, (t - 0.5) * 2)
}
function withPoles(color, v, poleColor, fadeStart = 0.78) {
  const lat = Math.abs(v - 0.5) * 2
  if (lat < fadeStart) return color
  const t = (lat - fadeStart) / (1 - fadeStart)
  return lerpColor(color, poleColor, smoothstep(Math.min(1, t)))
}

// ---------- Canvas helpers ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}
function finalizeColor(canvas) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}
function finalizeData(canvas) {
  // Linear color space — these are *data* textures (normal/roughness).
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 16
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

// Compute a height field over the whole image for later reuse.
function buildHeights(heightFn) {
  const h = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1)
    for (let x = 0; x < W; x++) {
      const u = x / W
      h[y * W + x] = heightFn(u, v, x, y)
    }
  }
  return h
}

// Build a tangent-space normal map from a heightfield using central
// differences. Strength controls how "deep" the bumps appear.
function buildNormalMap(heights, strength = 6) {
  const canvas = makeCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(W, H)
  const data = img.data
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const xL = (x - 1 + W) % W
      const xR = (x + 1) % W
      const yU = Math.max(0, y - 1)
      const yD = Math.min(H - 1, y + 1)
      const dx = (heights[y * W + xR] - heights[y * W + xL]) * strength
      const dy = (heights[yD * W + x] - heights[yU * W + x]) * strength
      // Tangent-space normal: (-dx, -dy, 1) normalized
      const nx = -dx
      const ny = -dy
      const nz = 1
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      const i = (y * W + x) * 4
      data[i] = ((nx / len) * 0.5 + 0.5) * 255
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
      data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return finalizeData(canvas)
}

// Iterate every pixel and run a per-pixel coloring function.
function fillColors(fn) {
  const canvas = makeCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(W, H)
  const data = img.data
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1)
    for (let x = 0; x < W; x++) {
      const u = x / W
      const c = fn(u, v, x, y)
      const i = (y * W + x) * 4
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return finalizeColor(canvas)
}

// ---------- Sun ----------
export function makeSunTexture() {
  const canvas = makeCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(W, H)
  const data = img.data
  const core = hexToRgb('#fff8d8')
  const hot = hexToRgb('#ffc070')
  const deep = hexToRgb('#ff8a30')
  const seed = 7
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1)
    for (let x = 0; x < W; x++) {
      const u = x / W
      // Big convective cells
      const cells = fbm(u * 6, v * 3, 5, seed, 2.2, 0.55)
      // Small granulation
      const fine = fbm(u * 36, v * 18, 4, seed + 31, 2.4, 0.5)
      const tur = Math.abs(fine - 0.5) * 2
      // Ridge for plasma filaments
      const filament = ridge(u * 14, v * 7, 4, seed + 71)
      const t = Math.min(1, cells * 0.5 + tur * 0.5 + filament * 0.15)
      let c = triLerp(deep, hot, core, t)
      // Brighten plasma "granules"
      const gran = Math.pow(tur, 3) * 90
      c = [
        Math.min(255, c[0] + gran),
        Math.min(255, c[1] + gran * 0.85),
        Math.min(255, c[2] + gran * 0.4)
      ]
      const i = (y * W + x) * 4
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return finalizeColor(canvas)
}

// ---------- Generic rocky planet ----------
function rocky(opts) {
  const {
    surface,
    seed,
    octaves = 7,
    contrast = 1.2,
    scale = 6,
    ice = null,
    craters = false,
    bumpStrength = 8
  } = opts
  const dark = hexToRgb(surface.dark)
  const mid = hexToRgb(surface.mid)
  const base = hexToRgb(surface.base)
  const poleC = ice ? hexToRgb(ice) : null

  const heights = buildHeights((u, v) => {
    let n = fbm(u * scale * 2, v * scale, octaves, seed, 2.0, 0.55)
    if (craters) {
      // Crater field: subtract sharp inverted ridges
      const c = ridge(u * scale * 5, v * scale * 2.5, 5, seed + 91)
      n = Math.max(0, n - Math.pow(c, 4) * 0.5)
    }
    return n
  })

  const map = fillColors((u, v, x, y) => {
    const n = heights[y * W + x]
    let t = (n - 0.4) * contrast + 0.5
    t = Math.max(0, Math.min(1, t))
    let c = triLerp(dark, mid, base, t)
    if (poleC) c = withPoles(c, v, poleC)
    return c
  })

  const normalMap = buildNormalMap(heights, bumpStrength)
  return { map, normalMap }
}

// ---------- Earth (oceans + continents + spec) ----------
export function makeEarth() {
  const ocean = hexToRgb('#0a2c66')
  const oceanShallow = hexToRgb('#1f6cc0')
  const land = hexToRgb('#3d8c4a')
  const landDark = hexToRgb('#274d22')
  const desert = hexToRgb('#b07c4c')
  const ice = hexToRgb('#f4f7ff')
  const seed = 21

  // Domain warping makes continents look less round/blob-like.
  const heights = buildHeights((u, v) => {
    const wx = fbm(u * 3 + 0.7, v * 2.5, 4, seed + 33) - 0.5
    const wy = fbm(u * 3 + 1.3, v * 2.5 + 5.2, 4, seed + 47) - 0.5
    const continent = fbm(u * 3.5 + wx * 0.6, v * 2.8 + wy * 0.6, 6, seed, 2.0, 0.55)
    const detail = fbm(u * 16, v * 10, 5, seed + 5, 2.3, 0.5)
    return continent * 0.78 + detail * 0.22
  })

  // Aridness field used for biome — lush near equator, dry mid latitudes
  const aridness = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1)
    for (let x = 0; x < W; x++) {
      const u = x / W
      aridness[y * W + x] = fbm(u * 6, v * 5, 4, seed + 99)
    }
  }

  const map = fillColors((u, v, x, y) => {
    const h = heights[y * W + x]
    let c
    if (h < 0.46) {
      const depth = (0.46 - h) / 0.46
      c = lerpColor(oceanShallow, ocean, smoothstep(depth))
    } else if (h < 0.5) {
      const t = (h - 0.46) / 0.04
      c = lerpColor(oceanShallow, land, t)
    } else {
      const ar = aridness[y * W + x]
      const greenness = Math.max(0, 1 - Math.abs(v - 0.5) * 2.3)
      const t = Math.max(0, Math.min(1, ar * 1.6 - 0.4 + (1 - greenness) * 0.3))
      c = lerpColor(landDark, land, 1 - t)
      c = lerpColor(c, desert, t * 0.7)
    }
    c = withPoles(c, v, ice, 0.86)
    return c
  })

  // Roughness: oceans smooth (low), land rough (high)
  const roughCanvas = makeCanvas(W, H)
  {
    const ctx = roughCanvas.getContext('2d')
    const img = ctx.createImageData(W, H)
    const data = img.data
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const h = heights[y * W + x]
        // Oceans: ~0.35 (shiny). Land: ~0.95 (matte). Smooth blend across coast.
        let r
        if (h < 0.46) r = 0.35
        else if (h < 0.5) r = 0.35 + ((h - 0.46) / 0.04) * 0.6
        else r = 0.95
        const v8 = Math.round(r * 255)
        const i = (y * W + x) * 4
        data[i] = data[i + 1] = data[i + 2] = v8
        data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }
  const roughnessMap = finalizeData(roughCanvas)

  // Normal map only over land (oceans get flat normals so they reflect cleanly).
  const landHeights = new Float32Array(W * H)
  for (let i = 0; i < heights.length; i++) {
    landHeights[i] = heights[i] > 0.5 ? heights[i] : 0.5
  }
  const normalMap = buildNormalMap(landHeights, 12)

  return { map, normalMap, roughnessMap }
}

// ---------- Earth clouds (alpha-as-luminance) ----------
export function makeEarthClouds() {
  const canvas = makeCanvas(W, H)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  const img = ctx.getImageData(0, 0, W, H)
  const data = img.data
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1)
    for (let x = 0; x < W; x++) {
      const u = x / W
      // Banded warp — clouds stretch east-west, hurricanes spiral
      const warp = fbm(u * 3, v * 1.5, 3, 99) - 0.5
      const n = fbm(u * 10 + warp * 0.6, v * 5, 5, 99, 2.3, 0.55)
      const a = Math.max(0, n - 0.52) * 2.7
      const v8 = Math.min(255, a * 255)
      const i = (y * W + x) * 4
      data[i] = data[i + 1] = data[i + 2] = v8
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return finalizeColor(canvas)
}

// ---------- Banded gas giants ----------
function banded(opts) {
  const {
    surface,
    seed,
    bands = 18,
    swirl = 0.06,
    spot = null,
    scale = 6,
    vortices = 0,
    bumpStrength = 4
  } = opts
  const dark = hexToRgb(surface.dark)
  const mid = hexToRgb(surface.mid)
  const base = hexToRgb(surface.base)

  // Build a height field that captures band signal + turbulence.
  // We'll use the same field for color *and* the normal map so band
  // edges get subtle shadow detail.
  const heights = buildHeights((u, v) => {
    // Domain warp the latitude so bands undulate
    const warpY = fbm(u * 4, v * 2, 3, seed) - 0.5
    const vw = v + warpY * swirl
    const bandSignal = (Math.cos(vw * Math.PI * bands) + 1) * 0.5
    const turbulence = fbm(u * scale, v * scale * 1.5, 5, seed + 11, 2.4, 0.55)
    let h = bandSignal * 0.55 + turbulence * 0.45

    // Vortex storms — sprinkle a few oval perturbations
    for (let i = 0; i < vortices; i++) {
      const ux = ((seed * 13 + i * 71) % 100) / 100
      const vy = 0.32 + ((seed * 7 + i * 47) % 70) / 200
      const dx = u - ux
      const dy = v - vy
      const d = Math.sqrt(dx * dx * 1.2 + dy * dy * 6) // squashed ellipse
      if (d < 0.06) {
        const k = 1 - d / 0.06
        // swirl = boost height near center, dip at edge
        h += smoothstep(k) * 0.25
      }
    }
    return h
  })

  const map = fillColors((u, v, x, y) => {
    const t = Math.max(0, Math.min(1, heights[y * W + x]))
    let c = triLerp(dark, mid, base, t)

    if (spot) {
      const dx = (u - spot.u)
      const dy = (v - spot.v)
      const dist = Math.sqrt(dx * dx * 0.5 + dy * dy * 4)
      if (dist < 0.18) {
        const k = 1 - dist / 0.18
        const spotC = hexToRgb(spot.color)
        c = lerpColor(c, spotC, smoothstep(k) * 0.85)
      }
    }
    return c
  })

  const normalMap = buildNormalMap(heights, bumpStrength)
  return { map, normalMap }
}

// ---------- Public per-planet builders ----------
export const makeMercury = (s) =>
  rocky({ surface: s, seed: 3, octaves: 7, contrast: 1.5, scale: 8, craters: true, bumpStrength: 14 })

export const makeVenus = (s) =>
  rocky({ surface: s, seed: 5, octaves: 7, contrast: 1.0, scale: 5, bumpStrength: 6 })

export const makeMars = (s) =>
  rocky({
    surface: s,
    seed: 13,
    octaves: 7,
    contrast: 1.3,
    ice: '#f6f0ea',
    scale: 6,
    craters: true,
    bumpStrength: 10
  })

export const makeMoon = (s) =>
  rocky({ surface: s, seed: 41, octaves: 7, contrast: 1.6, scale: 9, craters: true, bumpStrength: 14 })

export const makeJupiter = (s) =>
  banded({
    surface: s,
    seed: 71,
    bands: 22,
    swirl: 0.1,
    spot: { u: 0.3, v: 0.62, color: '#9a3a18' },
    scale: 9,
    vortices: 4,
    bumpStrength: 5
  })

export const makeSaturn = (s) =>
  banded({ surface: s, seed: 83, bands: 18, swirl: 0.05, scale: 7, vortices: 2, bumpStrength: 4 })

export const makeUranus = (s) =>
  banded({ surface: s, seed: 91, bands: 6, swirl: 0.02, scale: 4, bumpStrength: 2 })

export const makeNeptune = (s) =>
  banded({ surface: s, seed: 113, bands: 10, swirl: 0.04, scale: 5, vortices: 3, bumpStrength: 3 })

// ---------- Saturn rings ----------
export function makeRingTexture(opts = {}) {
  const { hue = '#d8c08c' } = opts
  const w = 1024
  const canvas = makeCanvas(w, 8)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, 8)
  const data = img.data
  const base = hexToRgb(hue)
  const dark = hexToRgb('#7a6238')
  for (let x = 0; x < w; x++) {
    const r = x / (w - 1)
    // Multi-octave band signal — three frequencies stacked + noise
    let band =
      0.5 +
      0.22 * Math.sin(r * 80 + 1.3) +
      0.18 * Math.sin(r * 33 + 2.1) +
      0.12 * Math.sin(r * 160 + 0.5) +
      0.18 * (valueNoise(r * 110, 0.5, 17) - 0.5) * 2
    band = Math.max(0, Math.min(1, band))

    // Hard divisions
    const cassini = Math.abs(r - 0.55) < 0.02 ? 0 : 1
    const encke = Math.abs(r - 0.78) < 0.005 ? 0 : 1
    const inner = r < 0.06 ? r / 0.06 : 1
    const outer = r > 0.94 ? (1 - r) / 0.06 : 1
    const a = band * cassini * encke * inner * outer

    // Color also varies with band density
    const c = lerpColor(dark, base, band)
    for (let y = 0; y < 8; y++) {
      const i = (y * w + x) * 4
      data[i] = c[0]
      data[i + 1] = c[1]
      data[i + 2] = c[2]
      data[i + 3] = Math.round(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}
