import { config } from "dotenv";
import { resolve } from "path";

import {
  collectKillEventsFromMatch,
  getMatchDetails,
  getMatchList,
  getPlayerByRiotId,
  RiotApiError,
  RiotApiHttpError,
  type ValorantMatchShard,
} from "../services/riotApi";

config({ path: resolve(process.cwd(), ".env.local") });

const GAME_NAME = "StreamReaperGG";
const TAG_LINE = "4070";
const MATCH_LIMIT = 5;
const VALORANT_SHARD: ValorantMatchShard = "eu";

async function main(): Promise<void> {
  console.log(
    `Looking up ${GAME_NAME}#${TAG_LINE} and fetching last ${MATCH_LIMIT} matches (Valorant shard: ${VALORANT_SHARD})…\n`,
  );

  const account = await getPlayerByRiotId(GAME_NAME, TAG_LINE);
  console.log("Account:", {
    puuid: account.puuid,
    gameName: account.gameName,
    tagLine: account.tagLine,
  });

  const matchlist = await getMatchList(account.puuid, VALORANT_SHARD);
  const recent = (matchlist.history ?? []).slice(0, MATCH_LIMIT);

  if (recent.length === 0) {
    console.log("No matches in history.");
    return;
  }

  for (let i = 0; i < recent.length; i++) {
    const entry = recent[i];
    console.log(
      `\n--- Match ${i + 1}/${recent.length}: ${entry.matchId} (queue: ${entry.queueId ?? "?"}) ---`,
    );

    const details = await getMatchDetails(entry.matchId, VALORANT_SHARD);
    const kills = collectKillEventsFromMatch(details);

    console.log(
      `Map: ${details.matchInfo.mapId} | Rounds: ${details.roundResults?.length ?? "?"} | Kill events: ${kills.length}`,
    );

    if (kills.length === 0) {
      console.log("(no kill events in payload)");
      continue;
    }

    for (const k of kills) {
      const round =
        "round" in k && typeof k.round === "number" ? k.round : "?";
      console.log({
        round,
        gameTimeMs: k.gameTime,
        roundTimeMs: k.roundTime,
        killer: k.killer,
        victim: k.victim,
        finishingDamage: k.finishingDamage,
        assistants: k.assistants,
      });
    }
  }
}

main().catch((err: unknown) => {
  if (err instanceof RiotApiHttpError) {
    console.error(err.name, err.message);
    console.error("HTTP status:", err.status);
    console.error("Body:", err.riotBody);
  } else if (err instanceof RiotApiError) {
    console.error(err.name, err.message);
  } else {
    console.error(err);
  }
  process.exitCode = 1;
});
