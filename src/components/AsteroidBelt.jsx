import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'

// A single InstancedMesh of ~3000 small icosahedrons. Each instance gets
// its own orbital radius, angular speed, and tumble — but we update only
// a 4x4 matrix per frame, so the cost is negligible.
export default function AsteroidBelt({ inner = 26, outer = 31, count = 3000 }) {
  const meshRef = useRef()
  const speed = useStore((s) => s.speed)
  const paused = useStore((s) => s.paused)

  // Build per-instance state once. We mutate it each frame.
  const data = useMemo(() => {
    const arr = new Array(count)
    for (let i = 0; i < count; i++) {
      // Radius weighted to cluster near the middle of the belt
      const r = inner + Math.pow(Math.random(), 0.7) * (outer - inner)
      arr[i] = {
        radius: r,
        angle: Math.random() * Math.PI * 2,
        // Speed varies inversely with radius (roughly Keplerian feel)
        angular: (0.06 + Math.random() * 0.06) * (25 / r),
        // Slight vertical scatter — disks aren't paper-thin
        y: (Math.random() - 0.5) * 0.5,
        scale: 0.04 + Math.random() * 0.09,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.6
      }
    }
    return arr
  }, [count, inner, outer])

  // Reusable matrix to avoid allocations in the hot path.
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, dt) => {
    const mesh = meshRef.current
    if (!mesh) return
    const effective = paused ? 0 : dt * speed
    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      d.angle += d.angular * effective
      d.rotY += d.spin * effective
      const x = Math.cos(d.angle) * d.radius
      const z = Math.sin(d.angle) * d.radius
      dummy.position.set(x, d.y, z)
      dummy.rotation.set(d.rotX, d.rotY, d.rotZ)
      dummy.scale.setScalar(d.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#7a6f60" roughness={0.95} metalness={0.05} flatShading />
    </instancedMesh>
  )
}
