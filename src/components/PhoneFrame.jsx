import { useEffect, useState } from 'react'
import { useTheme } from '../lib/ThemeContext'

// Demo chrome only — wraps the app in a realistic phone device frame so it
// reads as "an app on a phone" on a presentation screen. Purely presentational;
// none of these colors are part of the app's own design system (see CLAUDE.md).

// The screen is ALWAYS 400×844 internally (real iPhone proportions), so the
// layout never gets compressed. On shorter/narrower viewports the whole frame
// is scaled down with transform — like viewing the same phone from farther
// away — instead of squishing the content into a stubby box.
const SCREEN_W = 400
const SCREEN_H = 844
const BEZEL = 12 // matches p-3 on the frame div

export default function PhoneFrame({ children }) {
  const { theme } = useTheme()
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function update() {
      const frameW = SCREEN_W + BEZEL * 2
      const frameH = SCREEN_H + BEZEL * 2
      setScale(Math.min(
        1,
        (window.innerHeight * 0.96) / frameH,
        (window.innerWidth * 0.98) / frameW,
      ))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="w-screen overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#1C1C1E', height: '100dvh' }}>
      <div
        className="relative bg-neutral-950 rounded-[48px] p-3 shadow-2xl"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-neutral-950 rounded-full z-10" />
        {/* Fixed-size, non-scrolling "screen" — its children (App's content
            area and bottom nav) handle their own scrolling/positioning so
            the nav can stay pinned while content scrolls behind it. */}
        <div className={`theme-${theme} rounded-[36px] overflow-hidden relative bg-page`} style={{ width: SCREEN_W, height: SCREEN_H }}>
          {children}
        </div>
      </div>
    </div>
  )
}
