/**
 * StreamReaper — Discord Notification Test
 *
 * Tests sending an encounter notification to a Discord webhook.
 *
 * Usage:
 *   1. Create a Discord webhook in your test server:
 *      Server Settings → Integrations → Webhooks → New Webhook
 *   2. Copy the webhook URL
 *   3. Run: DISCORD_TEST_WEBHOOK="https://discord.com/api/webhooks/..." npx tsx src/scripts/testDiscord.ts
 *
 *   Or add DISCORD_TEST_WEBHOOK to .env.local and run:
 *   npm run test:discord
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  sendDiscordNotification,
  testDiscordWebhook,
} from '../services/discordNotifier';

async function main() {
  console.log('=== StreamReaper — Discord Notification Test ===\n');

  const webhookUrl = process.env.DISCORD_TEST_WEBHOOK;

  if (!webhookUrl) {
    console.log('❌ No DISCORD_TEST_WEBHOOK found in environment.');
    console.log('');
    console.log('To test Discord notifications:');
    console.log('  1. Create a webhook in a Discord server:');
    console.log('     Server Settings → Integrations → Webhooks → New Webhook');
    console.log('  2. Copy the webhook URL');
    console.log('  3. Add to .env.local: DISCORD_TEST_WEBHOOK=https://discord.com/api/webhooks/...');
    console.log('  4. Run: npm run test:discord');
    console.log('');
    console.log('Or run inline:');
    console.log('  DISCORD_TEST_WEBHOOK="<url>" npx tsx src/scripts/testDiscord.ts');
    process.exit(1);
  }

  // ── Test 1: Webhook validation ──────────────────────────────────────

  console.log('1. Testing webhook connection...');
  const isValid = await testDiscordWebhook(webhookUrl);

  if (!isValid) {
    console.error('   ❌ Webhook test failed — check the URL and try again');
    process.exit(1);
  }
  console.log('   ✅ Webhook connected! Check your Discord server for the confirmation message.\n');

  // ── Test 2: Kill notification ───────────────────────────────────────

  console.log('2. Sending kill notification...');
  try {
    await sendDiscordNotification({
      webhookUrl,
      encounterType: 'kill',
      streamerName: 'tarik',
      streamerViewers: 24000,
      weapon: 'Vandal',
      mapName: 'Ascent',
      matchScore: '13-7',
      roundNumber: 18,
      encounterPageUrl: 'https://streamreaper.gg/encounter/test-kill',
    });
    console.log('   ✅ Kill notification sent!\n');
  } catch (error) {
    console.error('   ❌ Kill notification failed:', error);
  }

  // ── Test 3: Ace notification ────────────────────────────────────────

  console.log('3. Sending ace notification...');
  try {
    await sendDiscordNotification({
      webhookUrl,
      encounterType: 'ace',
      streamerName: 'TenZ',
      streamerViewers: 15000,
      mapName: 'Haven',
      matchScore: '9-13',
      roundNumber: 8,
      encounterPageUrl: 'https://streamreaper.gg/encounter/test-ace',
    });
    console.log('   ✅ Ace notification sent!\n');
  } catch (error) {
    console.error('   ❌ Ace notification failed:', error);
  }

  // ── Test 4: Death notification ──────────────────────────────────────

  console.log('4. Sending death notification...');
  try {
    await sendDiscordNotification({
      webhookUrl,
      encounterType: 'death',
      streamerName: 'shroud',
      streamerViewers: 12000,
      weapon: 'Operator',
      mapName: 'Bind',
      matchScore: '11-13',
      roundNumber: 22,
      encounterPageUrl: 'https://streamreaper.gg/encounter/test-death',
    });
    console.log('   ✅ Death notification sent!\n');
  } catch (error) {
    console.error('   ❌ Death notification failed:', error);
  }

  console.log('=== Discord notification test complete ===');
  console.log('Check your Discord server — you should see 4 messages (1 test + 3 encounters).');
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
