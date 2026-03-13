'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import type { ResolvedSong } from '../api/resolve/route'

const PLATFORM_ICONS: Record<string, string> = {
  spotify: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
  appleMusic: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.769-.73 7.146 7.146 0 00-1.267-.13c-.01 0-.144-.012-.multiples 0H5.456c-.138 0-.138 0-.138.002A6.64 6.64 0 004 .096C2.95.3 2.007.78 1.285 1.59a5.22 5.22 0 00-1.109 2.226c-.14.584-.17 1.18-.176 1.776C0 5.72 0 5.848 0 6v12c0 .152 0 .28.002.408.006.596.036 1.19.176 1.776.311 1.316 1.057 2.316 2.18 3.043.617.399 1.308.63 2.043.731a7.146 7.146 0 001.267.13c.01 0 .144.012.288.012H18.544c.144 0 .278-.012.288-.012.43-.02.858-.062 1.267-.13.735-.1 1.426-.332 2.043-.731 1.123-.727 1.87-1.727 2.18-3.043.14-.585.17-1.18.176-1.776C24 18.28 24 18.152 24 18V6c0-.152 0-.28-.006-.408zm-7.979 1.34c.183.085.348.206.477.357l1.11 1.292a.67.67 0 01-.08.927l-.52.462a.655.655 0 01-.847-.016 3.057 3.057 0 00-1.955-.699c-1.6 0-2.9 1.262-2.9 2.818 0 1.556 1.3 2.818 2.9 2.818 1.04 0 1.956-.535 2.493-1.336l-2.065.006a.655.655 0 01-.656-.655v-.686c0-.362.294-.655.656-.655h3.647c.357 0 .647.286.655.643.02.95-.183 1.885-.593 2.73-.413.849-1.025 1.587-1.78 2.147a5.688 5.688 0 01-3.357 1.085c-3.14 0-5.69-2.488-5.69-5.556 0-3.068 2.55-5.556 5.69-5.556a5.668 5.668 0 012.815.733z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  youtubeMusic: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/></svg>`,
  tidal: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004L12.012 3.992zM8.008 16.004l-4.004-4.004L0 16.004l4.004 4.004 4.004-4.004zm7.996 0l-4.004-4.004-4.004 4.004 4.004 4.004 4.004-4.004z"/></svg>`,
  amazonMusic: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 18.403c2.184 1.537 4.747 2.65 7.611 3.148l-.002.002c.114.018.221-.059.24-.174.02-.115-.059-.222-.174-.242-2.783-.484-5.275-1.562-7.393-3.056-.098-.068-.233-.045-.301.053-.068.099-.046.232.053.3l-.034-.031zM23.04 16.26a.198.198 0 00-.273.059c-.068.099-.044.232.055.3 1.016.703 1.557 1.42 1.557 2.075 0 .979-1.195 1.972-3.273 2.726-2.033.737-4.717 1.143-7.551 1.143-3.676 0-7.043-.714-9.492-2.01-.104-.056-.234-.017-.29.087-.056.105-.016.235.089.29 2.521 1.334 5.976 2.07 9.729 2.07 2.908 0 5.666-.42 7.762-1.184 2.213-.803 3.431-1.916 3.431-3.122 0-.799-.604-1.634-1.744-2.434zM5.199 9.21c.061.027.125.04.188.04.148 0 .29-.082.358-.225 2.148-4.528 6.636-7.337 11.632-7.337 2.107 0 4.166.535 5.953 1.548.101.057.23.022.287-.079.058-.101.023-.23-.078-.287A13.57 13.57 0 0017.377.503C12.126.503 7.408 3.453 5.151 8.18c-.059.123-.007.272.116.33l-.068-.3zm.862 4.374c0 3.364 2.756 6.103 6.143 6.103 3.388 0 6.144-2.738 6.144-6.103 0-3.363-2.756-6.101-6.144-6.101-3.387 0-6.143 2.738-6.143 6.101zm1.033 0c0-2.799 2.294-5.076 5.11-5.076 2.818 0 5.111 2.277 5.111 5.076 0 2.8-2.293 5.077-5.111 5.077-2.816 0-5.11-2.277-5.11-5.077zm3.611 2.441V11.11l3.248 1.958-3.248 1.957z"/></svg>`,
  deezer: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.944 16.382h4.663v1.27h-4.663zm0-2.596h4.663v1.27h-4.663zm0-2.596h4.663v1.27h-4.663zM.394 18.977h4.664v1.27H.394zm4.664-5.19H.394v1.27h4.664zm0-2.597H.394v1.27h4.664zm0-2.596H.394v1.27h4.664zM9.057 16.38h4.664v1.27H9.057zm4.664-2.597H9.057v1.27h4.664zm-4.664-2.595h4.664v1.27H9.057zm4.664-2.597H9.057v1.27h4.664zM4.723 16.382h4.664v1.27H4.723zm0-2.596h4.664v1.27H4.723zm0-2.596h4.664v1.27H4.723zm9.336 7.79h4.664v1.27h-4.664zm4.664-2.597h-4.664v1.27h4.664zm0-2.596h-4.664v1.27h4.664zm0-2.596h-4.664v1.27h4.664z"/></svg>`,
  soundcloud: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.015 0-.026.01-.03.025l-.315 2.005.315 1.99c.004.014.015.024.03.024.013 0 .024-.01.028-.024l.367-1.99-.367-2.005c-.004-.015-.015-.025-.028-.025zm1.895-.57c-.02 0-.037.016-.04.037l-.27 2.538.27 2.478c.003.02.02.038.04.038s.037-.018.04-.038l.302-2.478-.302-2.538c-.003-.02-.02-.037-.04-.037zm1.91-.268c-.025 0-.045.02-.047.045l-.24 2.806.24 2.728c.002.025.022.044.047.044.024 0 .044-.02.046-.044l.272-2.728-.272-2.806c-.002-.025-.022-.045-.046-.045zm1.925-.194c-.03 0-.055.024-.057.055l-.21 3.0.21 2.974c.002.03.027.055.057.055.03 0 .055-.025.057-.055l.238-2.974-.238-3.0c-.002-.03-.027-.055-.057-.055zm1.928-.108c-.035 0-.064.028-.066.064l-.18 3.108.18 3.2c.002.035.031.063.066.063.034 0 .063-.028.065-.063l.205-3.2-.205-3.108c-.002-.036-.031-.064-.065-.064zm1.933-.085c-.04 0-.073.032-.075.073l-.15 3.193.15 3.42c.002.04.035.072.075.072.04 0 .073-.032.075-.072l.17-3.42-.17-3.193c-.002-.04-.035-.073-.075-.073zm1.936-.07c-.045 0-.082.037-.083.082l-.12 3.263.12 3.6c.001.045.038.082.083.082.044 0 .081-.037.082-.082l.136-3.6-.136-3.263c-.001-.045-.038-.082-.082-.082zm1.938-.055c-.05 0-.09.04-.09.09l-.09 3.318.09 3.758c0 .05.04.09.09.09.05 0 .09-.04.09-.09l.1-3.758-.1-3.318c0-.05-.04-.09-.09-.09zm5.3 1.92c-.244 0-.48.045-.697.126-.145-1.67-1.555-2.97-3.266-2.97-.446 0-.87.093-1.254.26-.145.06-.184.12-.185.17v6.19c.001.055.045.1.1.105h5.302c.773 0 1.4-.626 1.4-1.4 0-.773-.627-1.4-1.4-1.4l-.002-.002c.002-.034.006-.067.006-.1 0-1.196-.97-2.165-2.166-2.165l.162.186z"/></svg>`,
  pandora: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v24h11.04c6.15 0 11.04-4.888 11.04-11.04S17.19 1.92 11.04 1.92V0H0zm11.04 3.84c3.98 0 7.2 3.22 7.2 7.2s-3.22 7.2-7.2 7.2H3.84V3.84h7.2z"/></svg>`,
}

