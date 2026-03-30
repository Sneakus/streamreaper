import axios, { isAxiosError, type AxiosRequestConfig } from "axios";

/** Account routing (Riot ID → PUUID). */
export const RIOT_ACCOUNT_EUROPE_BASE =
  "https://europe.api.riotgames.com" as const;

/** Valorant match-v1 regional shards (routing host subdomain). */
export const VALORANT_MATCH_SHARDS = ["na", "eu", "ap", "kr"] as const;

export type ValorantMatchShard = (typeof VALORANT_MATCH_SHARDS)[number];

/**
 * Base URL for Valorant match endpoints: `https://{shard}.api.riotgames.com`.
 * @param shard Regional shard (`na`, `eu`, `ap`, `kr`). Defaults to `na`.
 */
export function valorantMatchApiBaseUrl(
  shard: ValorantMatchShard = "na",
): string {
  return `https://${shard}.api.riotgames.com`;
}

export class RiotApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export class RiotApiConfigError extends RiotApiError {
  constructor(message: string) {
    super(message);
    this.name = "RiotApiConfigError";
  }
}

export class RiotApiHttpError extends RiotApiError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly riotBody: unknown,
  ) {
    super(message);
    this.name = "RiotApiHttpError";
  }
}

function getRiotApiKey(): string {
  const key = process.env.RIOT_API_KEY?.trim();
  if (!key) {
    throw new RiotApiConfigError(
      "RIOT_API_KEY is missing. Set it in .env.local or your environment.",
    );
  }
  return key;
}

function riotHeaders(): Record<string, string> {
  return { "X-Riot-Token": getRiotApiKey() };
}

function messageFromRiotErrorBody(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const root = data as Record<string, unknown>;
  if (typeof root.message === "string") return root.message;
  const status = root.status;
  if (
    typeof status === "object" &&
    status !== null &&
    typeof (status as Record<string, unknown>).message === "string"
  ) {
    return (status as { message: string }).message;
  }
  return undefined;
}

async function riotRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await axios.request<T>({
      ...config,
      headers: {
        ...riotHeaders(),
        ...config.headers,
      },
    });
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status ?? 0;
      const data = err.response?.data;
      const riotMessage =
        messageFromRiotErrorBody(data) ?? err.message;
      throw new RiotApiHttpError(
        `Riot API request failed (${status || "network"}): ${riotMessage}`,
        status,
        data,
      );
    }
    throw new RiotApiError("Unexpected error calling Riot API", err);
  }
}

/** GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine} */
export interface RiotAccountByRiotId {
  puuid: string;
  gameName: string;
  tagLine: string;
}

/** GET /val/match/v1/matchlists/by-puuid/{puuid} */
export interface ValorantMatchlistEntry {
  matchId: string;
  /** Milliseconds since epoch when the match started. */
  gameStartTimeMillis?: number;
  queueId?: string;
}

export interface ValorantMatchlistResponse {
  puuid: string;
  history?: ValorantMatchlistEntry[];
}

export interface FinishingDamageDto {
  damageType: string;
  damageItem: string;
  isSecondaryFireMode: boolean;
}

export interface KillEventDto {
  gameTime: number;
  roundTime: number;
  killer: string;
  victim: string;
  victimLocation: { x: number; y: number };
  assistants: string[];
  playerLocations: Array<{
    subject: string;
    viewRadians: number;
    location: { x: number; y: number };
  }>;
  finishingDamage: FinishingDamageDto;
  /** Present on top-level `kills` in match details. */
  round?: number;
}

export interface PlayerRoundStatsDto {
  subject: string;
  kills: KillEventDto[];
  damage: Array<{
    receiver: string;
    damage: number;
    legshots: number;
    bodyshots: number;
    headshots: number;
  }>;
  score: number;
  economy: {
    loadoutValue: number;
    weapon: string;
    armor: string;
    remaining: number;
    spent: number;
  };
  ability: Record<string, unknown>;
  wasAfk: boolean;
  wasPenalized: boolean;
  stayedInSpawn: boolean;
}

