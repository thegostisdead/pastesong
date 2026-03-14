'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { ResolvedSong } from '../api/resolve/route'

const PLATFORM_DOMAINS: Record<string, string> = {
  spotify:      'open.spotify.com',
  appleMusic:   'music.apple.com',
  youtube:      'youtube.com',
  youtubeMusic: 'music.youtube.com',
  tidal:        'tidal.com',
  amazonMusic:  'music.amazon.com',
  amazon:       'music.amazon.com',
  deezer:       'deezer.com',
  soundcloud:   'soundcloud.com',
  pandora:      'pandora.com',
  anghami:      'anghami.com',
  boomplay:     'boomplay.com',
  napster:      'napster.com',
}

function PlatformFavicon({ platformId, name }: { platformId: string; name: string }) {
  const domain = PLATFORM_DOMAINS[platformId] ?? platformId
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={name}
      width={20}
      height={20}
      className="w-5 h-5 rounded-sm"
    />
  )
}

function isValidMusicUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    const h = u.hostname
    return (
      h === 'open.spotify.com' ||
      h === 'music.apple.com' ||
      h === 'music.youtube.com' ||
      h === 'tidal.com' ||
      h === 'deezer.com' ||
      h === 'soundcloud.com' ||
      h === 'song.link' ||
      h === 'odesli.co' ||
      h.endsWith('.spotify.com') ||
      h.endsWith('.apple.com') ||
      h.endsWith('.deezer.com') ||
      h.endsWith('.soundcloud.com')
    )
  } catch {
    return false
  }
}

function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const copy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }, [])
  return { copiedId, copy }
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ResolvedSong }
  | { status: 'error'; message: string }

