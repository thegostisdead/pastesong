import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    [
      "img-src 'self' data:",
      'https://www.google.com',
      'https://i.scdn.co',
      'https://mosaic.scdn.co',
      'https://*.mzstatic.com',
      'https://*.scdn.co',
      'https://*.spotifycdn.com',
      'https://*.ytimg.com',
      'https://lh3.googleusercontent.com',
    ].join(' '),
    "connect-src 'self' https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
