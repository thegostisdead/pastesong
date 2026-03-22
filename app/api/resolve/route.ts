import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'redis'

export const dynamic = 'force-dynamic'

export interface ResolvedSong {
  title: string
  artist: string
  artwork: string | null
  type: 'song' | 'album'
  platforms: Array<{
    id: string
    name: string
    url: string
    color: string
  }>
}

const PLATFORM_META: Record<string, { name: string; color: string }> = {
  spotify:      { name: 'Spotify',       color: '#1DB954' },
  appleMusic:   { name: 'Apple Music',   color: '#fc3c44' },
  youtubeMusic: { name: 'YouTube Music', color: '#FF0000' },
}

const PLATFORM_ORDER = ['spotify', 'appleMusic', 'youtubeMusic']

// ── Redis / rate limiting ────────────────────────────────────────────────────

const RATE_LIMIT = 20
const RATE_WINDOW = 60

let redis: ReturnType<typeof createClient> | null = null

async function getRedis() {
  if (!process.env.REDIS_URL) return null
  if (!redis) redis = await createClient({ url: process.env.REDIS_URL }).connect()
  return redis
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const client = await getRedis()
  if (!client) return true
  const key = `rl:${ip}`
  const now = Date.now()
  const windowStart = now - RATE_WINDOW * 1000

  try {
    await client.zRemRangeByScore(key, 0, windowStart)
    const count = await client.zCard(key)
    if (count >= RATE_LIMIT) return false
    await client.zAdd(key, { score: now, value: now.toString() })
    await client.expire(key, RATE_WINDOW)
    return true
  } catch {
    return true
  }
}

// ── Spotify ──────────────────────────────────────────────────────────────────

async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const client = await getRedis()
  if (client) {
    try {
      const cached = await client.get('spotify:token')
      if (cached) return cached
    } catch {}
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
    const token: string = data.access_token
    const ttl: number = (data.expires_in ?? 3600) - 60
    if (client) {
      try {
        await client.set('spotify:token', token, { EX: ttl })
      } catch {}
    }
    return token
  } catch {
    return null
  }
}

interface TrackMeta {
  title: string
  artist: string
  artwork: string | null
  type: 'song' | 'album'
}

