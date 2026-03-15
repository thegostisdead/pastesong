import { Suspense } from 'react'
import Header from './components/Header'
import MusicResolver from './components/MusicResolver'
import DiscordTeaser from './components/DiscordTeaser'
import AboutSection from './components/AboutSection'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
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
