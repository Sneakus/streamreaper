/**
 * StreamReaper — Database Seed Script
 *
 * Imports verified streamers from streamers.verified.json into the database.
 * Only imports streamers that have both a PUUID and Twitch user ID resolved.
 *
 * Run with: npx tsx prisma/seed.ts
 *
 * Or add to package.json:
 *   "prisma": { "seed": "tsx prisma/seed.ts" }
 * Then run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface SeedStreamer {
  twitchUsername: string;
  displayName: string;
  riotId: { gameName: string; tagLine: string; verified: boolean };
  region: string;
  twitchUserId: string | null;
  puuid: string | null;
  avgViewers: number;
  broadcasterType: string;
  peripherals: Record<string, string | null> | null;
}

async function main() {
  console.log('=== StreamReaper — Database Seed ===\n');

  // Try verified file first, fall back to seed file
  const verifiedPath = path.resolve(process.cwd(), 'src/data/streamers.verified.json');
  const seedPath = path.resolve(process.cwd(), 'src/data/streamers.seed.json');

  const filePath = fs.existsSync(verifiedPath) ? verifiedPath : seedPath;
  const fileLabel = filePath === verifiedPath ? 'verified' : 'seed (unverified)';

  console.log(`Loading streamers from ${fileLabel} file...`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const streamers: SeedStreamer[] = data.streamers;

  // Only import streamers with both PUUID and Twitch user ID
  const ready = streamers.filter((s) => s.puuid && s.twitchUserId);
  const skipped = streamers.filter((s) => !s.puuid || !s.twitchUserId);

  console.log(`  ${ready.length} streamers ready to import`);
  console.log(`  ${skipped.length} streamers skipped (missing PUUID or Twitch ID)\n`);

  if (skipped.length > 0) {
    console.log('  Skipped:');
    for (const s of skipped) {
      const reasons: string[] = [];
      if (!s.puuid) reasons.push('no PUUID');
      if (!s.twitchUserId) reasons.push('no Twitch ID');
      console.log(`    - ${s.displayName}: ${reasons.join(', ')}`);
    }
    console.log('');
  }

  let created = 0;
  let updated = 0;

  for (const s of ready) {
    const result = await prisma.streamer.upsert({
      where: { riotPuuid: s.puuid! },
      update: {
        twitchUsername: s.twitchUsername,
        twitchDisplayName: s.displayName,
        gameName: s.riotId.gameName,
        tagLine: s.riotId.tagLine,
        region: s.region,
        avgViewers: s.avgViewers,
        broadcasterType: s.broadcasterType,
        peripheralsJson: s.peripherals ?? undefined,
      },
      create: {
        twitchUserId: s.twitchUserId!,
        twitchUsername: s.twitchUsername,
        twitchDisplayName: s.displayName,
        riotPuuid: s.puuid!,
        gameName: s.riotId.gameName,
        tagLine: s.riotId.tagLine,
        region: s.region,
        avgViewers: s.avgViewers,
        broadcasterType: s.broadcasterType,
        peripheralsJson: s.peripherals ?? undefined,
      },
    });

    // upsert doesn't tell us if it created or updated, so check createdAt vs updatedAt
    const isNew =
      result.createdAt.getTime() === result.updatedAt.getTime() ||
      Date.now() - result.createdAt.getTime() < 5000;

    if (isNew) {
      console.log(`  ✅ Created: ${s.displayName} (${s.twitchUsername})`);
      created++;
    } else {
      console.log(`  🔄 Updated: ${s.displayName} (${s.twitchUsername})`);
      updated++;
    }
  }

  console.log(`\n=== Done: ${created} created, ${updated} updated ===\n`);
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
