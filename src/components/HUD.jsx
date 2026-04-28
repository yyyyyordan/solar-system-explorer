import { useStore } from '../store/useStore'

// SVG icons — kept inline so we don't add a deps just for icons.
const Icon = {
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5v14l12-7z" />
    </svg>
  ),
  Pause: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  ),
  Reset: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  )
}

export default function HUD() {
  const { paused, speed, togglePause, setSpeed, resetView } = useStore()

  // Slider runs 0..200, mapped to logarithmic 0.05× .. 20×
  const sliderToSpeed = (s) => {
    const t = s / 200
    return Math.round(Math.pow(10, -1.3 + t * 2.6) * 100) / 100
  }
  const speedToSlider = (sp) => {
    const t = (Math.log10(sp) + 1.3) / 2.6
    return Math.round(t * 200)
  }
  const sliderVal = speedToSlider(speed)
  const pct = (sliderVal / 200) * 100

  return (
    <div className="hud" role="toolbar" aria-label="Simulation controls">
      <button
        className="icon-btn"
        onClick={togglePause}
        aria-label={paused ? 'Resume' : 'Pause'}
        title={paused ? 'Resume (space)' : 'Pause (space)'}
      >
        {paused ? <Icon.Play /> : <Icon.Pause />}
      </button>

      <div className="divider" />

      <div className="speed">
        <label>Speed</label>
        <input
          type="range"
          min={0}
          max={200}
          value={sliderVal}
          onChange={(e) => setSpeed(sliderToSpeed(parseInt(e.target.value, 10)))}
          style={{ '--pct': `${pct}%` }}
          aria-label="Simulation speed"
        />
        <div className="val">{speed.toFixed(2)}×</div>
      </div>

      <div className="divider" />

      <button
        className="icon-btn"
        onClick={resetView}
        aria-label="Reset view"
        title="Reset view"
      >
        <Icon.Reset />
      </button>

      <div className="divider" />

      <div className="hint">Drag · Scroll · Click planets</div>
    </div>
  )
}
