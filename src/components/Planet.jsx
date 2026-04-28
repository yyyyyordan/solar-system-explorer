import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import SaturnRings from './SaturnRings'
import OrbitTrail from './OrbitTrail'
import { useStore } from '../store/useStore'

// Real-photographic textures live in /public/textures (downloaded by
// scripts/fetch-textures.mjs). Each planet has an albedo map; rocky
// bodies reuse it as a bumpMap so craters and ridges cast shadows.
//
// Earth additionally uses a normal map, an inverted-specular roughness
// map (oceans → low roughness → reflective), and a separate clouds layer.

// Per-planet material tuning. Most planets are matte (high roughness, low
// metalness). Earth uses a roughness map. Gas giants get slightly lower
// roughness so the bands catch a soft highlight.
const MATERIAL_OVERRIDES = {
  earth: { roughness: 0.65, metalness: 0.05, bumpScale: 0.018 },
  mercury: { roughness: 0.95, metalness: 0.02, bumpScale: 0.04 },
  venus: { roughness: 0.85, metalness: 0.0, bumpScale: 0.01 },
  mars: { roughness: 0.92, metalness: 0.02, bumpScale: 0.05 },
  jupiter: { roughness: 0.6, metalness: 0.0, bumpScale: 0.0 },
  saturn: { roughness: 0.6, metalness: 0.0, bumpScale: 0.0 },
  uranus: { roughness: 0.55, metalness: 0.0, bumpScale: 0.0 },
  neptune: { roughness: 0.55, metalness: 0.0, bumpScale: 0.0 }
}

// For rocky bodies we drive bump from the albedo (cheap and effective).
const ROCKY = new Set(['mercury', 'venus', 'mars'])

// Shader injection for Earth's night-side city lights. We use the world
// position of each fragment + the world normal, and the fact that the Sun
// sits at the origin: dot(normal, -worldPos) tells us how lit the surface
// is. We then *multiply* the emissive map by the night factor so lights
// only appear on the dark side.
function earthNightLights(shader) {
  shader.vertexShader = shader.vertexShader.replace(
    'void main() {',
    `varying vec3 vWPosX;
     varying vec3 vWNormalX;
     void main() {`
  )
  shader.vertexShader = shader.vertexShader.replace(
    '#include <project_vertex>',
    `#include <project_vertex>
     vWPosX = (modelMatrix * vec4(transformed, 1.0)).xyz;
     vWNormalX = normalize(mat3(modelMatrix) * normal);`
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    'void main() {',
    `varying vec3 vWPosX;
     varying vec3 vWNormalX;
     void main() {`
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <emissivemap_fragment>',
    `#ifdef USE_EMISSIVEMAP
       vec4 emissiveColor = texture2D( emissiveMap, vMapUv );
       vec3 toSun = normalize(-vWPosX);
       float dayness = max(dot(normalize(vWNormalX), toSun), 0.0);
       // Lights ramp up smoothly through twilight.
       float nightFactor = smoothstep(0.0, 0.4, 1.0 - dayness);
       totalEmissiveRadiance *= emissiveColor.rgb * nightFactor;
     #endif`
  )
}

