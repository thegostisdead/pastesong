# PasteSong

**One link. Every platform.**

Paste a Spotify, Apple Music, YouTube Music, or Tidal link — PasteSong instantly gives you that song on every major streaming platform.

🔗 **[pastesong.vercel.app](https://pastesong.vercel.app)**

---

## Features

- Paste any music link and get cross-platform links in one click
- Supports Spotify, Apple Music, YouTube Music, Tidal, Deezer, SoundCloud, Amazon Music, and more
- Apple Music fallback via iTunes Search API when Odesli doesn't have a match
- Copy individual platform links to clipboard
- Auto-resolves links from `?from=` URL param (shareable deep links)
- Discord bot — automatically replies with cross-platform links when a music URL is posted

## Stack

**Web app**
- [Next.js 14](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [goey-toast](https://goey-toast.vercel.app) — morphing toast notifications
- [Odesli API](https://odesli.co) — cross-platform music link resolution
- [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI) — Apple Music fallback
- Deployed on [Vercel](https://vercel.com)

**Discord bot**
- [discord.js v14](https://discord.js.org)
- TypeScript + ts-node
- Watches for music links in messages and replies with a rich embed

## Data sources

PasteSong is transparent about where it fetches data:

| Source | Used for |
|---|---|
| [Odesli / song.link API](https://odesli.co) | Primary cross-platform link resolution |
| [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI) | Apple Music fallback (matched by title + artist) |
| [Spotify API](https://developer.spotify.com/documentation/web-api) | Spotify fallback (matched by title + artist) |

No data is stored. All lookups happen at request time and are cached for 1 hour at the edge.

## Environment variables

### Web app

| Variable | Required | Description |
|---|---|---|
| `SPOTIFY_CLIENT_ID` | Optional | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Optional | Spotify app client secret |

These are used as a fallback to find a Spotify link when Odesli doesn't return one. Without them the app works fine — Spotify links will simply be omitted in those cases.

#### Getting Spotify credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app (any name/description, no redirect URI needed)
3. Copy the **Client ID** and **Client Secret**

### Discord bot

| Variable | Required | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | **Required** | Bot token from the Discord Developer Portal |
| `PASTESONG_API_URL` | Optional | Override the API base URL (defaults to `https://pastesong.vercel.app/api/resolve`) |

#### Getting a Discord bot token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application, then go to the **Bot** tab
3. Click **Reset Token** and copy it
4. Under **Privileged Gateway Intents**, enable **Message Content Intent**
5. Invite the bot to your server via **OAuth2 → URL Generator** with scopes `bot` and permission **Send Messages** + **Read Message History**

## Getting started

### Web app

```bash
git clone https://github.com/your-username/pastesong.git
cd pastesong
bun install
```

Copy the example env file and fill in the optional Spotify credentials:

```bash
cp .env.example .env.local
```

```
# .env.local
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

Then run the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Discord bot

```bash
cd discord-bot
npm install
cp .env.example .env
```

Fill in your bot token in `.env`:

```
DISCORD_BOT_TOKEN=your_bot_token_here
```

Run in development:

```bash
npm run dev
```

Or build and run for production:

```bash
npm run build
npm start
```

## Deployment

Deploy instantly with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/pastesong)

Or via CLI:

```bash
vercel --prod
```

## Project structure

```
pastesong/
├── app/
│   ├── api/
│   │   └── resolve/route.ts   # API route — Odesli fetch + iTunes/Spotify fallback
│   ├── components/
│   │   └── MusicResolver.tsx  # Main UI component
│   ├── opengraph-image.tsx    # OG image for Discord / social embeds
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
└── discord-bot/
    └── src/
        └── index.ts           # Bot entrypoint — watches messages, replies with embed
```

## Contributing

Contributions are welcome. Open an issue or submit a pull request.

## License

MIT
