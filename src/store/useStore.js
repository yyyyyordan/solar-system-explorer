import { create } from 'zustand'

// Single source of truth for UI <-> scene state.
// Keeps the canvas free of React-y prop drilling for things like
// "what's focused" and "is the simulation paused?".
export const useStore = create((set) => ({
  paused: false,
  speed: 1,
  focusedId: null, // null | 'sun' | 'mercury' | ...
  resetTrigger: 0,

  togglePause: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
  setFocus: (id) => set({ focusedId: id }),
  clearFocus: () => set({ focusedId: null }),
  resetView: () =>
    set((s) => ({
      focusedId: null,
      resetTrigger: s.resetTrigger + 1
    }))
}))