function getPlatformIcon(platformId: string): string {
  const base = PLATFORM_ICONS[platformId]
  if (base) return base
  // Fallback: music note
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`
}

function isValidMusicUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.hostname.includes('spotify.com') ||
      u.hostname.includes('music.apple.com') ||
      u.hostname.includes('music.youtube.com') ||
      u.hostname.includes('tidal.com') ||
      u.hostname.includes('deezer.com') ||
      u.hostname.includes('soundcloud.com') ||
      u.hostname.includes('song.link') ||
      u.hostname.includes('odesli.co')
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
          className="flex items-center gap-0 rounded-xl overflow-hidden border border-border bg-surface"
          style={{ boxShadow: '0 0 0 0 rgba(200,240,65,0)' }}
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

      {/* Footer */}
      <footer className="mt-auto pt-16 text-muted text-xs font-mono text-center">
        powered by{' '}
        <a
          href="https://odesli.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-dim hover:text-accent transition-colors underline"
        >
          odesli
        </a>
      </footer>
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
            <Image
              src={data.artwork}
              alt={data.title}
              fill
              className="object-cover"
              sizes="80px"
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
                style={{ background: `${platform.color}22`, color: platform.color }}
                dangerouslySetInnerHTML={{ __html: getPlatformIcon(platform.id) }}
              />
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
