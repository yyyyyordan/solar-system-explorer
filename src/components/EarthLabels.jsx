import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Geographic features placed by approximate lat/lon. Type drives both
// visibility threshold (zoom level) and styling.
export const FEATURES = [
  // Continents
  { name: 'North America', lat: 45, lon: -100, type: 'continent' },
  { name: 'South America', lat: -15, lon: -60, type: 'continent' },
  { name: 'Europe', lat: 54, lon: 15, type: 'continent' },
  { name: 'Africa', lat: 5, lon: 22, type: 'continent' },
  { name: 'Asia', lat: 50, lon: 90, type: 'continent' },
  { name: 'Australia', lat: -25, lon: 134, type: 'continent' },
  { name: 'Antarctica', lat: -82, lon: 0, type: 'continent' },

  // Oceans
  { name: 'Pacific Ocean', lat: 0, lon: -160, type: 'ocean' },
  { name: 'Atlantic Ocean', lat: 0, lon: -30, type: 'ocean' },
  { name: 'Indian Ocean', lat: -20, lon: 80, type: 'ocean' },
  { name: 'Arctic Ocean', lat: 84, lon: 0, type: 'ocean' },
  { name: 'Southern Ocean', lat: -65, lon: 0, type: 'ocean' },

  // Countries
  { name: 'United States', lat: 39.8, lon: -98.6, type: 'country' },
  { name: 'Canada', lat: 56.1, lon: -106.3, type: 'country' },
  { name: 'Mexico', lat: 23.6, lon: -102.5, type: 'country' },
  { name: 'Brazil', lat: -14.2, lon: -51.9, type: 'country' },
  { name: 'Argentina', lat: -38.4, lon: -63.6, type: 'country' },
  { name: 'Chile', lat: -35.7, lon: -71.5, type: 'country' },
  { name: 'Peru', lat: -9.2, lon: -75.0, type: 'country' },
  { name: 'Colombia', lat: 4.6, lon: -74.3, type: 'country' },
  { name: 'Greenland', lat: 71.7, lon: -42.6, type: 'country' },
  { name: 'United Kingdom', lat: 54.4, lon: -2.4, type: 'country' },
  { name: 'France', lat: 46.6, lon: 1.9, type: 'country' },
  { name: 'Germany', lat: 51.2, lon: 10.5, type: 'country' },
  { name: 'Spain', lat: 40.5, lon: -3.7, type: 'country' },
  { name: 'Italy', lat: 41.9, lon: 12.6, type: 'country' },
  { name: 'Norway', lat: 64.5, lon: 12.0, type: 'country' },
  { name: 'Sweden', lat: 60.1, lon: 18.6, type: 'country' },
  { name: 'Russia', lat: 61.5, lon: 90.0, type: 'country' },
  { name: 'China', lat: 35.9, lon: 104.2, type: 'country' },
  { name: 'India', lat: 22.0, lon: 79.0, type: 'country' },
  { name: 'Japan', lat: 36.2, lon: 138.3, type: 'country' },
  { name: 'Indonesia', lat: -2.5, lon: 117.0, type: 'country' },
  { name: 'Australia', lat: -25.3, lon: 133.8, type: 'country' },
  { name: 'New Zealand', lat: -41.0, lon: 173.0, type: 'country' },
  { name: 'Egypt', lat: 26.8, lon: 30.8, type: 'country' },
  { name: 'Nigeria', lat: 9.1, lon: 8.7, type: 'country' },
  { name: 'Kenya', lat: 0.0, lon: 37.9, type: 'country' },
  { name: 'South Africa', lat: -30.6, lon: 22.9, type: 'country' },
  { name: 'Saudi Arabia', lat: 23.9, lon: 45.1, type: 'country' },
  { name: 'Turkey', lat: 38.9, lon: 35.2, type: 'country' },
  { name: 'Iran', lat: 32.4, lon: 53.7, type: 'country' },
  { name: 'Pakistan', lat: 30.4, lon: 69.3, type: 'country' },

  // Seas
  { name: 'Mediterranean Sea', lat: 36, lon: 16, type: 'sea' },
  { name: 'Caribbean Sea', lat: 15, lon: -75, type: 'sea' },
  { name: 'Bering Sea', lat: 58, lon: -178, type: 'sea' },
  { name: 'Red Sea', lat: 22, lon: 38, type: 'sea' },
  { name: 'Black Sea', lat: 43, lon: 34, type: 'sea' },
  { name: 'North Sea', lat: 56, lon: 3, type: 'sea' },
  { name: 'Baltic Sea', lat: 58, lon: 20, type: 'sea' },
  { name: 'Sea of Japan', lat: 40, lon: 135, type: 'sea' },
  { name: 'South China Sea', lat: 14, lon: 116, type: 'sea' },
  { name: 'East China Sea', lat: 30, lon: 125, type: 'sea' },
  { name: 'Arabian Sea', lat: 14, lon: 65, type: 'sea' },
  { name: 'Bay of Bengal', lat: 14, lon: 88, type: 'sea' },
  { name: 'Gulf of Mexico', lat: 25, lon: -90, type: 'sea' },
  { name: 'Hudson Bay', lat: 60, lon: -85, type: 'sea' },
  { name: 'Persian Gulf', lat: 27, lon: 51, type: 'sea' },
  { name: 'Sea of Okhotsk', lat: 53, lon: 150, type: 'sea' },
  { name: 'Coral Sea', lat: -18, lon: 152, type: 'sea' },
  { name: 'Tasman Sea', lat: -38, lon: 162, type: 'sea' },

  // Cities
  { name: 'New York', lat: 40.7, lon: -74.0, type: 'city' },
  { name: 'Los Angeles', lat: 34.05, lon: -118.25, type: 'city' },
  { name: 'Chicago', lat: 41.88, lon: -87.63, type: 'city' },
  { name: 'Toronto', lat: 43.65, lon: -79.4, type: 'city' },
  { name: 'Mexico City', lat: 19.43, lon: -99.13, type: 'city' },
  { name: 'Bogotá', lat: 4.71, lon: -74.07, type: 'city' },
  { name: 'Lima', lat: -12.05, lon: -77.04, type: 'city' },
  { name: 'São Paulo', lat: -23.55, lon: -46.63, type: 'city' },
  { name: 'Rio de Janeiro', lat: -22.91, lon: -43.17, type: 'city' },
  { name: 'Buenos Aires', lat: -34.6, lon: -58.4, type: 'city' },
  { name: 'London', lat: 51.5, lon: -0.13, type: 'city' },
  { name: 'Paris', lat: 48.86, lon: 2.35, type: 'city' },
  { name: 'Madrid', lat: 40.42, lon: -3.7, type: 'city' },
  { name: 'Rome', lat: 41.9, lon: 12.5, type: 'city' },
  { name: 'Berlin', lat: 52.52, lon: 13.4, type: 'city' },
  { name: 'Stockholm', lat: 59.33, lon: 18.07, type: 'city' },
  { name: 'Moscow', lat: 55.76, lon: 37.62, type: 'city' },
  { name: 'Istanbul', lat: 41.01, lon: 28.98, type: 'city' },
  { name: 'Cairo', lat: 30.04, lon: 31.24, type: 'city' },
  { name: 'Lagos', lat: 6.52, lon: 3.38, type: 'city' },
  { name: 'Nairobi', lat: -1.29, lon: 36.82, type: 'city' },
  { name: 'Johannesburg', lat: -26.2, lon: 28.05, type: 'city' },
  { name: 'Cape Town', lat: -33.92, lon: 18.42, type: 'city' },
  { name: 'Dubai', lat: 25.27, lon: 55.3, type: 'city' },
  { name: 'Tehran', lat: 35.69, lon: 51.39, type: 'city' },
  { name: 'Karachi', lat: 24.86, lon: 67.0, type: 'city' },
  { name: 'Mumbai', lat: 19.08, lon: 72.88, type: 'city' },
  { name: 'Delhi', lat: 28.61, lon: 77.21, type: 'city' },
  { name: 'Bangkok', lat: 13.76, lon: 100.5, type: 'city' },
  { name: 'Singapore', lat: 1.35, lon: 103.82, type: 'city' },
  { name: 'Jakarta', lat: -6.2, lon: 106.85, type: 'city' },
  { name: 'Hong Kong', lat: 22.3, lon: 114.17, type: 'city' },
  { name: 'Beijing', lat: 39.9, lon: 116.4, type: 'city' },
  { name: 'Shanghai', lat: 31.23, lon: 121.47, type: 'city' },
  { name: 'Seoul', lat: 37.57, lon: 126.98, type: 'city' },
  { name: 'Tokyo', lat: 35.68, lon: 139.69, type: 'city' },
  { name: 'Manila', lat: 14.6, lon: 120.98, type: 'city' },
  { name: 'Sydney', lat: -33.87, lon: 151.21, type: 'city' },
  { name: 'Melbourne', lat: -37.81, lon: 144.96, type: 'city' },
  { name: 'Auckland', lat: -36.85, lon: 174.76, type: 'city' }
]

