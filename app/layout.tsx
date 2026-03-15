import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Syne, Outfit, Space_Mono } from 'next/font/google'
import { GooeyToaster } from './components/Toaster'
import 'goey-toast/styles.css'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://pastesong.vercel.app'),
  title: 'PasteSong — One link, every platform',
  description:
    'Instantly convert music links between Spotify, Apple Music, YouTube Music, Tidal, Deezer, SoundCloud, and Amazon Music. Paste any streaming link and share it everywhere.',
  keywords: [
    'music link converter',
    'spotify link converter',
    'apple music link converter',
    'youtube music converter',
    'tidal link',
    'deezer link',
    'soundcloud link',
    'amazon music link',
    'cross-platform music',
    'music sharing',
    'streaming link converter',
  ],
  authors: [{ name: 'PasteSong' }],
  alternates: {
    canonical: 'https://pastesong.vercel.app',
  },
  openGraph: {
    title: 'PasteSong — One link, every platform',
    description:
      'Instantly convert music links between Spotify, Apple Music, YouTube Music, Tidal, Deezer, SoundCloud, and Amazon Music.',
    url: 'https://pastesong.vercel.app',
    siteName: 'PasteSong',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'PasteSong — One link, every platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PasteSong — One link, every platform',
    description:
      'Instantly convert music links between Spotify, Apple Music, YouTube Music, Tidal, Deezer, SoundCloud, and Amazon Music.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${outfit.variable} ${spaceMono.variable}`}>
        <div className="glow-top" />
        <div className="relative z-10">{children}</div>
        <GooeyToaster position="bottom-center" theme="dark" preset="bouncy" />
        <Analytics />
      </body>
    </html>
  )
}