export interface RoundResultDto {
  roundNum: number;
  roundResult: string;
  roundCeremony: string;
  winningTeam: string;
  playerStats: PlayerRoundStatsDto[];
  [key: string]: unknown;
}

export interface MatchPlayerDto {
  /** Player id in match payloads (Riot often uses `puuid` or `subject`). */
  puuid?: string;
  subject?: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  characterId: string;
  stats: {
    score: number;
    roundsPlayed: number;
    kills: number;
    deaths: number;
    assists: number;
    playtimeMillis: number;
  } | null;
  [key: string]: unknown;
}

export interface ValorantMatchDetails {
  matchInfo: {
    matchId: string;
    mapId: string;
    gameLengthMillis: number | null;
    gameStartMillis: number;
    provisioningFlowId?: string;
    queueId?: string;
    [key: string]: unknown;
  };
  players: MatchPlayerDto[];
  teams: Array<{
    teamId: string;
    won: boolean;
    roundsPlayed: number;
    roundsWon: number;
    numPoints: number;
  }> | null;
  roundResults: RoundResultDto[] | null;
  /** Per-kill feed for the whole match (when provided by the API). */
  kills: Array<KillEventDto & { round: number }> | null;
  coaches?: unknown[];
  [key: string]: unknown;
}

/**
 * Resolves a Riot ID to account info including PUUID (Europe account routing).
 */
export async function getPlayerByRiotId(
  gameName: string,
  tagLine: string,
): Promise<RiotAccountByRiotId> {
  const encodedGame = encodeURIComponent(gameName);
  const encodedTag = encodeURIComponent(tagLine);
  const url = `${RIOT_ACCOUNT_EUROPE_BASE}/riot/account/v1/accounts/by-riot-id/${encodedGame}/${encodedTag}`;
  return riotRequest<RiotAccountByRiotId>({ method: "GET", url });
}

/**
 * Recent Valorant matches for a PUUID on the given regional shard.
 * @param shard Match routing shard (`na`, `eu`, `ap`, `kr`). Defaults to `na`.
 */
export async function getMatchList(
  puuid: string,
  shard: ValorantMatchShard = "na",
): Promise<ValorantMatchlistResponse> {
  const encodedPuuid = encodeURIComponent(puuid);
  const base = valorantMatchApiBaseUrl(shard);
  const url = `${base}/val/match/v1/matchlists/by-puuid/${encodedPuuid}`;
  return riotRequest<ValorantMatchlistResponse>({ method: "GET", url });
}

/**
 * Full Valorant match payload: rounds, player stats, kill events.
 * @param shard Match routing shard (`na`, `eu`, `ap`, `kr`). Defaults to `na`.
 */
export async function getMatchDetails(
  matchId: string,
  shard: ValorantMatchShard = "na",
): Promise<ValorantMatchDetails> {
  const encodedId = encodeURIComponent(matchId);
  const base = valorantMatchApiBaseUrl(shard);
  const url = `${base}/val/match/v1/matches/${encodedId}`;
  return riotRequest<ValorantMatchDetails>({ method: "GET", url });
}

/**
 * All kill events from a match: prefers top-level `kills`, otherwise flattens
 * `roundResults[].playerStats[].kills` (round inferred from round number).
 */
export function collectKillEventsFromMatch(
  match: ValorantMatchDetails,
): KillEventDto[] {
  if (match.kills && match.kills.length > 0) {
    return match.kills;
  }
  const out: KillEventDto[] = [];
  const rounds = match.roundResults ?? [];
  for (const round of rounds) {
    const roundNum = round.roundNum;
    for (const ps of round.playerStats ?? []) {
      for (const k of ps.kills ?? []) {
        out.push({ ...k, round: roundNum });
      }
    }
  }
  return out;
}