// SphereGeometry UV-aligned lat/lon → 3D point.
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function pickBucket(cameraDistanceRatio) {
  if (cameraDistanceRatio > 14) return null
  if (cameraDistanceRatio > 7) return 'continent'
  if (cameraDistanceRatio > 3.6) return 'country'
  return 'city'
}

const VISIBILITY = {
  continent: new Set(['continent', 'ocean']),
  country: new Set(['continent', 'ocean', 'country', 'sea']),
  city: new Set(['continent', 'ocean', 'country', 'sea', 'city'])
}

// Mutable shared state — written by the in-canvas tracker, read by the
// DOM-only overlay (rendered outside the canvas). Avoids React state
// thrash and the React-Three-Fiber/portal conflict.
const SHARED = {
  // For each feature key: { x, y, opacity }
  positions: new Map(),
  bucket: null,
  active: false, // true while focused on Earth (or close enough)
  tick: 0
}

// Inside-canvas component: each frame, computes earth's world matrix,
// projects every feature's lat/lon to a screen-space position, and
// writes it into SHARED.positions for the overlay to consume.
//
// Important: this MUST run after CameraRig has moved the camera for
// the current frame (otherwise labels project with stale camera state
// and end up in the wrong place relative to where Earth renders).
// The caller mounts it after CameraRig in Scene.jsx, and passes a
// ref to the Earth's tilt group so we can read its matrixWorld here.
export function EarthLabelsTracker({ radius, earthGroupRef }) {
  const { camera, size } = useThree()

  // Cache local positions per feature.
  const localPositions = useMemo(() => {
    const map = new Map()
    for (const f of FEATURES) {
      map.set(`${f.type}:${f.name}`, latLonToVec3(f.lat, f.lon, radius * 1.005))
    }
    return map
  }, [radius])

  // Reusable temporaries.
  const tmp = useMemo(
    () => ({
      worldPos: new THREE.Vector3(),
      earthCenter: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      toCam: new THREE.Vector3(),
      proj: new THREE.Vector3()
    }),
    []
  )

  useEffect(() => {
    SHARED.active = true
    return () => {
      SHARED.active = false
      SHARED.positions.clear()
      SHARED.bucket = null
      SHARED.tick++
    }
  }, [])

  useFrame(() => {
    const groupRef = earthGroupRef
    if (!groupRef?.current) return
    groupRef.current.updateWorldMatrix(true, false)
    const m = groupRef.current.matrixWorld
    tmp.earthCenter.setFromMatrixPosition(m)

    const distRatio = camera.position.distanceTo(tmp.earthCenter) / radius
    const next = pickBucket(distRatio)
    if (next !== SHARED.bucket) {
      SHARED.bucket = next
      SHARED.tick++
    }

    const halfW = size.width / 2
    const halfH = size.height / 2
    const allowed = next ? VISIBILITY[next] : null

    for (const f of FEATURES) {
      const key = `${f.type}:${f.name}`
      if (!allowed || !allowed.has(f.type)) {
        if (SHARED.positions.has(key)) {
          SHARED.positions.delete(key)
        }
        continue
      }
      // World position = Earth-rotation-matrix × local lat/lon point.
      tmp.worldPos.copy(localPositions.get(key)).applyMatrix4(m)
      // Front-or-back?
      tmp.normal.copy(tmp.worldPos).sub(tmp.earthCenter).normalize()
      tmp.toCam.copy(camera.position).sub(tmp.worldPos).normalize()
      const facing = tmp.normal.dot(tmp.toCam)

      let opacity = 0
      if (facing > 0.04) opacity = Math.min(1, (facing - 0.04) / 0.14)

      tmp.proj.copy(tmp.worldPos).project(camera)
      const inFrustum =
        tmp.proj.z > -1 &&
        tmp.proj.z < 1 &&
        Math.abs(tmp.proj.x) < 1.3 &&
        Math.abs(tmp.proj.y) < 1.3
      if (!inFrustum) opacity = 0

      SHARED.positions.set(key, {
        x: tmp.proj.x * halfW + halfW,
        y: -(tmp.proj.y * halfH) + halfH,
        opacity
      })
    }

  })

  // No scene contribution — we only need the useFrame side effect.
  return null
}

