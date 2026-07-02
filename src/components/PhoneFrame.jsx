// Demo chrome only — wraps the app in a realistic phone device frame so it
// reads as "an app on a phone" on a presentation screen. Purely presentational;
// none of these colors are part of the app's own design system (see CLAUDE.md).
export default function PhoneFrame({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-neutral-300">
      <div className="relative bg-neutral-950 rounded-[48px] p-3 shadow-2xl">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-neutral-950 rounded-full z-10" />
        {/* Fixed-size, non-scrolling "screen" — its children (App's content
            area and bottom nav) handle their own scrolling/positioning so
            the nav can stay pinned while content scrolls behind it. */}
        <div className="theme-warm w-[400px] h-[min(844px,88vh)] rounded-[36px] overflow-hidden relative bg-page">
          {children}
        </div>
      </div>
    </div>
  )
}
