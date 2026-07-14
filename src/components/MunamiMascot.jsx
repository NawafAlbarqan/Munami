import mascotGreeting from '../assets/mascot/mascot-greeting.png'
import mascotHappy from '../assets/mascot/mascot-happy.png'
import mascotConcerned from '../assets/mascot/mascot-concerned.png'
import mascotUnhappy from '../assets/mascot/mascot-unhappy.png'

// منمّي's real pixel-art mascot (extracted from the mascot1.png sheet).
// Expressions: 'greeting' (chat-open/hello moments) | 'happy' (on track,
// successful, completed) | 'concerned' (cautionary, approaching a limit) |
// 'unhappy' (clearly over budget / missed).
const MOOD_IMAGES = {
  greeting: mascotGreeting,
  happy: mascotHappy,
  concerned: mascotConcerned,
  unhappy: mascotUnhappy,
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
