import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  authenticate,
  getUserByLogin,
  getVodsByUserId,
  getLiveValorantStreams,
  findVodAtTime,
  parseTwitchDuration,
} from '../services/twitchApi';

async function main() {
  console.log('=== StreamReaper — Twitch API Test ===\n');

  // -------------------------------------------------------
  // 1. Authenticate
  // -------------------------------------------------------
  console.log('1. Authenticating with Twitch...');
  try {
    const token = await authenticate();
    console.log(`   ✅ Got app access token: ${token.substring(0, 8)}...`);
  } catch (error) {
    console.error('   ❌ Authentication failed:', error);
    process.exit(1);
  }

  // -------------------------------------------------------
  // 2. Look up a known Valorant streamer
  // -------------------------------------------------------
  const testStreamer = 'tarik'; // Change to any known Valorant streamer
  console.log(`\n2. Looking up Twitch user: ${testStreamer}`);
  const user = await getUserByLogin(testStreamer);

  if (!user) {
    console.error(`   ❌ User "${testStreamer}" not found`);
    process.exit(1);
  }

  console.log(`   ✅ Found: ${user.display_name}`);
  console.log(`      ID: ${user.id}`);
  console.log(`      Broadcaster type: ${user.broadcaster_type || 'none'}`);
  console.log(`      Description: ${user.description.substring(0, 80)}${user.description.length > 80 ? '...' : ''}`);

  // -------------------------------------------------------
  // 3. Fetch their recent VODs
  // -------------------------------------------------------
  console.log(`\n3. Fetching recent VODs for ${user.display_name}...`);
  const vods = await getVodsByUserId(user.id, 5);

  if (vods.length === 0) {
    console.log('   ⚠️  No VODs found (VODs may be disabled or expired)');
  } else {
    console.log(`   ✅ Found ${vods.length} VOD(s):\n`);
    for (const vod of vods) {
      const startTime = new Date(vod.created_at);
      const durationMs = parseTwitchDuration(vod.duration);
      const endTime = new Date(startTime.getTime() + durationMs);

      console.log(`   📹 "${vod.title}"`);
      console.log(`      VOD ID: ${vod.id}`);
      console.log(`      Duration: ${vod.duration}`);
      console.log(`      Started: ${startTime.toISOString()}`);
      console.log(`      Ended:   ${endTime.toISOString()}`);
      console.log(`      Views: ${vod.view_count}`);
      console.log(`      URL: ${vod.url}`);
      console.log('');
    }
  }

  // -------------------------------------------------------
  // 4. Test findVodAtTime (use midpoint of first VOD)
  // -------------------------------------------------------
  if (vods.length > 0) {
    const firstVod = vods[0];
    const vodStartMs = new Date(firstVod.created_at).getTime();
    const vodDurationMs = parseTwitchDuration(firstVod.duration);
    const midpointMs = vodStartMs + Math.floor(vodDurationMs / 2);

    console.log('4. Testing findVodAtTime with midpoint of most recent VOD...');
    const foundVod = await findVodAtTime(user.id, midpointMs);

    if (foundVod) {
      console.log(`   ✅ Correctly found VOD: "${foundVod.title}" (ID: ${foundVod.id})`);
    } else {
      console.log('   ❌ Failed to find VOD at known midpoint (unexpected)');
    }
  }

  // -------------------------------------------------------
  // 5. Fetch live Valorant streams
  // -------------------------------------------------------
  console.log('\n5. Fetching live Valorant streams...');
  const { streams, cursor } = await getLiveValorantStreams(5);

  if (streams.length === 0) {
    console.log('   ⚠️  No live Valorant streams found');
  } else {
    console.log(`   ✅ Found ${streams.length} live stream(s):\n`);
    for (const stream of streams) {
      console.log(`   🔴 ${stream.user_name} — ${stream.viewer_count.toLocaleString()} viewers`);
      console.log(`      Title: ${stream.title.substring(0, 60)}${stream.title.length > 60 ? '...' : ''}`);
      console.log(`      Started: ${stream.started_at}`);
      console.log('');
    }
    if (cursor) {
      console.log(`   (more available — pagination cursor: ${cursor.substring(0, 20)}...)`);
    }
  }

  console.log('\n=== Twitch API test complete ===');
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
