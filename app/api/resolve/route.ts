import { NextRequest, NextResponse } from 'next/server'

export interface OdesliEntity {
  id: string
  type: 'song' | 'album'
  title: string
  artistName: string
  thumbnailUrl?: string
  thumbnailWidth?: number
  thumbnailHeight?: number
  apiProvider: string
  platforms: string[]
}

export interface OdesliPlatformLink {
  country: string
  url: string
  entityUniqueId: string
  nativeAppUriMobile?: string
  nativeAppUriDesktop?: string
}

export interface OdesliResponse {
  entityUniqueId: string
  userCountry: string
  pageUrl: string
  entitiesByUniqueId: Record<string, OdesliEntity>
  linksByPlatform: Record<string, OdesliPlatformLink>
}

export interface ResolvedSong {
  title: string
  artist: string
  artwork: string | null
  type: 'song' | 'album'
  songLinkUrl: string
  platforms: Array<{
    id: string
    name: string
    url: string
    color: string
  }>
}

const PLATFORM_META: Record<string, { name: string; color: string }> = {
  spotify:       { name: 'Spotify',       color: '#1DB954' },
  appleMusic:    { name: 'Apple Music',   color: '#fc3c44' },
  youtube:       { name: 'YouTube',       color: '#FF0000' },
  youtubeMusic:  { name: 'YouTube Music', color: '#FF0000' },
  tidal:         { name: 'Tidal',         color: '#00FFFF' },
  amazonMusic:   { name: 'Amazon Music',  color: '#00A8E1' },
  amazon:        { name: 'Amazon Music',  color: '#00A8E1' },
  deezer:        { name: 'Deezer',        color: '#FF0092' },
  soundcloud:    { name: 'SoundCloud',    color: '#FF5500' },
  pandora:       { name: 'Pandora',       color: '#3668FF' },
  anghami:       { name: 'Anghami',       color: '#9B59B6' },
  boomplay:      { name: 'Boomplay',      color: '#F15A24' },
  napster:       { name: 'Napster',       color: '#22A6B3' },
}

const PLATFORM_ORDER = [
  'spotify', 'appleMusic', 'youtubeMusic', 'youtube',
  'tidal', 'amazonMusic', 'amazon', 'deezer', 'soundcloud',
  'pandora', 'anghami', 'boomplay', 'napster',
]

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=US`
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } })

    if (!res.ok) {
      const text = await res.text()
      if (res.status === 404) {
        return NextResponse.json({ error: 'Song not found. Make sure the link is valid.' }, { status: 404 })
      }
      if (res.status === 429) {
        return NextResponse.json({ error: 'Too many requests. Try again in a moment.' }, { status: 429 })
      }
      return NextResponse.json({ error: `Failed to resolve link (${res.status})` }, { status: 500 })
    }

    const data: OdesliResponse = await res.json()

    // Find best entity for metadata (prefer the source entity)
    const entities = Object.values(data.entitiesByUniqueId)
    const mainEntity = entities.find(e => e.thumbnailUrl) ?? entities[0]

    if (!mainEntity) {
      return NextResponse.json({ error: 'Could not parse song metadata.' }, { status: 500 })
    }

    // Build platform list in preferred order
    const platforms = PLATFORM_ORDER
      .filter(id => data.linksByPlatform[id])
      .map(id => ({
        id,
        name: PLATFORM_META[id]?.name ?? id,
        url: data.linksByPlatform[id].url,
        color: PLATFORM_META[id]?.color ?? '#ffffff',
      }))

    const result: ResolvedSong = {
      title: mainEntity.title,
      artist: mainEntity.artistName,
      artwork: mainEntity.thumbnailUrl ?? null,
      type: mainEntity.type,
      songLinkUrl: data.pageUrl,
      platforms,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[resolve]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
