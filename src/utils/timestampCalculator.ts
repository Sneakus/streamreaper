/**
 * StreamReaper — VOD Timestamp Calculator
 *
 * Takes Riot match timing data and Twitch VOD metadata, calculates the
 * precise offset into the VOD where a kill event occurred, and returns
 * a deep link that drops the viewer ~30 seconds before the moment.
 *
 * Timestamp math:
 *   absoluteKillTime = matchStartMillis + killGameTimeMillis
 *   vodOffset        = absoluteKillTime - vodCreatedAtMillis
 *   bufferedOffset   = vodOffset - safetyBufferMs
 *
 * The 30-second buffer accounts for broadcast delay (2–15s) and lets the
 * viewer see the moment build up before the kill happens.
 */

/** Default safety buffer subtracted from the offset (milliseconds). */
export const DEFAULT_SAFETY_BUFFER_MS = 30_000;

export interface VodTimestampResult {
  /** Offset into the VOD in seconds (after safety buffer). */
  offsetSeconds: number;
  /** Formatted Twitch deep link: https://www.twitch.tv/videos/{id}?t=XhYmZs */
  vodUrl: string;
  /** Raw offset before the safety buffer was applied (seconds). */
  rawOffsetSeconds: number;
}

/**
 * Calculate the VOD timestamp for a kill event and return a deep link.
 *
 * @param matchStartMillis  - Absolute Unix epoch ms when the match started (from Riot `matchInfo.gameStartMillis`)
 * @param killGameTimeMillis - Ms elapsed from match start to the kill event (from Riot `KillEventDto.gameTime`)
 * @param vodCreatedAt       - VOD start time as ISO 8601 UTC string (from Twitch `video.created_at`)
 * @param vodId              - Twitch VOD ID (from Twitch `video.id`)
 * @param safetyBufferMs     - Buffer to subtract so the link lands before the kill (default 30s)
 * @returns VodTimestampResult with the offset and formatted URL, or null if the offset is negative (kill happened before the stream started)
 */
export function calculateVodTimestamp(
  matchStartMillis: number,
  killGameTimeMillis: number,
  vodCreatedAt: string,
  vodId: string,
  safetyBufferMs: number = DEFAULT_SAFETY_BUFFER_MS,
): VodTimestampResult | null {
  const vodCreatedAtMillis = new Date(vodCreatedAt).getTime();

  if (isNaN(vodCreatedAtMillis)) {
    throw new Error(`Invalid vodCreatedAt date string: "${vodCreatedAt}"`);
  }

  const absoluteKillTimeMs = matchStartMillis + killGameTimeMillis;
  const rawOffsetMs = absoluteKillTimeMs - vodCreatedAtMillis;
  const bufferedOffsetMs = rawOffsetMs - safetyBufferMs;

  // If the offset is negative, the kill happened before the VOD started
  // (e.g. streamer went live after the match began). Clamp to 0.
  const finalOffsetMs = Math.max(0, bufferedOffsetMs);
  const offsetSeconds = Math.floor(finalOffsetMs / 1000);
  const rawOffsetSeconds = Math.floor(rawOffsetMs / 1000);

  return {
    offsetSeconds,
    rawOffsetSeconds,
    vodUrl: buildTwitchVodUrl(vodId, offsetSeconds),
  };
}

/**
 * Build a Twitch VOD deep link with a timestamp parameter.
 *
 * Format: https://www.twitch.tv/videos/{vodId}?t={h}h{m}m{s}s
 *
 * @param vodId - Twitch VOD ID
 * @param offsetSeconds - Offset into the VOD in seconds
 */
export function buildTwitchVodUrl(vodId: string, offsetSeconds: number): string {
  const clamped = Math.max(0, Math.floor(offsetSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  return `https://www.twitch.tv/videos/${vodId}?t=${hours}h${minutes}m${seconds}s`;
}
