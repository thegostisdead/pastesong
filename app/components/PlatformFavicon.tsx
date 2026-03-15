const PLATFORM_DOMAINS: Record<string, string> = {
  spotify:      'open.spotify.com',
  appleMusic:   'music.apple.com',
  youtube:      'youtube.com',
  youtubeMusic: 'music.youtube.com',
  tidal:        'tidal.com',
  amazonMusic:  'music.amazon.com',
  amazon:       'music.amazon.com',
  deezer:       'deezer.com',
  soundcloud:   'soundcloud.com',
  pandora:      'pandora.com',
  anghami:      'anghami.com',
  boomplay:     'boomplay.com',
  napster:      'napster.com',
}

export default function PlatformFavicon({ platformId, name }: { platformId: string; name: string }) {
  const domain = PLATFORM_DOMAINS[platformId] ?? platformId
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={name}
      width={20}
      height={20}
      className="w-5 h-5 rounded-sm"
    />
  )
}
