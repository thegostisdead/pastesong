'use client'

import { useState, useCallback } from 'react'
import { gooeyToast } from 'goey-toast'
import type { ResolvedSong } from '../api/resolve/route'
import PlatformFavicon from './PlatformFavicon'

function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copy = useCallback((id: string, text: string, platformName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
      gooeyToast.success(`${platformName} link copied!`)
    })
  }, [])
  return { copiedId, copy }
}

export default function ResultCard({ data, onReset }: { data: ResolvedSong; onReset: () => void }) {
  const { copiedId, copy } = useCopyToClipboard()

  return (
    <div className="animate-fade-up">
      {/* Song info */}
      <div className="flex items-center gap-5 mb-7 p-5 rounded-xl border border-border bg-surface">
        {data.artwork ? (
          <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
            <img src={data.artwork} alt={data.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-border flex items-center justify-center text-muted">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono tracking-widest text-accent uppercase mb-1">
            {data.type}
          </p>
          <h2 className="font-display text-2xl text-text truncate leading-tight">{data.title}</h2>
          <p className="text-muted font-body text-sm mt-0.5 truncate">{data.artist}</p>
        </div>

        <button
          onClick={onReset}
          className="flex-shrink-0 p-2 rounded-lg text-muted hover:text-text hover:bg-border transition-all"
          title="Search again"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Platform links grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {data.platforms.map((platform, i) => (
          <div
            key={platform.id}
            className={`platform-btn stagger-${Math.min(i + 1, 8)} flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface hover:border-current transition-all group`}
            style={{ '--platform-color': platform.color } as React.CSSProperties}
          >
            <a
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <span
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${platform.color}22` }}
              >
                <PlatformFavicon platformId={platform.id} name={platform.name} />
              </span>
              <div className="min-w-0">
                <p className="text-text text-sm font-body font-medium leading-tight truncate">
                  {platform.name}
                </p>
                <p className="text-muted text-[10px] font-mono mt-0.5 group-hover:text-text transition-colors">
                  Open ↗
                </p>
              </div>
            </a>

            <button
              onClick={() => copy(platform.id, platform.url, platform.name)}
              title={`Copy ${platform.name} link`}
              className="flex-shrink-0 p-1.5 rounded-lg text-muted hover:text-accent hover:bg-border transition-all opacity-0 group-hover:opacity-100"
            >
              {copiedId === platform.id ? (
                <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}
