import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { SUN_RADIUS, PLANETS } from '../data/planets'

const HOME_POS = new THREE.Vector3(0, 32, 70)
const HOME_TARGET = new THREE.Vector3(0, 0, 0)

// Keeps the camera + OrbitControls target glued to whichever object
// is focused — and gently lerps both into place when focus changes.
export default function CameraRig({ controlsRef, planetRefs }) {
  const { camera } = useThree()
  const focusedId = useStore((s) => s.focusedId)
  const resetTrigger = useStore((s) => s.resetTrigger)

  // Tween state
  const animating = useRef(false)
  const animProgress = useRef(0)
  const fromPos = useRef(new THREE.Vector3())
  const fromTarget = useRef(new THREE.Vector3())
  const toPos = useRef(new THREE.Vector3())
  const toTarget = useRef(new THREE.Vector3())

  const tmpTarget = useRef(new THREE.Vector3())
  const tmpOffset = useRef(new THREE.Vector3())

  // Compute desired camera + target pair for current focus.
  function getDesired() {
    if (!focusedId) {
      return { target: HOME_TARGET.clone(), pos: HOME_POS.clone() }
    }
    if (focusedId === 'sun') {
      const target = new THREE.Vector3(0, 0, 0)
      const pos = new THREE.Vector3(0, SUN_RADIUS * 1.5, SUN_RADIUS * 5)
      return { target, pos }
    }
    const planet = PLANETS.find((p) => p.id === focusedId)
    const ref = planetRefs.current[focusedId]
    if (!planet || !ref) return null
    const target = new THREE.Vector3()
    ref.getWorldPosition(target)
    // Camera slot: relative to the planet's *current* position, pulled out
    // by a ratio of its radius. Approach from a flattering angle.
    // Closer for small planets so you can see country-level detail.
    const dist = Math.max(planet.radius * 3.5, 2.0)
    const dir = new THREE.Vector3()
      .copy(target)
      .normalize() // direction from sun to planet
    const offset = new THREE.Vector3(dir.x, 0.4, dir.z).normalize().multiplyScalar(dist)
    const pos = target.clone().add(offset)
    return { target, pos }
  }

  // Begin a tween whenever focus changes (or reset is triggered).
  useEffect(() => {
    const desired = getDesired()
    if (!desired) return
    fromPos.current.copy(camera.position)
    fromTarget.current.copy(controlsRef.current?.target ?? HOME_TARGET)
    toPos.current.copy(desired.pos)
    toTarget.current.copy(desired.target)
    animProgress.current = 0
    animating.current = true
  }, [focusedId, resetTrigger])

  useFrame((_, dt) => {
    const controls = controlsRef.current
    if (!controls) return

    if (animating.current) {
      animProgress.current = Math.min(1, animProgress.current + dt * 1.4)
      const t = easeInOutCubic(animProgress.current)
      camera.position.lerpVectors(fromPos.current, toPos.current, t)
      controls.target.lerpVectors(fromTarget.current, toTarget.current, t)

      if (animProgress.current >= 1) animating.current = false
      controls.update()
      return
    }

    // While focused, keep the orbit-controls target glued to the moving planet
    // so user-driven zoom/rotate stays centered on it.
    if (focusedId && focusedId !== 'sun') {
      const ref = planetRefs.current[focusedId]
      if (ref) {
        const newTarget = tmpTarget.current
        ref.getWorldPosition(newTarget)
        // Translate camera by the same delta so the user-chosen viewing angle
        // is preserved as the planet moves.
        tmpOffset.current.copy(newTarget).sub(controls.target)
        camera.position.add(tmpOffset.current)
        controls.target.copy(newTarget)
        controls.update()
      }
    }
  })

  return null
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
