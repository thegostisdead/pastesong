import 'dotenv/config'
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Message,
  ActivityType,
} from 'discord.js'

// ── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const API_BASE  = process.env.PASTESONG_API_URL ?? 'https://pastesong.vercel.app/api/resolve'

if (!BOT_TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN environment variable')
  process.exit(1)
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Platform {
  id: string
  name: string
  url: string
  color: string
}

interface ResolvedSong {
  title: string
  artist: string
  artwork: string | null
  type: 'song' | 'album'
  songLinkUrl: string
  platforms: Platform[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MUSIC_HOSTNAMES = [
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

// Platform emoji map for a nicer look in the embed
const PLATFORM_EMOJI: Record<string, string> = {
  spotify:      '🟢',
  appleMusic:   '🍎',
  youtubeMusic: '▶️',
  youtube:      '📺',
  tidal:        '🌊',
  amazonMusic:  '📦',
  amazon:       '📦',
  deezer:       '🎵',
  soundcloud:   '☁️',
  pandora:      '💜',
  anghami:      '🎶',
  boomplay:     '🔊',
  napster:      '🎧',
}

function extractMusicUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s<>"\]]+/g
  const matches = text.match(urlRegex) ?? []

  for (const raw of matches) {
    try {
      const u = new URL(raw)
      if (MUSIC_HOSTNAMES.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`))) {
        return raw
      }
    } catch {
      // not a valid URL
    }
  }
  return null
}

async function resolveSong(url: string): Promise<ResolvedSong | { error: string }> {
  const res = await fetch(`${API_BASE}?url=${encodeURIComponent(url)}`)
  return res.json() as Promise<ResolvedSong | { error: string }>
}

function buildEmbed(song: ResolvedSong): EmbedBuilder {
  // Use color of the first available platform
  const primaryColor = song.platforms[0]?.color ?? '#5865F2'
  const colorInt = parseInt(primaryColor.replace('#', ''), 16)

  // Build platform links as "emoji [Name](url)" bullet list
  const links = song.platforms
    .map(p => {
      const emoji = PLATFORM_EMOJI[p.id] ?? '🎵'
      return `${emoji} [${p.name}](${p.url})`
    })
    .join('\n')

  const embed = new EmbedBuilder()
    .setColor(colorInt)
    .setAuthor({ name: 'pastesong', url: 'https://pastesong.vercel.app' })
    .setTitle(`${song.title}`)
    .setDescription(`by **${song.artist}**\n\n${links}`)
    .setFooter({ text: `View on song.link → ${song.songLinkUrl}` })

  if (song.artwork) {
    embed.setThumbnail(song.artwork)
  }

  return embed
}

// ── Bot ──────────────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user?.tag}`)
  client.user?.setActivity('for song links', { type: ActivityType.Watching })
})

client.on('messageCreate', async (message: Message) => {
  // Ignore bots
  if (message.author.bot) return

  console.log(`[msg] #${(message.channel as any).name ?? message.channelId} | ${message.author.tag}: ${message.content}`)

  const musicUrl = extractMusicUrl(message.content)
  console.log(`[url] extracted:`, musicUrl)
  if (!musicUrl) return

  // Show typing indicator while we resolve
  if ('sendTyping' in message.channel) {
    await message.channel.sendTyping()
  }

  try {
    const result = await resolveSong(musicUrl)

    if ('error' in result) {
      // Only reply visibly if it's a user-facing error (not a silent skip)
      if (result.error.includes('not recognized') || result.error.includes('not found')) {
        await message.reply({ content: `⚠️ ${result.error}` })
      }
      return
    }

    const embed = buildEmbed(result)
    await message.reply({ embeds: [embed] })
  } catch (err) {
    console.error('Failed to resolve song:', err)
  }
})

client.login(BOT_TOKEN)
