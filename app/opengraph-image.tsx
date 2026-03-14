import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PasteSong — One link, every platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#08070a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: 'absolute',
            top: -160,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 900,
            height: 500,
            background:
              'radial-gradient(ellipse at center, rgba(200,240,65,0.18) 0%, transparent 65%)',
            borderRadius: '50%',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            color: '#c8f041',
            fontSize: 18,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginBottom: 28,
            opacity: 0.85,
            fontFamily: 'monospace',
          }}
        >
          One link. Every platform.
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 136,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 0.88,
          }}
        >
          <span style={{ color: '#ede9ff' }}>PASTE</span>
          <span style={{ color: '#c8f041' }}>SONG</span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 48,
            height: 2,
            background: '#1e1c27',
            margin: '40px 0 36px',
            display: 'flex',
          }}
        />

        {/* Platform list */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            color: '#6b6780',
            fontSize: 15,
            fontFamily: 'monospace',
            letterSpacing: '0.12em',
          }}
        >
          SPOTIFY · APPLE MUSIC · YOUTUBE · TIDAL · DEEZER · AND MORE
        </div>
      </div>
    ),
    { ...size }
  )
}
