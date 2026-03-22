export default function AboutSection() {
  return (
    <div className="w-full max-w-2xl mt-6">
      <details className="group">
        <summary className="cursor-pointer text-muted text-xs font-mono text-center hover:text-text transition-colors list-none flex items-center justify-center gap-1.5">
          <svg
            className="w-3 h-3 transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          about
        </summary>
        <div className="mt-4 p-5 rounded-xl border border-border bg-surface text-xs font-mono text-muted space-y-3">
          <p>
            <span className="text-text">How it works</span> — PasteSong looks up your link
            directly via each platform&apos;s own API: the{' '}
            <a
              href="https://developer.spotify.com/documentation/web-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-dim hover:text-accent underline transition-colors"
            >
              Spotify Web API
            </a>
            ,{' '}
            <a
              href="https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-dim hover:text-accent underline transition-colors"
            >
              iTunes Search API
            </a>
            , and YouTube&apos;s public oEmbed endpoint — then searches the other two by title and artist.
          </p>
          <p>No data is stored. All lookups happen at request time.</p>
          <p>
            <span className="text-text">Open source</span> — PasteSong is open source and can be
            self-hosted.{' '}
            <a
              href="https://github.com/thegostisdead/pastesong"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-dim hover:text-accent underline transition-colors"
            >
              View on GitHub
            </a>
            .
          </p>
        </div>
      </details>
    </div>
  )
}
