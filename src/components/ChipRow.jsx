import { useStore } from '../store/useStore'
import { PLANETS, SUN_INFO } from '../data/planets'

const ITEMS = [SUN_INFO, ...PLANETS]

export default function ChipRow() {
  const focusedId = useStore((s) => s.focusedId)
  const setFocus = useStore((s) => s.setFocus)

  return (
    <nav className="chip-row" aria-label="Jump to planet">
      {ITEMS.map((b) => (
        <button
          key={b.id}
          className={`chip ${focusedId === b.id ? 'active' : ''}`}
          onClick={() => setFocus(b.id)}
        >
          {b.name}
        </button>
      ))}
    </nav>
  )
}
