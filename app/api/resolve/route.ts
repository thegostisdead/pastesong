import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

function detectCountry(url: string): string {
  try {
    const u = new URL(url)
    // Apple Music: music.apple.com/fr/album/...
    if (u.hostname === 'music.apple.com') {
      const match = u.pathname.match(/^\/([a-z]{2})\//)
      if (match) return match[1].toUpperCase()
    }
  } catch {}
  return 'US'
}

// Spotify token cache
let spotifyTokenCache: { token: string; expiresAt: number } | null = null

async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  if (spotifyTokenCache && Date.now() < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token
  }

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })
    if (!res.ok) return null
    const data = await res.json()
    spotifyTokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
    return data.access_token
  } catch {
    return null
  }
}

async function searchSpotify(title: string, artist: string, type: 'song' | 'album'): Promise<string | null> {
  try {
    const token = await getSpotifyToken()
    if (!token) return null

    const searchType = type === 'album' ? 'album' : 'track'
    const q = encodeURIComponent(`${title} ${artist}`)
    const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=${searchType}&limit=1`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()

    if (type === 'album') {
      return data.albums?.items?.[0]?.external_urls?.spotify ?? null
    }
    return data.tracks?.items?.[0]?.external_urls?.spotify ?? null
  } catch {
    return null
  }
}

async function searchItunes(title: string, artist: string, type: 'song' | 'album'): Promise<string | null> {
  try {
    const entity = type === 'album' ? 'album' : 'song'
    const term = encodeURIComponent(`${title} ${artist}`)
    const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=${entity}&limit=5`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const result = data.results?.[0]
    if (!result) return null
    return type === 'album' ? result.collectionViewUrl : result.trackViewUrl
  } catch {
    return null
  }
}

const ALLOWED_HOSTNAMES = [
  'open.spotify.com',
  'music.apple.com',
  'music.youtube.com',
  'tidal.com',
  'deezer.com',
  'soundcloud.com',
  'music.amazon.com',
  'www.amazon.com',
  'pandora.com',
  'anghami.com',
  'boomplay.com',
  'napster.com',
  'song.link',
  'odesli.co',
]

function isAllowedMusicUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:') return false
    return ALLOWED_HOSTNAMES.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

function inputPlatform(url: string): string {
  try {
    const { hostname } = new URL(url)
    if (hostname.includes('spotify')) return 'spotify'
    if (hostname.includes('apple')) return 'appleMusic'
    if (hostname === 'music.youtube.com') return 'youtubeMusic'
    if (hostname.includes('youtube')) return 'youtube'
    if (hostname.includes('tidal')) return 'tidal'
    if (hostname.includes('deezer')) return 'deezer'
    if (hostname.includes('soundcloud')) return 'soundcloud'
    if (hostname.includes('amazon')) return 'amazonMusic'
    if (hostname.includes('pandora')) return 'pandora'
    if (hostname.includes('anghami')) return 'anghami'
    if (hostname.includes('boomplay')) return 'boomplay'
    if (hostname.includes('napster')) return 'napster'
    if (hostname.includes('song.link') || hostname.includes('odesli')) return 'songlink'
  } catch {}
  return 'unknown'
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const url = req.nextUrl.searchParams.get('url')

  const event: Record<string, unknown> = {
    service: 'api/resolve',
    timestamp: new Date().toISOString(),
    env: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
      region: process.env.VERCEL_REGION ?? 'local',
    },
    input: { url, platform: url ? inputPlatform(url) : null },
    fallbacks: { itunes_used: false, spotify_used: false },
  }

  const respond = (body: object, status: number) => {
    event.status = status
    event.outcome = status < 400 ? 'success' : status < 500 ? 'client_error' : 'server_error'
    event.duration_ms = Date.now() - startTime
    if (status >= 400) {
      console.error(JSON.stringify(event))
    } else {
      console.log(JSON.stringify(event))
    }
    return NextResponse.json(body, { status })
  }

  if (!url) {
    return respond({ error: 'Missing url parameter' }, 400)
  }

  if (!isAllowedMusicUrl(url)) {
    return respond({ error: 'URL not supported. Please paste a link from a supported music platform.' }, 400)
  }

  try {
    const country = detectCountry(url)
    event.country = country

    const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=${country}`
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } })
    event.odesli_status = res.status

    if (!res.ok) {
      if (res.status === 400) {
        return respond({ error: 'Link not recognized. Try pasting a track link instead of an album link.' }, 400)
      }
      if (res.status === 404) {
        return respond({ error: 'Song not found. Make sure the link is valid.' }, 404)
      }
      if (res.status === 429) {
        return respond({ error: 'Too many requests. Try again in a moment.' }, 429)
      }
      return respond({ error: `Failed to resolve link (${res.status})` }, 500)
    }

    const data: OdesliResponse = await res.json()

    // Find best entity for metadata (prefer the source entity)
    const entities = Object.values(data.entitiesByUniqueId)
    const mainEntity = entities.find(e => e.thumbnailUrl) ?? entities[0]

    if (!mainEntity) {
      return respond({ error: 'Could not parse song metadata.' }, 500)
    }

    event.song = { title: mainEntity.title, artist: mainEntity.artistName, type: mainEntity.type }

    // Run fallbacks in parallel for missing platforms
    const needsItunes = !data.linksByPlatform['appleMusic']
    const needsSpotify = !data.linksByPlatform['spotify']
    const [itunesUrl, spotifyUrl] = await Promise.all([
      needsItunes ? searchItunes(mainEntity.title, mainEntity.artistName, mainEntity.type) : null,
      needsSpotify ? searchSpotify(mainEntity.title, mainEntity.artistName, mainEntity.type) : null,
    ])

    if (itunesUrl) {
      data.linksByPlatform['appleMusic'] = { country: 'US', url: itunesUrl, entityUniqueId: '' }
      event.fallbacks = { ...event.fallbacks as object, itunes_used: true }
    }
    if (spotifyUrl) {
      data.linksByPlatform['spotify'] = { country: 'US', url: spotifyUrl, entityUniqueId: '' }
      event.fallbacks = { ...event.fallbacks as object, spotify_used: true }
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

    event.platform_count = platforms.length
    event.platforms_found = platforms.map(p => p.id)

    const result: ResolvedSong = {
      title: mainEntity.title,
      artist: mainEntity.artistName,
      artwork: mainEntity.thumbnailUrl ?? null,
      type: mainEntity.type,
      songLinkUrl: data.pageUrl,
      platforms,
    }

    return respond(result, 200)
  } catch (err) {
    event.error = { message: err instanceof Error ? err.message : String(err), type: err instanceof Error ? err.name : 'unknown' }
    return respond({ error: 'Something went wrong. Please try again.' }, 500)
  }
}
