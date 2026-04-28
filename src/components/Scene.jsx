import { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import Sun from './Sun'
import Planet from './Planet'
import AsteroidBelt from './AsteroidBelt'
import CameraRig from './CameraRig'
import { EarthLabelsTracker } from './EarthLabels'
import { PLANETS } from '../data/planets'

const EARTH = PLANETS.find((p) => p.id === 'earth')
import { useStore } from '../store/useStore'

export default function Scene() {
  const controlsRef = useRef()
  const planetRefs = useRef({}) // { [id]: THREE.Object3D }
  const setFocus = useStore((s) => s.setFocus)
  const clearFocus = useStore((s) => s.clearFocus)

  const registerRef = (id, obj) => {
    planetRefs.current[id] = obj
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 32, 70], fov: 50, near: 0.1, far: 2000 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.4
      }}
      onPointerMissed={() => clearFocus()}
    >
      <color attach="background" args={['#04050a']} />

      {/* Subtle starfield — 6000 points, deep enough to feel infinite */}
      <Stars radius={400} depth={80} count={6000} factor={3.2} fade speed={0.3} />

      <Suspense fallback={null}>
        <Sun onClick={() => setFocus('sun')} />

        {PLANETS.map((p) => (
          <Planet key={p.id} planet={p} registerRef={registerRef} />
        ))}

        <AsteroidBelt inner={26} outer={31} count={2400} />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={0.7}
        maxDistance={300}
        makeDefault
      />

      <CameraRig controlsRef={controlsRef} planetRefs={planetRefs} />

      {/* Geographic-label tracker runs AFTER CameraRig so it sees the
          camera at its current-frame position. The DOM overlay that
          actually renders the labels lives outside the Canvas. */}
      <EarthLabelsTracker
        radius={EARTH.radius}
        earthGroupRef={{ get current() { return planetRefs.current.earth } }}
      />

      <EffectComposer>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