// Outside-canvas DOM overlay. Reads SHARED.positions every animation
// frame and updates each label's transform/opacity imperatively.
export function EarthLabelsOverlay() {
  const overlayRef = useRef()
  const labelRefs = useRef(new Map())
  // Force re-render when bucket changes (mounted features differ).
  const [bucket, setBucket] = useState(null)

  useEffect(() => {
    let raf
    const tick = () => {
      // Update each label's DOM imperatively.
      for (const [key, el] of labelRefs.current) {
        const p = SHARED.positions.get(key)
        if (!p || !SHARED.active) {
          if (el.style.opacity !== '0') el.style.opacity = '0'
          continue
        }
        el.style.transform = `translate(-50%, -50%) translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`
        el.style.opacity = p.opacity.toFixed(3)
      }
      // Re-render to track bucket transitions (which features are mounted).
      if (SHARED.bucket !== bucket) {
        setBucket(SHARED.bucket)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [bucket])

  const mounted = useMemo(() => {
    if (!bucket) return []
    const allowed = VISIBILITY[bucket]
    return FEATURES.filter((f) => allowed.has(f.type))
  }, [bucket])

  return (
    <div ref={overlayRef} className="geo-labels-overlay">
      {mounted.map((f) => {
        const key = `${f.type}:${f.name}`
        return (
          <div
            key={key}
            ref={(el) => {
              if (el) labelRefs.current.set(key, el)
              else labelRefs.current.delete(key)
            }}
            className={`geo-label geo-${f.type}`}
            style={{ position: 'absolute', top: 0, left: 0, opacity: 0, willChange: 'transform, opacity' }}
          >
            {f.type === 'city' && <span className="geo-dot" />}
            {f.name}
          </div>
        )
      })}
    </div>
  )
}

