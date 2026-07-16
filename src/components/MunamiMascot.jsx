import mascotIcon from '../assets/mascot/mascot-icon.png'

// Keep the expression API stable so callers can continue describing context,
// while the supplied brand mascot remains visually consistent everywhere.
const MOOD_IMAGES = {
  greeting: mascotIcon,
  happy: mascotIcon,
  concerned: mascotIcon,
  unhappy: mascotIcon,
}

// `size` is a MAX bounding box (size×size), not a fixed width — the character
// is letterboxed inside it via object-fit, so it can never grow taller than
// intended and inflate a flex row's height (this caused a real layout bug:
// the Copilot header grew past the chat thread's hardcoded top offset).
export default function MunamiMascot({ expression = 'happy', size = 52, className = '' }) {
  const src = MOOD_IMAGES[expression] || MOOD_IMAGES.happy
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