export default function Planet({ planet, registerRef }) {
  const orbitPivot = useRef()
  const tiltGroup = useRef()
  const planetRef = useRef()  // group: planet's self-rotation
  const meshRef = useRef()    // the actual sphere mesh (for label occlusion)
  const cloudRef = useRef()
  // Moon refs — each entry is { pivot, mesh } for one moon.
  const moonRefs = useRef([])

  const speed = useStore((s) => s.speed)
  const paused = useStore((s) => s.paused)
  const focusedId = useStore((s) => s.focusedId)
  const setFocus = useStore((s) => s.setFocus)
  const isFocused = focusedId === planet.id

  // Always load the planet's albedo. Add Earth-specific maps if needed.
  const map = useTexture(`/textures/${planet.id}.jpg`)
  const earthMaps = useTexture(
    planet.id === 'earth'
      ? {
          normalMap: '/textures/earth_normal.jpg',
          specMap: '/textures/earth_specular.jpg',
          cloudsMap: '/textures/earth_clouds.jpg',
          lightsMap: '/textures/earth_lights.jpg'
        }
      : { _placeholder: '/textures/moon.jpg' } // useTexture needs at least one
  )
  // All moons share the moon.jpg map; per-moon `color` tints the material.
  const moonMap = useTexture('/textures/moon.jpg')
  moonMap.colorSpace = THREE.SRGBColorSpace
  moonMap.anisotropy = 16

  const moons = planet.moons || []

  const { gl } = useThree()
  // Use the GPU's full anisotropic-filtering capability — typically 16 on
  // modern hardware. This is what stops textures looking "blocky" at
  // glancing angles when zoomed in.
  const maxAniso = useMemo(() => gl.capabilities.getMaxAnisotropy?.() ?? 16, [gl])

  // Configure each loaded texture once.
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = maxAniso
    map.minFilter = THREE.LinearMipmapLinearFilter
    map.magFilter = THREE.LinearFilter
    map.generateMipmaps = true
    map.needsUpdate = true
  }, [map, maxAniso])

  // For Earth, configure the auxiliary maps the same way.
  useMemo(() => {
    if (planet.id !== 'earth') return
    for (const key of ['normalMap', 'specMap', 'cloudsMap', 'lightsMap']) {
      const tex = earthMaps[key]
      if (!tex) continue
      tex.anisotropy = maxAniso
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
      // Lights and clouds are color-data; normal/spec are linear data.
      tex.colorSpace =
        key === 'cloudsMap' || key === 'lightsMap' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      tex.needsUpdate = true
    }
  }, [planet.id, earthMaps, maxAniso])

  // Earth: invert the specular map → roughness map. Specular = bright on
  // oceans (water reflects), so bright pixels should map to *low* roughness.
  // We process pixels once into a CanvasTexture.
  const earthRoughness = useMemo(() => {
    if (planet.id !== 'earth' || !earthMaps.specMap?.image) return null
    const src = earthMaps.specMap.image
    const c = document.createElement('canvas')
    c.width = src.width
    c.height = src.height
    const ctx = c.getContext('2d')
    ctx.drawImage(src, 0, 0)
    const img = ctx.getImageData(0, 0, c.width, c.height)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      // Invert so water (originally bright in spec map) becomes dark
      // (low roughness). Land (dark in spec) becomes bright (high roughness).
      d[i] = 255 - d[i]
      d[i + 1] = 255 - d[i + 1]
      d[i + 2] = 255 - d[i + 2]
    }
    ctx.putImageData(img, 0, 0)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.NoColorSpace
    tex.anisotropy = 16
    return tex
  }, [planet.id, earthMaps.specMap])

  // Stagger initial orbit phase so planets don't line up at t=0.
  const startAngle = useMemo(() => {
    let h = 0
    for (let i = 0; i < planet.id.length; i++) h = (h * 31 + planet.id.charCodeAt(i)) | 0
    return ((h >>> 0) % 1000) / 1000 * Math.PI * 2
  }, [planet.id])
  useMemo(() => {
    if (orbitPivot.current) orbitPivot.current.rotation.y = startAngle
  }, [startAngle])

  useFrame((_, dt) => {
    const dtScaled = paused ? 0 : dt * speed
    if (orbitPivot.current) orbitPivot.current.rotation.y += dtScaled * planet.orbitSpeed * 0.15
    if (planetRef.current) planetRef.current.rotation.y += dtScaled * planet.rotationSpeed
    if (cloudRef.current) cloudRef.current.rotation.y += dtScaled * (planet.rotationSpeed + 0.05)
    for (let i = 0; i < moons.length; i++) {
      const r = moonRefs.current[i]
      if (!r) continue
      if (r.pivot) r.pivot.rotation.y += dtScaled * moons[i].orbitSpeed
      if (r.mesh) r.mesh.rotation.y += dtScaled * moons[i].rotationSpeed
    }
  })

  const onMountTilt = (el) => {
    tiltGroup.current = el
  }
  // Register the *rotating* group (self-rotation) so callers can read
  // Earth's full transform — including its day/night spin — for things
  // like geographic labels. World position is the same as the tilt group.
  const onMountRotating = (el) => {
    planetRef.current = el
    if (el) registerRef?.(planet.id, el)
  }

  const mat = MATERIAL_OVERRIDES[planet.id] || { roughness: 0.85, metalness: 0.02, bumpScale: 0 }
  const useAlbedoBump = ROCKY.has(planet.id)

  return (
    <>
      <OrbitTrail radius={planet.distance} highlighted={isFocused} />

      <group ref={orbitPivot}>
        <group position={[planet.distance, 0, 0]} ref={onMountTilt}>
          <group rotation={[0, 0, planet.tilt]}>
            {/* Rotating group: mesh + Earth labels rotate together so labels
                stay glued to their lat/lon. */}
            <group ref={onMountRotating}>
              <mesh
                ref={meshRef}
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation()
                  setFocus(planet.id)
                }}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  document.body.style.cursor = 'pointer'
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto'
                }}
              >
                {/* High segment count keeps the silhouette smooth at extreme zoom. */}
                <sphereGeometry args={[planet.radius, planet.id === 'earth' ? 256 : 128, planet.id === 'earth' ? 192 : 96]} />
                <meshStandardMaterial
                  map={map}
                  bumpMap={useAlbedoBump ? map : undefined}
                  bumpScale={mat.bumpScale}
                  normalMap={planet.id === 'earth' ? earthMaps.normalMap : undefined}
                  normalScale={
                    planet.id === 'earth' ? new THREE.Vector2(1.2, 1.2) : new THREE.Vector2(1, 1)
                  }
                  roughnessMap={planet.id === 'earth' ? earthRoughness : undefined}
                  roughness={mat.roughness}
                  metalness={mat.metalness}
                  // Earth gets the city-lights emissive map (only visible on
                  // the night side, via the shader injection above).
                  emissiveMap={planet.id === 'earth' ? earthMaps.lightsMap : undefined}
                  emissive={planet.id === 'earth' ? '#ffc888' : '#0a0d18'}
                  emissiveIntensity={planet.id === 'earth' ? 1.6 : 0.08}
                  onBeforeCompile={planet.id === 'earth' ? earthNightLights : undefined}
                />
              </mesh>
              {/* The Earth labels tracker is mounted in Scene.jsx so it
                  runs after CameraRig, and the DOM overlay sits outside
                  the Canvas. */}
            </group>

            {/* Earth clouds — separate translucent shell using clouds.jpg as alphaMap. */}
            {planet.id === 'earth' && earthMaps.cloudsMap && (
              <mesh ref={cloudRef} scale={1.012}>
                <sphereGeometry args={[planet.radius, 96, 64]} />
                <meshStandardMaterial
                  alphaMap={earthMaps.cloudsMap}
                  transparent
                  color="#ffffff"
                  roughness={1}
                  depthWrite={false}
                  opacity={0.9}
                />
              </mesh>
            )}

            {/* Atmospheric rim glow */}
            {planet.atmosphere && (
              <mesh scale={1.06}>
                <sphereGeometry args={[planet.radius, 64, 48]} />
                <meshBasicMaterial
                  color={planet.atmosphere.color}
                  transparent
                  opacity={planet.atmosphere.opacity}
                  side={THREE.BackSide}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )}

            {planet.rings && (
              <SaturnRings
                inner={planet.radius * planet.rings.inner}
                outer={planet.radius * planet.rings.outer}
                opacity={planet.rings.opacity ?? 1}
                useReal={planet.id === 'saturn'}
                fallbackColor={planet.rings.color}
              />
            )}
          </group>

          {/* Moons — each gets its own pivot (tilted by inclination) */}
          {moons.map((m, idx) => (
            <group
              key={m.id}
              rotation={[m.inclination || 0, 0, 0]}
              ref={(el) => {
                moonRefs.current[idx] = moonRefs.current[idx] || {}
                moonRefs.current[idx].pivot = el
              }}
            >
              <mesh
                position={[m.distance, 0, 0]}
                castShadow
                receiveShadow
                ref={(el) => {
                  moonRefs.current[idx] = moonRefs.current[idx] || {}
                  moonRefs.current[idx].mesh = el
                }}
              >
                <sphereGeometry args={[m.radius, 48, 32]} />
                <meshStandardMaterial
                  map={moonMap}
                  bumpMap={moonMap}
                  bumpScale={0.025}
                  color={m.color || '#cfc8c0'}
                  roughness={0.95}
                  metalness={0.0}
                  emissive="#0a0c14"
                  emissiveIntensity={0.06}
                />
              </mesh>
            </group>
          ))}

          <Html
            center
            position={[0, planet.radius + 0.45, 0]}
            distanceFactor={null}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[20, 0]}
          >
            <div className="planet-label" style={{ opacity: isFocused ? 1 : 0.85 }}>
              {planet.name}
            </div>
          </Html>
        </group>
      </group>
    </>
  )
}
