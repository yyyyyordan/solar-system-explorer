import { useMemo } from 'react'
import * as THREE from 'three'

// Smooth circular trail rendered as a Line. Subtle by default — turns up
// when the planet is the active focus to make selection obvious.
export default function OrbitTrail({ radius, segments = 256, highlighted = false }) {
  const points = useMemo(() => {
    const arr = []
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      arr.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return arr
  }, [radius, segments])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color={highlighted ? '#9bc7ff' : '#5a6b8a'}
        transparent
        opacity={highlighted ? 0.65 : 0.18}
      />
    </line>
  )
}
