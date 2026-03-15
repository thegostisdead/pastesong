export default function SkeletonCard() {
  return (
    <div className="animate-fade-up">
      {/* Artwork + metadata row */}
      <div className="flex items-center gap-5 mb-7 p-5 rounded-xl border border-border bg-surface">
        <div className="skeleton flex-shrink-0 w-20 h-20 rounded-lg" />
        <div className="flex-1 space-y-2.5">
          <div className="skeleton h-3 w-12 rounded" />
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      </div>
      {/* Platform button grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
