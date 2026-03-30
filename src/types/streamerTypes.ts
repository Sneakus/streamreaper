/**
 * StreamReaper — Streamer Database Types
 *
 * Shared types for the streamer seed file, verification script,
 * and runtime streamer lookup.
 */

export interface StreamerRiotId {
  gameName: string;
  tagLine: string;
  /** Has this Riot ID been verified against the Riot API? */
  verified: boolean;
}

export interface StreamerPeripherals {
  mouse: string | null;
  keyboard: string | null;
  headset: string | null;
  monitor: string | null;
  /** Affiliate URLs for each peripheral (populated when affiliate accounts are approved) */
  affiliateUrls?: {
    mouse?: string;
    keyboard?: string;
    headset?: string;
    monitor?: string;
  };
}

export interface StreamerEntry {
  /** Twitch login username (lowercase) */
  twitchUsername: string;
  /** Display name shown to users */
  displayName: string;
  /** Primary Riot ID — may include team tag */
  riotId: StreamerRiotId;
  /** Other known Riot IDs (alts, old names) */
  alternateRiotIds?: Omit<StreamerRiotId, 'verified'>[];
  /** Valorant region shard */
  region: 'na' | 'eu' | 'ap' | 'kr';
  /** Twitch user ID (resolved via API, permanent) */
  twitchUserId: string | null;
  /** Riot PUUID (resolved via API, permanent — this is the key matching field) */
  puuid: string | null;
  /** Approximate average concurrent viewers */
  avgViewers: number;
  /** Twitch broadcaster type */
  broadcasterType: 'partner' | 'affiliate' | '';
  /** Known peripherals for Gear Check panel */
  peripherals: StreamerPeripherals | null;
}

export interface StreamerSeedFile {
  _meta: {
    description: string;
    lastUpdated: string;
    lastVerified?: string;
    [key: string]: unknown;
  };
  streamers: StreamerEntry[];
}

/**
 * Look up a streamer by PUUID in the database.
 * This is the primary lookup used during match processing.
 */
export function findStreamerByPuuid(
  streamers: StreamerEntry[],
  puuid: string,
): StreamerEntry | undefined {
  return streamers.find((s) => s.puuid === puuid);
}

/**
 * Look up a streamer by Twitch username.
 */
export function findStreamerByTwitchUsername(
  streamers: StreamerEntry[],
  twitchUsername: string,
): StreamerEntry | undefined {
  return streamers.find(
    (s) => s.twitchUsername.toLowerCase() === twitchUsername.toLowerCase(),
  );
}

/**
 * Get all verified streamers (have both PUUID and Twitch user ID).
 * Only these streamers can participate in the full pipeline.
 */
export function getVerifiedStreamers(
  streamers: StreamerEntry[],
): StreamerEntry[] {
  return streamers.filter((s) => s.puuid !== null && s.twitchUserId !== null);
}

/**
 * Build a PUUID → StreamerEntry lookup map for fast matching during
 * match processing. Only includes verified streamers.
 */
export function buildPuuidLookup(
  streamers: StreamerEntry[],
): Map<string, StreamerEntry> {
  const map = new Map<string, StreamerEntry>();
  for (const s of getVerifiedStreamers(streamers)) {
    if (s.puuid) {
      map.set(s.puuid, s);
    }
  }
  return map;
}
