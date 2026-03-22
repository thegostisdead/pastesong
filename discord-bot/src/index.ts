import 'dotenv/config'
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Message,
  ActivityType,
} from 'discord.js'

// ── Logger ───────────────────────────────────────────────────────────────────

const SERVICE_VERSION = process.env.npm_package_version ?? '1.0.0'
const COMMIT_HASH = process.env.COMMIT_HASH ?? 'unknown'

const log = {
  info:  (event: Record<string, unknown>) => console.log(JSON.stringify({ level: 'info',  ...env(), ...event })),
  error: (event: Record<string, unknown>) => console.error(JSON.stringify({ level: 'error', ...env(), ...event })),
}

function env(): Record<string, unknown> {
  return { timestamp: new Date().toISOString(), version: SERVICE_VERSION, commit: COMMIT_HASH }
}

// ── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const API_BASE  = process.env.PASTESONG_API_URL ?? 'https://pastesong.vercel.app/api/resolve'

if (!BOT_TOKEN) {
  log.error({ event: 'startup_error', error: 'Missing DISCORD_BOT_TOKEN environment variable' })
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
  platforms: Platform[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MUSIC_HOSTNAMES = [
  'open.spotify.com',
  'music.apple.com',
  'music.youtube.com',
]

const PLATFORM_EMOJI: Record<string, string> = {
  spotify:      '🟢',
  appleMusic:   '🍎',
  youtubeMusic: '▶️',
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
    .setFooter({ text: 'pastesong.vercel.app' })

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
  log.info({ event: 'bot_ready', tag: client.user?.tag })
  client.user?.setActivity('for song links', { type: ActivityType.Watching })
})

client.on('messageCreate', async (message: Message) => {
  // Ignore bots
  if (message.author.bot) return

  const startTime = Date.now()
  const wide: Record<string, unknown> = {
    event:      'message_processed',
    message_id: message.id,
    guild_id:   message.guildId,
    guild_name: (message.guild?.name),
    channel_id: message.channelId,
    channel:    (message.channel as any).name ?? message.channelId,
    author_id:  message.author.id,
    author:     message.author.tag,
  }

  try {
    const musicUrl = extractMusicUrl(message.content)
    if (!musicUrl) return

    wide.music_url = musicUrl

    // Show typing indicator while we resolve
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping()
    }

    const result = await resolveSong(musicUrl)

    if ('error' in result) {
      wide.outcome = 'resolution_error'
      wide.error   = result.error
      // Only reply visibly if it's a user-facing error (not a silent skip)
      if (result.error.includes('not recognized') || result.error.includes('not found')) {
        await message.reply({ content: `⚠️ ${result.error}` })
      }
      return
    }

    wide.outcome         = 'success'
    wide.song_title      = result.title
    wide.song_artist     = result.artist
    wide.song_type       = result.type
    wide.platform_count  = result.platforms.length
    wide.platforms       = result.platforms.map(p => p.id)

    const embed = buildEmbed(result)
    await message.reply({ embeds: [embed] })
  } catch (err) {
    wide.outcome = 'error'
    wide.error   = String(err)
  } finally {
    if (wide.outcome) {
      wide.duration_ms = Date.now() - startTime
      const emit = wide.outcome === 'error' ? log.error : log.info
      emit(wide)
    }
  }
})

client.login(BOT_TOKEN)
