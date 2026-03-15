export default function Header() {
  return (
    <div className="text-center mb-12 animate-fade-up">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-xs font-mono tracking-[0.3em] text-muted uppercase">
          One link. Every platform.
        </span>
      </div>
      <h1
        className="font-display text-5xl sm:text-7xl tracking-tight text-text"
        style={{ lineHeight: 0.95 }}
      >
        PASTE
        <span className="text-accent">SONG</span>
      </h1>
    </div>
  )
}
