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
const BEZEL = 14 // matches the frame div's padding, below

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
    <div
      className="w-screen overflow-hidden flex items-center justify-center"
      style={{
        // Deep, near-black backdrop with a soft vignette (lighter directly
        // behind the phone, fading to black at the edges) — a real
        // photography-backdrop treatment. Deliberately theme-independent and
        // deep enough to contrast against BOTH the dark-theme charcoal screen
        // (#1E1E1E) and the light-theme warm-grey screen (#D8D8D4): the old
        // flat #1C1C1E backdrop sat almost the same tone as the dark screen,
        // which is why the phone read as flat in dark mode.
        background: 'radial-gradient(ellipse 120% 90% at 50% 32%, #232226 0%, #0d0c0e 62%, #050506 100%)',
        height: '100dvh',
      }}
    >
      <div
        className="relative"
        style={{
          padding: 14,
          borderRadius: 52,
          background: '#0c0c0e',
          // Layered shadow: a thin inner top rim (light catching a metal edge),
          // a thin inner bottom shadow (depth), a faint outer edge highlight,
          // and two soft offset-down shadows (like a device resting on a lit
          // surface) instead of Tailwind's generic symmetric shadow-2xl.
          boxShadow: [
            'inset 0 1.5px 0 rgba(255,255,255,0.10)',
            'inset 0 -1.5px 0 rgba(0,0,0,0.5)',
            '0 1px 0 rgba(255,255,255,0.05)',
            '0 50px 90px -20px rgba(0,0,0,0.65)',
            '0 22px 40px -16px rgba(0,0,0,0.55)',
          ].join(', '),
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {/* Dynamic-Island-style notch with a small camera lens detail */}
        <div
          className="absolute z-10 flex items-center justify-center"
          style={{ top: 16, left: '50%', transform: 'translateX(-50%)', width: 96, height: 26, background: '#000', borderRadius: 999 }}
        >
          <div
            style={{ width: 7, height: 7, borderRadius: 999, background: 'radial-gradient(circle at 35% 35%, #2E4A3A, #0A0F0C)' }}
          />
        </div>
        {/* Fixed-size, non-scrolling "screen" — its children (App's content
            area and bottom nav) handle their own scrolling/positioning so
            the nav can stay pinned while content scrolls behind it. */}
        <div className={`theme-${theme} rounded-[38px] overflow-hidden relative bg-page`} style={{ width: SCREEN_W, height: SCREEN_H }}>
          {children}
        </div>
      </div>
    </div>
  )
}
