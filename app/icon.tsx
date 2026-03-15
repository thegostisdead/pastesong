import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#08070a',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 28,
            height: 16,
            background: 'radial-gradient(ellipse at center, rgba(200,240,65,0.35) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        {/* "P" letter */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#c8f041',
            lineHeight: 1,
            display: 'flex',
            fontFamily: 'sans-serif',
          }}
        >
          P
        </div>
      </div>
    ),
    { ...size }
  )
}
