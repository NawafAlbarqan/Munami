import { useEffect, useState } from 'react'
import { animate } from 'motion'

// Animates a number tweening up to `target` whenever it changes — used for
// the headline "total spent" figure. Kept short (see CLAUDE.md's 200-400ms
// animation convention) so it reads as a polish detail, not a delay.
export function useCountUp(target, duration = 0.3) {
  const [value, setValue] = useState(target)

  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [target, duration])

  return value
}
