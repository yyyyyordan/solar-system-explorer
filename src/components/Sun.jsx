import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SUN_RADIUS } from '../data/planets'

// The Sun is a self-illuminated emissive sphere with a soft outer glow.
// A real PointLight at the center drives all in-scene shadows + lighting.
export default function Sun({ onClick }) {
  const map = useTexture('/textures/sun.jpg')
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 16

  const surfaceRef = useRef()
  const haloRef = useRef()

  useFrame((_, dt) => {
    if (surfaceRef.current) surfaceRef.current.rotation.y += dt * 0.04
    if (haloRef.current) {
      const t = performance.now() * 0.0006
      const s = 1 + Math.sin(t) * 0.012
      haloRef.current.scale.setScalar(s)
    }
  })

  return (
    <group>
      {/* Real light source for the rest of the system. Decay is intentionally
          gentler than physical so outer planets stay visibly lit. */}
      <pointLight
        color="#fff1c8"
        intensity={5.5}
        distance={700}
        decay={0.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      {/* Ambient lifts the night sides without washing out shadows. */}
      <ambientLight intensity={0.32} />
      {/* Distant fill — fakes the diffuse glow of the Milky Way / nebula. */}
      <hemisphereLight color="#b6cdff" groundColor="#1f1a3a" intensity={0.26} />

      {/* Surface — emissive uses the same map so the sun glows in its true colors */}
      <mesh
        ref={surfaceRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[SUN_RADIUS, 96, 64]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>

      {/* Inner halo */}
      <mesh ref={haloRef} scale={1.07}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#ffd880"
          transparent
          opacity={0.28}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Mid corona */}
      <mesh scale={1.25}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#ffb050"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Outer corona */}
      <mesh scale={1.7}>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#ff8a30"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
