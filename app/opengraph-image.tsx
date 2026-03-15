import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PasteSong — One link, every platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const platforms = ['Spotify', 'Apple Music', 'YouTube Music', 'Tidal', 'Deezer', 'SoundCloud']

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
        {/* Top glow — centered via left/right 0 + margin auto */}
        <div
          style={{
            position: 'absolute',
            top: -240,
            left: 0,
            right: 0,
            marginLeft: 'auto',
            marginRight: 'auto',
            width: 860,
            height: 580,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(200,240,65,0.22) 0%, rgba(200,240,65,0.06) 40%, transparent 70%)',
            borderRadius: '50%',
            display: 'flex',
          }}
        />

        {/* Subtle bottom glow */}
        <div
          style={{
            position: 'absolute',
            bottom: -300,
            left: 0,
            right: 0,
            marginLeft: 'auto',
            marginRight: 'auto',
            width: 600,
            height: 400,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(200,240,65,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            display: 'flex',
          }}
        />

        {/* Label */}
        <div
          style={{
            display: 'flex',
            color: '#c8f041',
            fontSize: 16,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            marginBottom: 36,
            opacity: 0.75,
            fontFamily: 'monospace',
          }}
        >
          One link. Every platform.
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.9,
            fontFamily: 'sans-serif',
          }}
        >
          <span style={{ color: '#ede9ff' }}>PASTE</span>
          <span style={{ color: '#c8f041' }}>SONG</span>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            width: 64,
            height: 2,
            background: '#c8f041',
            opacity: 0.25,
            margin: '44px 0 40px',
          }}
        />

        {/* Platform pills */}
        <div style={{ display: 'flex', gap: 10 }}>
          {platforms.map((p) => (
            <div
              key={p}
              style={{
                display: 'flex',
                background: '#13111a',
                border: '1px solid #2a2835',
                borderRadius: 100,
                padding: '9px 22px',
                color: '#6b6780',
                fontSize: 14,
                letterSpacing: '0.04em',
                fontFamily: 'monospace',
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
