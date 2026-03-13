import { Suspense } from 'react'
import MusicResolver from './components/MusicResolver'

export default function Home() {
  return (
    <Suspense>
      <MusicResolver />
    </Suspense>
  )
}
