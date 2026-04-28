import { useStore } from '../store/useStore'
import { PLANETS, SUN_INFO } from '../data/planets'

const ALL = [SUN_INFO, ...PLANETS]

export default function InfoCard() {
  const focusedId = useStore((s) => s.focusedId)
  const clearFocus = useStore((s) => s.clearFocus)

  if (!focusedId) return null
  const body = ALL.find((p) => p.id === focusedId)
  if (!body) return null

  // For the swatch we use a small gradient that hints at the planet's hue.
  const swatchGradient = (() => {
    if (body.id === 'sun') {
      return 'radial-gradient(circle at 35% 30%, #fff5b8 0%, #ffb24a 60%, #b04a10 100%)'
    }
    const s = body.surface || {}
    const base = body.color
    return `radial-gradient(circle at 35% 30%, ${s.base || base} 0%, ${s.mid || base} 55%, ${s.dark || '#000'} 100%)`
  })()

  return (
    <aside className="info-card" role="dialog" aria-label={`${body.name} information`}>
      <button className="close" onClick={clearFocus} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6l-12 12" />
        </svg>
      </button>

      <div className="top">
        <div className="swatch" style={{ background: swatchGradient }} />
        <div>
          <h2>{body.name}</h2>
          <div className="tag">
            {body.id === 'sun' ? 'G-type star · system center' : 'Planet'}
          </div>
        </div>
      </div>

      <p>{body.facts}</p>

      <div className="stats">
        <div className="stat">
          <div className="k">Diameter</div>
          <div className="v">{body.diameter}</div>
        </div>
        <div className="stat">
          <div className="k">Orbital period</div>
          <div className="v">{body.period}</div>
        </div>
        <div className="stat" style={{ gridColumn: '1 / -1' }}>
          <div className="k">Distance from Sun</div>
          <div className="v">{body.distanceAU}</div>
        </div>
      </div>
    </aside>
  )
}
