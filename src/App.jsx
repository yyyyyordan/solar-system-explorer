import { useEffect, useState } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import InfoCard from './components/InfoCard'
import ChipRow from './components/ChipRow'
import Loader from './components/Loader'
import { EarthLabelsOverlay } from './components/EarthLabels'
import { useStore } from './store/useStore'

export default function App() {
  const [ready, setReady] = useState(false)
  const togglePause = useStore((s) => s.togglePause)
  const clearFocus = useStore((s) => s.clearFocus)

  // Mark the app as ready after the first paint so the loader fades out.
  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Keyboard shortcuts: space to pause, esc to deselect.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        togglePause()
      } else if (e.code === 'Escape') {
        clearFocus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePause, clearFocus])

  return (
    <div className="app">
      <div className="canvas-wrap">
        <Scene />
      </div>

      <header className="intro">
        <div className="eyebrow">Interactive · 3D</div>
        <h1>Solar System Explorer</h1>
        <div className="subtitle">Click any world to learn more</div>
      </header>

      <EarthLabelsOverlay />
      <ChipRow />
      <InfoCard />
      <HUD />
      <Loader ready={ready} />
    </div>
  )
}
