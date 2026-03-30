import axios, { AxiosInstance } from 'axios';

// =============================================================================
// Types
// =============================================================================

/** Twitch app access token response */
interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: 'bearer';
}

/** Twitch user object from GET /helix/users */
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: 'partner' | 'affiliate' | '';
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  created_at: string;
}

/** Twitch VOD object from GET /helix/videos */
export interface TwitchVod {
  id: string;
  stream_id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  title: string;
  description: string;
  created_at: string; // RFC 3339 UTC — this is the stream start time
  published_at: string;
  url: string;
  thumbnail_url: string;
  viewable: string;
  view_count: number;
  language: string;
  type: 'archive' | 'highlight' | 'upload';
  duration: string; // e.g. "3h21m45s"
}

/** Twitch stream object from GET /helix/streams */
export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: 'live' | '';
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  is_mature: boolean;
}

/** Paginated response wrapper */
interface TwitchPaginatedResponse<T> {
  data: T[];
  pagination?: {
    cursor?: string;
  };
}

// =============================================================================
// Error Classes
// =============================================================================

export class TwitchApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TwitchApiConfigError';
  }
}

export class TwitchApiHttpError extends Error {
  public status: number;
  public statusText: string;

  constructor(status: number, statusText: string, message?: string) {
    super(message || `Twitch API HTTP error: ${status} ${statusText}`);
    this.name = 'TwitchApiHttpError';
    this.status = status;
    this.statusText = statusText;
  }
}

export class TwitchApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TwitchApiError';
  }
}

// =============================================================================
// Twitch API Service
// =============================================================================

// Valorant game ID on Twitch
export const VALORANT_GAME_ID = '516575';

// Token cache — avoids re-authenticating on every call
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Authenticate with Twitch using Client Credentials flow.
 * Returns an app access token. Caches the token until it expires.
 *
 * Docs: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow
 */
