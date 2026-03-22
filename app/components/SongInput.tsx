'use client'

import type React from 'react'
import LoadingDots from './LoadingDots'

function isValidMusicUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    const h = u.hostname
    return (
      h === 'open.spotify.com' ||
      h === 'music.apple.com' ||
      h === 'music.youtube.com' ||
      h.endsWith('.spotify.com') ||
      h.endsWith('.apple.com')
    )
  } catch {
    return false
  }
}

interface SongInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onPaste: (pasted: string) => void
  isLoading: boolean
  inputRef: React.RefObject<HTMLInputElement>
}

export default function SongInput({ value, onChange, onSubmit, onPaste, isLoading, inputRef }: SongInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    if (isValidMusicUrl(pasted)) {
      e.preventDefault()
      onPaste(pasted)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mb-10 animate-fade-up"
      style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
    >
      <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-border bg-surface focus-within:border-accent transition-colors">
        {/* Music icon */}
        <div className="pl-4 pr-2 text-muted flex-shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent font-mono text-sm text-text placeholder-muted py-4 pr-2 focus:outline-none music-input"
          placeholder="paste a spotify or apple music link…"
          value={value}
          onChange={e => onChange(e.target.value)}
          onPaste={handlePaste}
          spellCheck={false}
          autoComplete="off"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="m-1.5 px-5 py-2.5 rounded-lg font-display text-sm tracking-widest uppercase text-bg bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-accent-dim active:scale-95 flex-shrink-0"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <LoadingDots />
            </span>
          ) : (
            'Find'
          )}
        </button>
      </div>

      <p className="text-muted text-xs font-mono mt-2.5 text-center">
        works with spotify · apple music · youtube music
      </p>
    </form>
  )
}
