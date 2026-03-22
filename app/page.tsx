import { Suspense } from 'react'
import { headers } from 'next/headers'
import Header from './components/Header'
import MusicResolver from './components/MusicResolver'
import DiscordTeaser from './components/DiscordTeaser'
import AboutSection from './components/AboutSection'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PasteSong',
  url: 'https://pastesong.vercel.app',
  description:
    'Instantly convert music links between Spotify, Apple Music, YouTube Music, Tidal, Deezer, SoundCloud, and Amazon Music.',
  applicationCategory: 'MusicApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function Home() {
  const nonce = headers().get('x-nonce') ?? ''
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Server-rendered — no JS */}
      <Header />

      {/* Client boundary — interactive form + result area */}
      <Suspense>
        <MusicResolver />
      </Suspense>

      {/* Server-rendered — no JS */}
      <DiscordTeaser />
      <AboutSection />
    </div>
  )
}
