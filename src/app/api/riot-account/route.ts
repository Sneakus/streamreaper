import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getPlayerByRiotId } from "@/services/riotApi";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/riot-account
 *
 * Links a Riot account to the authenticated user.
 * Validates the Riot ID via the Riot API, then stores the PUUID.
 *
 * Body: { "riotId": "GameName#TagLine", "region": "na" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { riotId, region = "na" } = body;

    if (!riotId || typeof riotId !== "string") {
      return NextResponse.json(
        { error: "Riot ID is required (e.g. PlayerName#TAG)" },
        { status: 400 },
      );
    }

    const lastHash = riotId.lastIndexOf("#");
    if (lastHash === -1 || lastHash === 0 || lastHash === riotId.length - 1) {
      return NextResponse.json(
        {
          error:
            "Invalid format — use GameName#TagLine (e.g. PlayerName#1234)",
        },
        { status: 400 },
      );
    }

    const gameName = riotId.substring(0, lastHash).trim();
    const tagLine = riotId.substring(lastHash + 1).trim();

    if (!gameName || !tagLine) {
      return NextResponse.json(
        { error: "Both game name and tag line are required" },
        { status: 400 },
      );
    }

    let riotAccount;
    try {
      riotAccount = await getPlayerByRiotId(gameName, tagLine);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      if (
        message.includes("404") ||
        message.includes("not found") ||
        message.includes("No results")
      ) {
        return NextResponse.json(
          {
            error: `Riot account not found: ${gameName}#${tagLine}. Check spelling and try again.`,
          },
          { status: 404 },
        );
      }

      console.error("Riot API error:", message);
      return NextResponse.json(
        { error: "Failed to verify Riot account. Please try again later." },
        { status: 502 },
      );
    }

    const existingLink = await prisma.riotAccount.findUnique({
      where: { puuid: riotAccount.puuid },
    });

    if (existingLink && existingLink.userId !== user.id) {
      return NextResponse.json(
        {
          error:
            "This Riot account is already linked to another StreamReaper user.",
        },
        { status: 409 },
      );
    }

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        discordId: user.user_metadata?.provider_id ?? null,
        discordUsername: user.user_metadata?.full_name ?? null,
      },
      create: {
        id: user.id,
        email: user.email,
        discordId: user.user_metadata?.provider_id ?? null,
        discordUsername: user.user_metadata?.full_name ?? null,
      },
    });

    const linked = await prisma.riotAccount.upsert({
      where: { puuid: riotAccount.puuid },
      update: {
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        region,
      },
      create: {
        userId: user.id,
        puuid: riotAccount.puuid,
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        region,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        gameName: linked.gameName,
        tagLine: linked.tagLine,
        region: linked.region,
        puuid: linked.puuid,
      },
    });
  } catch (error) {
    console.error("Link Riot account error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/riot-account
 *
 * Returns the authenticated user's linked Riot accounts.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accounts = await prisma.riotAccount.findMany({
      where: { userId: user.id },
      select: {
        gameName: true,
        tagLine: true,
        region: true,
        puuid: true,
        linkedAt: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Get Riot accounts error:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