async function lookupSpotify(id: string, type: 'track' | 'album'): Promise<TrackMeta | null> {
  try {
    const token = await getSpotifyToken()
    if (!token) return null
    const res = await fetch(`https://api.spotify.com/v1/${type}s/${id}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      title: data.name,
      artist: data.artists?.[0]?.name ?? '',
      artwork: type === 'track'
        ? (data.album?.images?.[0]?.url ?? null)
        : (data.images?.[0]?.url ?? null),
      type: type === 'track' ? 'song' : 'album',
    }
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
    if (type === 'album') return data.albums?.items?.[0]?.external_urls?.spotify ?? null
    return data.tracks?.items?.[0]?.external_urls?.spotify ?? null
  } catch {
    return null
  }
}

// ── Apple Music / iTunes ─────────────────────────────────────────────────────

async function lookupItunes(id: string, type: 'song' | 'album'): Promise<TrackMeta | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${id}&entity=${type}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.results?.[0]
    if (!item) return null
    const rawArtwork: string | undefined = item.artworkUrl100
    return {
      title: type === 'album' ? item.collectionName : item.trackName,
      artist: item.artistName,
      artwork: rawArtwork ? rawArtwork.replace('100x100bb', '600x600bb') : null,
      type,
    }
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

// ── YouTube Music ────────────────────────────────────────────────────────────

function parseYouTubeTitle(rawTitle: string, channelTitle: string): { title: string; artist: string } {
  const cleaned = rawTitle
    .replace(/\s*\(official\s*(music\s*)?video\)/gi, '')
    .replace(/\s*\(official\s*audio\)/gi, '')
    .replace(/\s*\[official\s*(music\s*)?video\]/gi, '')
    .replace(/\s*\(lyric\s*video\)/gi, '')
    .replace(/\s*\(lyrics\)/gi, '')
    .trim()

  const dashMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/)
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() }
  }

  // Auto-generated YouTube Music channels append " - Topic"
  const artist = channelTitle.replace(/\s*-\s*Topic$/i, '').trim()
  return { title: cleaned, artist }
}

// Uses the public oEmbed endpoint — no API key required
async function lookupYouTube(videoId: string): Promise<TrackMeta | null> {
  try {
    const videoUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${videoUrl}&format=json`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = await res.json()
    const { title, artist } = parseYouTubeTitle(data.title ?? '', data.author_name ?? '')
    // oEmbed gives hqdefault (480x360); try maxresdefault for higher quality
    const artwork = (data.thumbnail_url as string | undefined)
      ?.replace('hqdefault.jpg', 'maxresdefault.jpg') ?? data.thumbnail_url ?? null
    return { title, artist, artwork, type: 'song' }
  } catch {
    return null
  }
}

async function searchYouTubeMusic(title: string, artist: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null
  try {
    const q = encodeURIComponent(`${title} ${artist}`)
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?q=${q}&type=video&part=snippet&maxResults=1&key=${apiKey}`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const videoId = data.items?.[0]?.id?.videoId
    if (!videoId) return null
    return `https://music.youtube.com/watch?v=${videoId}`
  } catch {
    return null
  }
}

// ── URL parsing ──────────────────────────────────────────────────────────────

function parseSpotifyUrl(url: string): { id: string; type: 'track' | 'album' } | null {
  const match = url.match(/spotify\.com\/(track|album)\/([a-zA-Z0-9]+)/)
  if (!match) return null
  return { id: match[2], type: match[1] as 'track' | 'album' }
}

function parseAppleMusicUrl(url: string): { id: string; type: 'song' | 'album' } | null {
  try {
    const u = new URL(url)
    const trackId = u.searchParams.get('i')
    if (trackId && /^\d+$/.test(trackId)) return { id: trackId, type: 'song' }
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (last && /^\d+$/.test(last)) return { id: last, type: 'album' }
    return null
  } catch {
    return null
  }
}

function parseYouTubeMusicUrl(url: string): string | null {
  try {
    return new URL(url).searchParams.get('v')
  } catch {
    return null
  }
}

function detectInputPlatform(url: string): 'spotify' | 'appleMusic' | 'youtubeMusic' | null {
  try {
    const { hostname } = new URL(url)
    if (hostname.includes('spotify')) return 'spotify'
    if (hostname.includes('apple')) return 'appleMusic'
    if (hostname === 'music.youtube.com') return 'youtubeMusic'
  } catch {}
  return null
}

const ALLOWED_HOSTNAMES = [
  'open.spotify.com',
  'music.apple.com',
  'music.youtube.com',
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

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const url = req.nextUrl.searchParams.get('url')

  const ip =
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ??
    'unknown'

  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(RATE_WINDOW) } },
    )
  }

  const event: Record<string, unknown> = {
    service: 'api/resolve',
    timestamp: new Date().toISOString(),
    env: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
      region: process.env.VERCEL_REGION ?? 'local',
    },
    input: { url, platform: url ? detectInputPlatform(url) : null },
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

  if (!url) return respond({ error: 'Missing url parameter' }, 400)
  if (url.length > 2048) return respond({ error: 'URL too long.' }, 400)
  if (!isAllowedMusicUrl(url)) {
    return respond(
      { error: 'URL not supported. Please paste a link from Spotify, Apple Music, or YouTube Music.' },
      400,
    )
  }

  try {
    const inputPlat = detectInputPlatform(url)
    let meta: TrackMeta | null = null
    const platforms: Array<{ id: string; name: string; url: string; color: string }> = []

    if (inputPlat === 'spotify') {
      const parsed = parseSpotifyUrl(url)
      if (!parsed) return respond({ error: 'Invalid Spotify URL.' }, 400)
      meta = await lookupSpotify(parsed.id, parsed.type)
      if (!meta) return respond({ error: 'Could not fetch track info from Spotify.' }, 502)

      platforms.push({
        id: 'spotify',
        ...PLATFORM_META.spotify,
        url: `https://open.spotify.com/${parsed.type}/${parsed.id}`,
      })

      const [itunesUrl, youtubeUrl] = await Promise.all([
        searchItunes(meta.title, meta.artist, meta.type),
        searchYouTubeMusic(meta.title, meta.artist),
      ])
      if (itunesUrl) platforms.push({ id: 'appleMusic', ...PLATFORM_META.appleMusic, url: itunesUrl })
      if (youtubeUrl) platforms.push({ id: 'youtubeMusic', ...PLATFORM_META.youtubeMusic, url: youtubeUrl })

    } else if (inputPlat === 'appleMusic') {
      const parsed = parseAppleMusicUrl(url)
      if (!parsed) return respond({ error: 'Invalid Apple Music URL.' }, 400)
      meta = await lookupItunes(parsed.id, parsed.type)
      if (!meta) return respond({ error: 'Could not fetch track info from iTunes.' }, 502)

      platforms.push({ id: 'appleMusic', ...PLATFORM_META.appleMusic, url })

      const [spotifyUrl, youtubeUrl] = await Promise.all([
        searchSpotify(meta.title, meta.artist, meta.type),
        searchYouTubeMusic(meta.title, meta.artist),
      ])
      if (spotifyUrl) platforms.push({ id: 'spotify', ...PLATFORM_META.spotify, url: spotifyUrl })
      if (youtubeUrl) platforms.push({ id: 'youtubeMusic', ...PLATFORM_META.youtubeMusic, url: youtubeUrl })

    } else if (inputPlat === 'youtubeMusic') {
      const videoId = parseYouTubeMusicUrl(url)
      if (!videoId) return respond({ error: 'Invalid YouTube Music URL.' }, 400)
      meta = await lookupYouTube(videoId)
      if (!meta) return respond({ error: 'Could not fetch track info from YouTube. Make sure YOUTUBE_API_KEY is set.' }, 502)

      platforms.push({ id: 'youtubeMusic', ...PLATFORM_META.youtubeMusic, url })

      const [spotifyUrl, itunesUrl] = await Promise.all([
        searchSpotify(meta.title, meta.artist, meta.type),
        searchItunes(meta.title, meta.artist, meta.type),
      ])
      if (spotifyUrl) platforms.push({ id: 'spotify', ...PLATFORM_META.spotify, url: spotifyUrl })
      if (itunesUrl) platforms.push({ id: 'appleMusic', ...PLATFORM_META.appleMusic, url: itunesUrl })

    } else {
      return respond(
        { error: 'URL not supported. Please paste a link from Spotify, Apple Music, or YouTube Music.' },
        400,
      )
    }

    // Sort by preferred order
    const sorted = PLATFORM_ORDER
      .map(id => platforms.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p != null)

    event.song = { title: meta.title, artist: meta.artist, type: meta.type }
    event.platform_count = sorted.length
    event.platforms_found = sorted.map(p => p.id)

    const result: ResolvedSong = {
      title: meta.title,
      artist: meta.artist,
      artwork: meta.artwork,
      type: meta.type,
      platforms: sorted,
    }

    return respond(result, 200)
  } catch (err) {
    event.error = { message: err instanceof Error ? err.message : String(err), type: err instanceof Error ? err.name : 'unknown' }
    return respond({ error: 'Something went wrong. Please try again.' }, 500)
  }
}
