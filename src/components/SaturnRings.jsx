import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { makeRingTexture } from '../utils/textures'

// Flat ring rendered as a thin disk with a custom radial UV mapping
// so a 1D ring strip texture wraps from inner to outer radius.
//
// When `useReal` is true (Saturn) we use the SSS ring alpha PNG;
// otherwise we fall back to the procedural ring (Uranus's faint band).
export default function SaturnRings({ inner, outer, opacity = 1, useReal = false, fallbackColor = '#d8c08c' }) {
  const realTex = useTexture(`${import.meta.env.BASE_URL}textures/saturn_rings.png`)
  const procTex = useMemo(
    () => (useReal ? null : makeRingTexture({ hue: fallbackColor })),
    [useReal, fallbackColor]
  )
  const tex = useReal ? realTex : procTex
  if (tex) {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 16
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
  }

  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(inner, outer, 192, 8)
    // Re-map UVs so u = 0 at inner edge, u = 1 at outer edge.
    const pos = geo.attributes.position
    const uv = geo.attributes.uv
    const v3 = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i)
      const r = v3.length()
      const t = (r - inner) / (outer - inner)
      uv.setXY(i, t, 0.5)
    }
    uv.needsUpdate = true
    return geo
  }, [inner, outer])

  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} receiveShadow>
      <meshBasicMaterial
        map={tex}
        alphaMap={useReal ? realTex : null}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
