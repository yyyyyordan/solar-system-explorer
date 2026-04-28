import { useEffect, useState } from 'react'

// Light-weight loading screen: fades out once the canvas is ready
// (signaled by the App after mount + a short delay so textures finish).
export default function Loader({ ready }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setHidden(true), 700)
    return () => clearTimeout(t)
  }, [ready])

  if (hidden) return null
  return (
    <div className={`loader ${ready ? 'fade-out' : ''}`}>
      <div>
        <div className="ring" />
        <div className="label">Initializing system…</div>
      </div>
    </div>
  )
}
