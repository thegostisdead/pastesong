import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Syne, Outfit, Space_Mono } from 'next/font/google'
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
  description: 'Paste a Spotify or Apple Music link and instantly get it on every platform.',
  openGraph: {
    title: 'PasteSong — One link, every platform',
    description: 'Paste a Spotify or Apple Music link and instantly get it on every platform.',
    url: 'https://pastesong.vercel.app',
    siteName: 'PasteSong',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PasteSong — One link, every platform',
    description: 'Paste a Spotify or Apple Music link and instantly get it on every platform.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${outfit.variable} ${spaceMono.variable}`}>
        <div className="glow-top" />
        <div className="relative z-10">{children}</div>
        <Analytics />
      </body>
    </html>
  )
}
