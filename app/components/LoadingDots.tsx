export default function LoadingDots() {
  return (
    <span className="flex gap-0.5 items-center h-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-bg opacity-60"
          style={{
            animation: 'pulse_ring 1s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </span>
  )
}