export async function authenticate(): Promise<string> {
  // Return cached token if still valid (with 60-second buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new TwitchApiConfigError(
      'Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in environment variables'
    );
  }

  try {
    const response = await axios.post<TokenResponse>(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    return cachedToken;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new TwitchApiHttpError(
        error.response.status,
        error.response.statusText,
        `Twitch authentication failed: ${error.response.status} ${error.response.statusText}`
      );
    }
    throw new TwitchApiError(
      `Twitch authentication failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create an authenticated axios instance for Twitch Helix API calls.
 */
async function getClient(): Promise<AxiosInstance> {
  const token = await authenticate();
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!clientId) {
    throw new TwitchApiConfigError('Missing TWITCH_CLIENT_ID in environment variables');
  }

  return axios.create({
    baseURL: 'https://api.twitch.tv/helix',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId,
    },
  });
}

/**
 * Get a Twitch user by their login username.
 *
 * @param login - Twitch username (e.g. "tenz", "shroud")
 * @returns TwitchUser object or null if not found
 */
export async function getUserByLogin(login: string): Promise<TwitchUser | null> {
  const client = await getClient();

  try {
    const response = await client.get<TwitchPaginatedResponse<TwitchUser>>('/users', {
      params: { login },
    });

    return response.data.data[0] || null;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new TwitchApiHttpError(
        error.response.status,
        error.response.statusText,
        `Failed to fetch user "${login}": ${error.response.status} ${error.response.statusText}`
      );
    }
    throw new TwitchApiError(
      `Failed to fetch user "${login}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get a Twitch user by their user ID.
 *
 * @param userId - Twitch user ID
 * @returns TwitchUser object or null if not found
 */
export async function getUserById(userId: string): Promise<TwitchUser | null> {
  const client = await getClient();

  try {
    const response = await client.get<TwitchPaginatedResponse<TwitchUser>>('/users', {
      params: { id: userId },
    });

    return response.data.data[0] || null;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new TwitchApiHttpError(
        error.response.status,
        error.response.statusText,
        `Failed to fetch user ID "${userId}": ${error.response.status} ${error.response.statusText}`
      );
    }
    throw new TwitchApiError(
      `Failed to fetch user ID "${userId}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch VODs (archived broadcasts) for a Twitch user.
 *
 * Returns most recent VODs first. Use this to find the VOD that overlaps
 * with a Valorant match time window.
 *
 * VOD retention: 14 days (Affiliates), 60 days (Partners).
 *
 * @param userId - Twitch user ID (not username — get this from getUserByLogin first)
 * @param limit - Number of VODs to fetch (default 20, max 100)
 * @returns Array of TwitchVod objects
 */
export async function getVodsByUserId(
  userId: string,
  limit: number = 20
): Promise<TwitchVod[]> {
  const client = await getClient();

  try {
    const response = await client.get<TwitchPaginatedResponse<TwitchVod>>('/videos', {
      params: {
        user_id: userId,
        type: 'archive', // Only past broadcasts, not highlights or uploads
        first: Math.min(limit, 100),
      },
    });

    return response.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new TwitchApiHttpError(
        error.response.status,
        error.response.statusText,
        `Failed to fetch VODs for user "${userId}": ${error.response.status} ${error.response.statusText}`
      );
    }
    throw new TwitchApiError(
      `Failed to fetch VODs for user "${userId}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Find the VOD that was live during a specific point in time.
 *
 * Compares the match timestamp against each VOD's start time and duration
 * to find the one that contains the moment.
 *
 * @param userId - Twitch user ID
 * @param timestampMs - Unix epoch timestamp in milliseconds (e.g. matchStartMillis)
 * @returns The matching VOD, or null if no VOD covers that time
 */
export async function findVodAtTime(
  userId: string,
  timestampMs: number
): Promise<TwitchVod | null> {
  const vods = await getVodsByUserId(userId);

  for (const vod of vods) {
    const vodStartMs = new Date(vod.created_at).getTime();
    const vodDurationMs = parseTwitchDuration(vod.duration);
    const vodEndMs = vodStartMs + vodDurationMs;

    // Check if the timestamp falls within this VOD's time window
    if (timestampMs >= vodStartMs && timestampMs <= vodEndMs) {
      return vod;
    }
  }

  return null;
}

/**
 * Search for live Valorant streams on Twitch.
 *
 * Useful for identifying currently-live streamers whose matches
 * should be prioritised for scanning.
 *
 * @param limit - Number of streams to fetch (default 20, max 100)
 * @param cursor - Pagination cursor for fetching more results
 * @returns Object with streams array and optional pagination cursor
 */
export async function getLiveValorantStreams(
  limit: number = 20,
  cursor?: string
): Promise<{ streams: TwitchStream[]; cursor?: string }> {
  const client = await getClient();

  try {
    const params: Record<string, string | number> = {
      game_id: VALORANT_GAME_ID,
      first: Math.min(limit, 100),
    };

    if (cursor) {
      params.after = cursor;
    }

    const response = await client.get<TwitchPaginatedResponse<TwitchStream>>('/streams', {
      params,
    });

    return {
      streams: response.data.data,
      cursor: response.data.pagination?.cursor,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new TwitchApiHttpError(
        error.response.status,
        error.response.statusText,
        `Failed to fetch Valorant streams: ${error.response.status} ${error.response.statusText}`
      );
    }
    throw new TwitchApiError(
      `Failed to fetch Valorant streams: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Parse a Twitch duration string (e.g. "3h21m45s") into milliseconds.
 *
 * Twitch VOD durations use the format: "XhYmZs"
 * Some may omit hours or minutes (e.g. "45m12s" or "30s").
 */
export function parseTwitchDuration(duration: string): number {
  const hours = duration.match(/(\d+)h/);
  const minutes = duration.match(/(\d+)m/);
  const seconds = duration.match(/(\d+)s/);

  const h = hours ? parseInt(hours[1], 10) : 0;
  const m = minutes ? parseInt(minutes[1], 10) : 0;
  const s = seconds ? parseInt(seconds[1], 10) : 0;

  return (h * 3600 + m * 60 + s) * 1000;
}
