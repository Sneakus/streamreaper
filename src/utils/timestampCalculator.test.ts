/**
 * StreamReaper — Timestamp Calculator Tests
 *
 * Run with: npx tsx src/utils/timestampCalculator.test.ts
 *
 * Simple assert-based tests — no test framework needed.
 */

import {
  calculateVodTimestamp,
  buildTwitchVodUrl,
  DEFAULT_SAFETY_BUFFER_MS,
} from './timestampCalculator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ ${testName}`);
    failed++;
  }
}

function assertStrictEqual(actual: unknown, expected: unknown, testName: string) {
  assert(actual === expected, `${testName} (got: ${actual}, expected: ${expected})`);
}

// ─── Test Data ───────────────────────────────────────────────────────────────

// Scenario: streamer started streaming at 20:00:00 UTC,
// match started at 20:15:00 UTC, kill happened 3 minutes into the match.
const vodCreatedAt = '2026-03-28T20:00:00Z';
const vodCreatedAtMs = new Date(vodCreatedAt).getTime();

const matchStartMillis = vodCreatedAtMs + 15 * 60 * 1000; // 20:15:00 UTC
const killGameTimeMillis = 3 * 60 * 1000;                  // 3 min into match

// So the kill happened at 20:18:00 UTC
// VOD offset = 18 minutes = 1080 seconds
// After 30s buffer = 1050 seconds = 17m30s

const vodId = '2345678901';

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log('\n=== StreamReaper — Timestamp Calculator Tests ===\n');

// --- calculateVodTimestamp ---

console.log('calculateVodTimestamp:');

const result = calculateVodTimestamp(matchStartMillis, killGameTimeMillis, vodCreatedAt, vodId);

assert(result !== null, 'returns a result for valid inputs');
assertStrictEqual(result!.rawOffsetSeconds, 1080, 'raw offset is 18 minutes (1080s)');
assertStrictEqual(result!.offsetSeconds, 1050, 'buffered offset is 17m30s (1050s)');
assertStrictEqual(
  result!.vodUrl,
  'https://www.twitch.tv/videos/2345678901?t=0h17m30s',
  'URL format is correct',
);

// Custom buffer
const customBuffer = calculateVodTimestamp(matchStartMillis, killGameTimeMillis, vodCreatedAt, vodId, 10_000);
assert(customBuffer !== null, 'works with custom buffer');
assertStrictEqual(customBuffer!.offsetSeconds, 1070, 'custom 10s buffer gives 1070s');

// Zero buffer
const zeroBuffer = calculateVodTimestamp(matchStartMillis, killGameTimeMillis, vodCreatedAt, vodId, 0);
assert(zeroBuffer !== null, 'works with zero buffer');
assertStrictEqual(zeroBuffer!.offsetSeconds, 1080, 'zero buffer gives raw offset');

// Kill very early — streamer went live AFTER the match started
console.log('\nEdge case — streamer went live after match start:');

const lateStreamStart = '2026-03-28T20:16:00Z'; // 1 minute after match started
const earlyKill = 30 * 1000; // 30 seconds into match (20:15:30 UTC — before stream)
const earlyResult = calculateVodTimestamp(matchStartMillis, earlyKill, lateStreamStart, vodId);

assert(earlyResult !== null, 'returns result even when kill is before stream');
assertStrictEqual(earlyResult!.offsetSeconds, 0, 'clamps negative offset to 0');

// Kill right at stream start (edge)
console.log('\nEdge case — kill exactly at stream start:');

const exactResult = calculateVodTimestamp(
  vodCreatedAtMs, // match started exactly when stream started
  DEFAULT_SAFETY_BUFFER_MS, // kill at exactly the buffer time
  vodCreatedAt,
  vodId,
);
assert(exactResult !== null, 'returns result for edge timing');
assertStrictEqual(exactResult!.offsetSeconds, 0, 'buffer cancels out offset, clamps to 0');

// Invalid date string
console.log('\nEdge case — invalid date:');
let threwError = false;
try {
  calculateVodTimestamp(matchStartMillis, killGameTimeMillis, 'not-a-date', vodId);
} catch (e) {
  threwError = true;
}
assert(threwError, 'throws on invalid vodCreatedAt string');

// --- buildTwitchVodUrl ---

console.log('\nbuildTwitchVodUrl:');

assertStrictEqual(
  buildTwitchVodUrl('123', 0),
  'https://www.twitch.tv/videos/123?t=0h0m0s',
  'handles 0 seconds',
);

assertStrictEqual(
  buildTwitchVodUrl('123', 3661),
  'https://www.twitch.tv/videos/123?t=1h1m1s',
  'formats 1h1m1s correctly',
);

assertStrictEqual(
  buildTwitchVodUrl('123', 7200),
  'https://www.twitch.tv/videos/123?t=2h0m0s',
  'formats exact hours correctly',
);

assertStrictEqual(
  buildTwitchVodUrl('123', -5),
  'https://www.twitch.tv/videos/123?t=0h0m0s',
  'clamps negative offset to 0',
);

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
