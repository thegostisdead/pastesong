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
            <span className="text-text">How it works</span> — PasteSong fetches cross-platform
            links from the{' '}
            <a
              href="https://odesli.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-dim hover:text-accent underline transition-colors"
            >
              Odesli / song.link API
            </a>
            , a free public service that indexes music across streaming platforms.
          </p>
          <p>
            If Apple Music is missing from the Odesli response, we fall back to the{' '}
            <a
              href="https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-dim hover:text-accent underline transition-colors"
            >
              iTunes Search API
            </a>{' '}
            and match by track title + artist name.
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