export default function MusicResolver() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const resolve = useCallback(async (url: string) => {
    if (!url.trim()) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState({ status: 'loading' })

    try {
      const res = await fetch(`/api/resolve?url=${encodeURIComponent(url.trim())}`, {
        signal: controller.signal,
      })
      const json = await res.json()

      if (!res.ok) {
        setState({ status: 'error', message: json.error ?? 'Something went wrong.' })
        return
      }

      setState({ status: 'success', data: json })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setState({ status: 'error', message: 'Network error. Please try again.' })
    }
  }, [])

  // Handle ?from= param on load
  useEffect(() => {
    const from = searchParams.get('from')
    if (from) {
      setInputValue(from)
      resolve(from)
    }
  }, [searchParams, resolve])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = inputValue.trim()
    if (!val) return
    // Update URL without navigation
    const params = new URLSearchParams({ from: val })
    router.replace(`?${params.toString()}`, { scroll: false })
    resolve(val)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    if (isValidMusicUrl(pasted)) {
      e.preventDefault()
      setInputValue(pasted)
      const params = new URLSearchParams({ from: pasted })
      router.replace(`?${params.toString()}`, { scroll: false })
      resolve(pasted)
    }
  }

  const handleReset = () => {
    setState({ status: 'idle' })
    setInputValue('')
    router.replace('/', { scroll: false })
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
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

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl mb-10 animate-fade-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div
          className="flex items-center gap-0 rounded-xl overflow-hidden border border-border bg-surface focus-within:border-accent transition-colors"
        >
          {/* Music icon */}
          <div className="pl-4 pr-2 text-muted flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent font-mono text-sm text-text placeholder-muted py-4 pr-2 focus:outline-none music-input"
            placeholder="paste a spotify or apple music link…"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPaste={handlePaste}
            spellCheck={false}
            autoComplete="off"
            disabled={state.status === 'loading'}
          />

          <button
            type="submit"
            disabled={state.status === 'loading' || !inputValue.trim()}
            className="m-1.5 px-5 py-2.5 rounded-lg font-display text-sm tracking-widest uppercase text-bg bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-accent-dim active:scale-95 flex-shrink-0"
          >
            {state.status === 'loading' ? (
              <span className="flex items-center gap-1.5">
                <LoadingDots />
              </span>
            ) : (
              'Find'
            )}
          </button>
        </div>

        <p className="text-muted text-xs font-mono mt-2.5 text-center">
          works with spotify · apple music · youtube music · tidal · and more
        </p>
      </form>

      {/* Result area */}
      <div className="w-full max-w-2xl">
        {state.status === 'loading' && <SkeletonCard />}

        {state.status === 'error' && (
          <div className="animate-fade-up rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center">
            <p className="text-red-400 font-mono text-sm mb-3">{state.message}</p>
            <button
              onClick={handleReset}
              className="text-xs font-mono text-muted hover:text-text underline transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {state.status === 'success' && (
          <ResultCard data={state.data} onReset={handleReset} />
        )}
      </div>

      {/* Discord bot teaser */}
      <div className="w-full max-w-2xl mt-16">
        <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-surface">
          {/* Discord icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(88,101,242,0.15)' }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#5865F2">
              <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026 13.83 13.83 0 001.226-1.963.074.074 0 00-.041-.104 13.175 13.175 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-text text-sm font-body font-medium">Discord Bot</p>
              <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-border text-muted">
                Coming soon
              </span>
            </div>
            <p className="text-muted text-xs font-mono leading-relaxed">
              Paste any song link in a channel — the bot replies with every platform.
            </p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="w-full max-w-2xl mt-6">
        <details className="group">
          <summary className="cursor-pointer text-muted text-xs font-mono text-center hover:text-text transition-colors list-none flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            about
          </summary>
          <div className="mt-4 p-5 rounded-xl border border-border bg-surface text-xs font-mono text-muted space-y-3">
            <p>
              <span className="text-text">How it works</span> — PasteSong fetches cross-platform links from the{' '}
              <a href="https://odesli.co" target="_blank" rel="noopener noreferrer" className="text-accent-dim hover:text-accent underline transition-colors">
                Odesli / song.link API
              </a>
              , a free public service that indexes music across streaming platforms.
            </p>
            <p>
              If Apple Music is missing from the Odesli response, we fall back to the{' '}
              <a href="https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI" target="_blank" rel="noopener noreferrer" className="text-accent-dim hover:text-accent underline transition-colors">
                iTunes Search API
              </a>{' '}
              and match by track title + artist name.
            </p>
            <p>No data is stored. All lookups happen at request time.</p>
          </div>
        </details>
      </div>
    </div>
  )
}

function ResultCard({ data, onReset }: { data: ResolvedSong; onReset: () => void }) {
  const { copiedId, copy } = useCopyToClipboard()

  return (
    <div className="animate-fade-up">
      {/* Song info */}
      <div className="flex items-center gap-5 mb-7 p-5 rounded-xl border border-border bg-surface">
        {data.artwork ? (
          <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
            <img
              src={data.artwork}
              alt={data.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-border flex items-center justify-center text-muted">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
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
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Platform links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {data.platforms.map((platform, i) => (
          <div
            key={platform.id}
            className={`platform-btn stagger-${Math.min(i + 1, 8)} flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface hover:border-current transition-all group`}
            style={{ '--platform-color': platform.color } as React.CSSProperties}
          >
            {/* Open link */}
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

            {/* Copy button */}
            <button
              onClick={() => copy(platform.id, platform.url)}
              title={`Copy ${platform.name} link`}
              className="flex-shrink-0 p-1.5 rounded-lg text-muted hover:text-accent hover:bg-border transition-all opacity-0 group-hover:opacity-100"
            >
              {copiedId === platform.id ? (
                <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Song.link URL */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <a
          href={data.songLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-muted hover:text-text transition-colors underline"
        >
          view on song.link ↗
        </a>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-5 mb-7 p-5 rounded-xl border border-border bg-surface">
        <div className="skeleton flex-shrink-0 w-20 h-20 rounded-lg" />
        <div className="flex-1 space-y-2.5">
          <div className="skeleton h-3 w-12 rounded" />
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function LoadingDots() {
  return (
    <span className="flex gap-0.5 items-center h-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-bg opacity-60"
          style={{
            animation: `pulse_ring 1s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </span>
  )
}
