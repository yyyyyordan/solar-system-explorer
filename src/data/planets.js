// Planet definitions
//
// We use *visually believable* values rather than physically accurate ones:
// real ratios would either make planets invisible specks or push Neptune
// off-screen. Distances and sizes are compressed; orbital speeds keep their
// real *relative* ordering (Mercury fastest, Neptune slowest).

export const SUN_RADIUS = 5

export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    radius: 0.42,
    distance: 9,
    // Earth = 1; ratios from real orbital periods (1 / period in earth-days)
    orbitSpeed: 4.15,
    rotationSpeed: 0.017, // ~58.6 earth days per rotation -> very slow
    tilt: 0.034,
    color: '#a8a39c',
    surface: { base: '#8a857d', mid: '#5e564f', dark: '#2d2926' },
    facts: 'The smallest planet and closest to the Sun, with a heavily cratered surface much like our Moon. Days on Mercury are extreme — sunlit faces hit 430°C while shadowed sides plunge to -180°C.',
    diameter: '4,879 km',
    period: '88 Earth days',
    distanceAU: '0.39 AU (57.9M km)'
  },
  {
    id: 'venus',
    name: 'Venus',
    radius: 0.62,
    distance: 13,
    orbitSpeed: 1.62,
    rotationSpeed: -0.004, // retrograde
    tilt: 3.096, // tilted nearly upside down
    color: '#e8b878',
    surface: { base: '#e6c07a', mid: '#b88848', dark: '#7a4f1f' },
    atmosphere: { color: '#f5d8a0', opacity: 0.18 },
    facts: 'Veiled in thick sulfuric acid clouds, Venus is the hottest planet in the solar system at 465°C. Its atmosphere is so dense the surface pressure is 90× Earth’s — like being a kilometer deep in the ocean.',
    diameter: '12,104 km',
    period: '225 Earth days',
    distanceAU: '0.72 AU (108.2M km)'
  },
  {
    id: 'earth',
    name: 'Earth',
    radius: 0.66,
    distance: 18,
    orbitSpeed: 1.0,
    rotationSpeed: 0.4,
    tilt: 0.41, // 23.4°
    color: '#3b6cd7',
    surface: { base: '#1d4c8a', mid: '#3a8f4f', dark: '#0a2848' },
    atmosphere: { color: '#6ba9ff', opacity: 0.35 },
    moons: [
      {
        id: 'luna',
        name: 'Moon',
        radius: 0.18,
        distance: 1.5,
        orbitSpeed: 4.2,
        rotationSpeed: 0.05,
        color: '#cfc8c0',
        inclination: 0.09
      }
    ],
    facts: 'The only known world with liquid water on its surface and a magnetic field that shields life from solar wind. 71% of the surface is ocean; the atmosphere is 78% nitrogen and 21% oxygen.',
    diameter: '12,742 km',
    period: '365.25 days',
    distanceAU: '1.00 AU (149.6M km)'
  },
  {
    id: 'mars',
    name: 'Mars',
    radius: 0.52,
    distance: 23,
    orbitSpeed: 0.53,
    rotationSpeed: 0.39,
    tilt: 0.44,
    color: '#c25a3a',
    surface: { base: '#c25a3a', mid: '#7a3520', dark: '#3d1a10' },
    atmosphere: { color: '#e08a6a', opacity: 0.08 },
    moons: [
      // Phobos and Deimos — small captured-asteroid moons.
      { id: 'phobos', name: 'Phobos', radius: 0.05, distance: 0.85, orbitSpeed: 8.0, rotationSpeed: 0.4, color: '#9a8a7c', inclination: 0.02 },
      { id: 'deimos', name: 'Deimos', radius: 0.04, distance: 1.25, orbitSpeed: 3.6, rotationSpeed: 0.3, color: '#8a7a6c', inclination: 0.03 }
    ],
    facts: 'The "Red Planet" — its rust color comes from iron oxide dust. Mars hosts Olympus Mons, the tallest volcano in the solar system at 22 km, and Valles Marineris, a canyon system that spans 4,000 km.',
    diameter: '6,779 km',
    period: '687 Earth days',
    distanceAU: '1.52 AU (227.9M km)'
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    radius: 2.4,
    distance: 36,
    orbitSpeed: 0.084,
    rotationSpeed: 0.96, // fastest rotator — ~9.9hr day
    tilt: 0.054,
    color: '#d8a878',
    surface: { base: '#d8b88c', mid: '#a06b3c', dark: '#5e3818' },
    bands: 'jupiter',
    moons: [
      // Galilean moons — discovered by Galileo in 1610.
      { id: 'io', name: 'Io', radius: 0.16, distance: 3.4, orbitSpeed: 4.8, rotationSpeed: 0.3, color: '#e8c878', inclination: 0.02 },
      { id: 'europa', name: 'Europa', radius: 0.15, distance: 4.1, orbitSpeed: 3.4, rotationSpeed: 0.3, color: '#dccaa8', inclination: 0.01 },
      { id: 'ganymede', name: 'Ganymede', radius: 0.20, distance: 5.0, orbitSpeed: 2.4, rotationSpeed: 0.3, color: '#a89e94', inclination: 0.03 },
      { id: 'callisto', name: 'Callisto', radius: 0.18, distance: 6.0, orbitSpeed: 1.6, rotationSpeed: 0.3, color: '#7a7068', inclination: 0.04 }
    ],
    facts: 'A gas giant 318× more massive than Earth — heavy enough that all the other planets combined would fit inside it twice. The Great Red Spot is a 350-year-old storm wider than two Earths.',
    diameter: '139,820 km',
    period: '11.86 Earth years',
    distanceAU: '5.20 AU (778.5M km)'
  },
  {
    id: 'saturn',
    name: 'Saturn',
    radius: 2.0,
    distance: 48,
    orbitSpeed: 0.034,
    rotationSpeed: 0.9,
    tilt: 0.466, // 26.7°
    color: '#e6c878',
    surface: { base: '#e6d4a0', mid: '#b88c50', dark: '#7a5828' },
    bands: 'saturn',
    rings: { inner: 2.5, outer: 4.4, color: '#d8c08c' },
    moons: [
      // Major Saturnian moons (orbits start outside the ring system at ~9 units).
      { id: 'enceladus', name: 'Enceladus', radius: 0.07, distance: 9.5, orbitSpeed: 4.0, rotationSpeed: 0.3, color: '#f0f4f8', inclination: 0.01 },
      { id: 'rhea', name: 'Rhea', radius: 0.11, distance: 10.7, orbitSpeed: 2.7, rotationSpeed: 0.3, color: '#cfc8c0', inclination: 0.02 },
      { id: 'titan', name: 'Titan', radius: 0.16, distance: 12.0, orbitSpeed: 1.9, rotationSpeed: 0.3, color: '#d8a868', inclination: 0.05 },
      { id: 'iapetus', name: 'Iapetus', radius: 0.10, distance: 13.5, orbitSpeed: 1.2, rotationSpeed: 0.3, color: '#807a70', inclination: 0.27 }
    ],
    facts: 'Famous for its spectacular ring system — billions of icy fragments ranging from grains to house-sized chunks. Saturn is so low-density it would float in water, if you could find an ocean big enough.',
    diameter: '116,460 km',
    period: '29.46 Earth years',
    distanceAU: '9.58 AU (1.43B km)'
  },
  {
    id: 'uranus',
    name: 'Uranus',
    radius: 1.4,
    distance: 58,
    orbitSpeed: 0.0119,
    rotationSpeed: -0.45, // retrograde
    tilt: 1.706, // ~98° — tipped on its side
    color: '#9ad8d8',
    surface: { base: '#a8e2e0', mid: '#5fa8b8', dark: '#1d4a5a' },
    rings: { inner: 1.7, outer: 1.95, color: '#6a8a98', opacity: 0.5 },
    moons: [
      { id: 'miranda', name: 'Miranda', radius: 0.06, distance: 2.3, orbitSpeed: 4.2, rotationSpeed: 0.3, color: '#98908a', inclination: 0.07 },
      { id: 'titania', name: 'Titania', radius: 0.10, distance: 3.0, orbitSpeed: 2.5, rotationSpeed: 0.3, color: '#b0a89e', inclination: 0.02 },
      { id: 'oberon', name: 'Oberon', radius: 0.10, distance: 3.5, orbitSpeed: 1.8, rotationSpeed: 0.3, color: '#a0988e', inclination: 0.03 }
    ],
    facts: 'An ice giant tipped on its side — its rotation axis nearly aligns with its orbital plane, so each pole spends 42 years in continuous sunlight, then 42 years in darkness.',
    diameter: '50,724 km',
    period: '84 Earth years',
    distanceAU: '19.22 AU (2.87B km)'
  },
  {
    id: 'neptune',
    name: 'Neptune',
    radius: 1.36,
    distance: 66,
    orbitSpeed: 0.006,
    rotationSpeed: 0.54,
    tilt: 0.494,
    color: '#3658c8',
    surface: { base: '#3658c8', mid: '#1a368a', dark: '#0a1c4a' },
    bands: 'neptune',
    moons: [
      // Triton orbits retrograde (negative orbitSpeed) and is sharply inclined.
      { id: 'triton', name: 'Triton', radius: 0.13, distance: 2.5, orbitSpeed: -2.8, rotationSpeed: 0.3, color: '#d8c0c0', inclination: 0.45 }
    ],
    facts: 'The windiest planet — supersonic storms reach 2,100 km/h. Neptune was discovered through math: irregularities in Uranus’s orbit predicted its existence before any telescope confirmed it.',
    diameter: '49,244 km',
    period: '164.8 Earth years',
    distanceAU: '30.05 AU (4.50B km)'
  }
]

export const SUN_INFO = {
  id: 'sun',
  name: 'The Sun',
  facts: 'A G-type main-sequence star whose gravity holds the solar system together. The Sun fuses 600 million tons of hydrogen into helium every second, releasing the energy that powers all life on Earth.',
  diameter: '1,392,700 km',
  period: '—',
  distanceAU: '0 AU (center)',
  color: '#ffd66b'
}
