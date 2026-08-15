# StreamReaper

**You killed a streamer. See their reaction.**

Live at [streamreaper.gg](https://streamreaper.gg)

StreamReaper scans your Valorant match history and finds the games where you killed, or were killed by, a Twitch streamer. When it finds one, it sends you a timestamped link straight to the moment in the streamer's VOD, so you can watch how they reacted.

Built solo, AI-assisted.

## Status

Currently awaiting Riot Games production API key approval. Everything that does not depend on production match data is built and deployed.

## How it works

1. Log in with Discord and link your Riot account.
2. StreamReaper checks your recent matches against a seeded list of Valorant streamers.
3. When it finds an encounter, it works out where in the streamer's VOD that moment sits and sends you the link.
4. Notifications arrive by Discord or email, colour-coded by whether you got the kill or they did.

## Features

- Discord OAuth login with persistent sessions
- Riot account linking, validated against the API in real time
- Twitch integration: VOD fetching, timestamp calculation, live stream discovery
- Automated Discord and email notifications, colour-coded by encounter type
- 25 Valorant streamers seeded, 14 verified with PUUIDs
- Timestamp calculator with 17 passing unit tests
- Full landing page with auth-aware navigation

## Screenshots

**Landing page**

![Landing page](docs/mockups/Screenshot_2026-03-30_163702.png)

**Account linking**

![Account linking](docs/mockups/Screenshot_2026-03-30_163710.png)

**Dashboard**

![Dashboard](docs/mockups/Screenshot_2026-03-30_163715.png)

**Encounter page**

![Encounter page](docs/mockups/Screenshot_2026-03-30_163719.png)

**Notifications**

![Notifications](docs/mockups/Screenshot_2026-03-30_163725.png)

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4
- PostgreSQL via Supabase, Prisma ORM v6
- Supabase Auth with Discord OAuth 2.0
- Riot Games API, Twitch API
- Resend for email, Discord webhooks for alerts
- Vercel for hosting and CI/CD

## Running it locally

```bash
git clone https://github.com/Sneakus/streamreaper.git
cd streamreaper
npm install
cp .env.example .env.local   # fill in your own keys
npx prisma db push
npm run dev
```

You will need your own credentials for the following:

```
RIOT_API_KEY
TWITCH_CLIENT_ID
TWITCH_CLIENT_SECRET
DATABASE_URL
DIRECT_URL
DISCORD_TEST_WEBHOOK
RESEND_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Disclaimer

StreamReaper isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
