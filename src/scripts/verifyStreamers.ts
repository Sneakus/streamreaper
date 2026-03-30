import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPlayerByRiotId } from '../services/riotApi';
import { authenticate, getUserByLogin } from '../services/twitchApi';

interface RiotIdEntry {
  gameName: string;
  tagLine: string;
  verified: boolean;
}

interface StreamerEntry {
  twitchUsername: string;
  displayName: string;
  riotId: RiotIdEntry;
  alternateRiotIds?: Omit<RiotIdEntry, 'verified'>[];
  region: string;
  twitchUserId: string | null;
  puuid: string | null;
  avgViewers: number;
  broadcasterType: string;
  peripherals: Record<string, string | null> | null;
}

interface StreamerSeedFile {
  _meta: Record<string, unknown>;
  streamers: StreamerEntry[];
}

// Rate limit: Riot dev key = 20 req/s, 100 req/2min. Be conservative.
const RIOT_DELAY_MS = 1500;
// Twitch = 800 req/min. Very generous.
const TWITCH_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const seedPath = path.resolve(process.cwd(), 'src/data/streamers.seed.json');
  const outputPath = path.resolve(process.cwd(), 'src/data/streamers.verified.json');

  if (!fs.existsSync(seedPath)) {
    console.error(`❌ Seed file not found at ${seedPath}`);
    process.exit(1);
  }

  const seedData: StreamerSeedFile = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  const streamers = seedData.streamers;

  console.log('=== StreamReaper — Streamer Verification ===\n');
  console.log(`Found ${streamers.length} streamers to verify.\n`);

  // ── Step 1: Resolve Twitch usernames → user IDs ──────────────────────

  console.log('── Resolving Twitch user IDs ──\n');

  try {
    await authenticate();
    console.log('✅ Twitch authenticated\n');
  } catch (error) {
    console.error('❌ Twitch auth failed:', error);
    console.log('   Skipping Twitch resolution.\n');
  }

  let twitchResolved = 0;
  let twitchFailed = 0;

  for (const streamer of streamers) {
    if (streamer.twitchUserId) {
      console.log(`  ⏭️  ${streamer.twitchUsername} — already has Twitch ID`);
      twitchResolved++;
      continue;
    }

    try {
      const user = await getUserByLogin(streamer.twitchUsername);
      if (user) {
        streamer.twitchUserId = user.id;
        streamer.broadcasterType = user.broadcaster_type || '';
        console.log(`  ✅ ${streamer.twitchUsername} → Twitch ID: ${user.id} (${user.broadcaster_type || 'none'})`);
        twitchResolved++;
      } else {
        console.log(`  ⚠️  ${streamer.twitchUsername} — not found on Twitch`);
        twitchFailed++;
      }
    } catch (error) {
      console.log(`  ❌ ${streamer.twitchUsername} — error: ${error instanceof Error ? error.message : error}`);
      twitchFailed++;
    }

    await sleep(TWITCH_DELAY_MS);
  }

  console.log(`\n   Twitch: ${twitchResolved} resolved, ${twitchFailed} failed\n`);

  // ── Step 2: Resolve Riot IDs → PUUIDs ────────────────────────────────

  console.log('── Resolving Riot PUUIDs ──\n');
  console.log('   ⚠️  Note: Riot dev key only works for account-v1 (player lookup).');
  console.log('   Match data still requires the production key.\n');

  let riotResolved = 0;
  let riotFailed = 0;

  for (const streamer of streamers) {
    if (streamer.puuid) {
      console.log(`  ⏭️  ${streamer.displayName} — already has PUUID`);
      riotResolved++;
      continue;
    }

    const { gameName, tagLine } = streamer.riotId;

    // Skip placeholder tagLines — these need manual research
    if (tagLine === '0000') {
      console.log(`  ⏭️  ${streamer.displayName} — tagLine is placeholder (0000), needs manual lookup`);
      riotFailed++;
      continue;
    }

    try {
      const account = await getPlayerByRiotId(gameName, tagLine);
      streamer.puuid = account.puuid;
      streamer.riotId.verified = true;
      // Update gameName/tagLine to match what Riot returned (canonical form)
      streamer.riotId.gameName = account.gameName;
      streamer.riotId.tagLine = account.tagLine;
      console.log(`  ✅ ${streamer.displayName} → ${account.gameName}#${account.tagLine} → PUUID: ${account.puuid.substring(0, 12)}...`);
      riotResolved++;
    } catch (error) {
      console.log(`  ❌ ${streamer.displayName} (${gameName}#${tagLine}) — ${error instanceof Error ? error.message : error}`);
      riotFailed++;

      // Try alternate Riot IDs if available
      if (streamer.alternateRiotIds) {
        for (const alt of streamer.alternateRiotIds) {
          try {
            await sleep(RIOT_DELAY_MS);
            const account = await getPlayerByRiotId(alt.gameName, alt.tagLine);
            streamer.puuid = account.puuid;
            streamer.riotId = {
              gameName: account.gameName,
              tagLine: account.tagLine,
              verified: true,
            };
            console.log(`     ✅ Alt worked: ${account.gameName}#${account.tagLine} → PUUID: ${account.puuid.substring(0, 12)}...`);
            riotResolved++;
            riotFailed--; // Undo the failure count
            break;
          } catch {
            console.log(`     ❌ Alt failed: ${alt.gameName}#${alt.tagLine}`);
          }
        }
      }
    }

    await sleep(RIOT_DELAY_MS);
  }

  console.log(`\n   Riot: ${riotResolved} resolved, ${riotFailed} failed\n`);

  // ── Step 3: Write verified output ────────────────────────────────────

  const output: StreamerSeedFile = {
    _meta: {
      ...seedData._meta,
      lastVerified: new Date().toISOString(),
      twitchResolved,
      twitchFailed,
      riotResolved,
      riotFailed,
    },
    streamers,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Verified data written to ${outputPath}`);

  // ── Summary ──────────────────────────────────────────────────────────

  const needsWork = streamers.filter(
    (s) => !s.puuid || !s.twitchUserId
  );

  if (needsWork.length > 0) {
    console.log(`\n⚠️  ${needsWork.length} streamer(s) still need manual attention:\n`);
    for (const s of needsWork) {
      const issues: string[] = [];
      if (!s.puuid) issues.push('no PUUID');
      if (!s.twitchUserId) issues.push('no Twitch ID');
      console.log(`   - ${s.displayName} (${s.twitchUsername}): ${issues.join(', ')}`);
    }
    console.log('\n   To fix: look up their Riot ID on tracker.gg or their Twitch bio,');
    console.log('   update streamers.seed.json, and re-run this script.');
  }

  console.log('\n=== Verification complete ===\n');
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
