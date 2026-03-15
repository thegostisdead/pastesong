import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'favicons')

const PLATFORMS = {
  spotify:      'open.spotify.com',
  appleMusic:   'music.apple.com',
  youtube:      'youtube.com',
  youtubeMusic: 'music.youtube.com',
  tidal:        'tidal.com',
  amazonMusic:  'music.amazon.com',
  deezer:       'deezer.com',
  soundcloud:   'soundcloud.com',
  pandora:      'pandora.com',
  anghami:      'anghami.com',
  boomplay:     'boomplay.com',
  napster:      'napster.com',
}

mkdirSync(OUT_DIR, { recursive: true })

for (const [id, domain] of Object.entries(PLATFORMS)) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  const res = await fetch(url)
  if (!res.ok) { console.error(`Failed ${id}: ${res.status}`); continue }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(join(OUT_DIR, `${id}.png`), buf)
  console.log(`✓ ${id}`)
}
