import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { testDiscordWebhook } from "@/services/discordNotifier";
import { NextRequest, NextResponse } from "next/server";

function isValidDiscordWebhookUrl(url: string): boolean {
  return url.startsWith("https://discord.com/api/webhooks/");
}

/**
 * GET /api/notification-preferences
 * Returns discord_webhook_url, discord_notifications, email_notifications.
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

    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        discordWebhookUrl: true,
        discordNotifications: true,
        emailNotifications: true,
      },
    });

    return NextResponse.json({
      discord_webhook_url: row?.discordWebhookUrl ?? null,
      discord_notifications: row?.discordNotifications ?? true,
      email_notifications: row?.emailNotifications ?? true,
    });
  } catch (error) {
    console.error("GET notification-preferences:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}

type PostBody = {
  test?: boolean;
  discord_webhook_url?: string | null;
  discord_notifications?: boolean;
  email_notifications?: boolean;
};

/**
 * POST /api/notification-preferences
 * - { test: true, discord_webhook_url?: string } — send test message to webhook URL (body or saved).
 * - Otherwise — upsert user and update preference fields.
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

    const body = (await request.json()) as PostBody;

    if (body.test === true) {
      let url =
        typeof body.discord_webhook_url === "string"
          ? body.discord_webhook_url.trim()
          : "";

      if (!url) {
        const row = await prisma.user.findUnique({
          where: { id: user.id },
          select: { discordWebhookUrl: true },
        });
        url = row?.discordWebhookUrl?.trim() ?? "";
      }

      if (!url) {
        return NextResponse.json(
          { success: false, error: "Enter a Discord webhook URL to test." },
          { status: 400 },
        );
      }

      if (!isValidDiscordWebhookUrl(url)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid webhook URL — must start with https://discord.com/api/webhooks/",
          },
          { status: 400 },
        );
      }

      const ok = await testDiscordWebhook(url);
      if (!ok) {
        return NextResponse.json({
          success: false,
          error:
            "Discord rejected the webhook. Check the URL and try again.",
        });
      }

      return NextResponse.json({ success: true });
    }

    const {
      discord_webhook_url,
      discord_notifications,
      email_notifications,
    } = body;

    const webhookNorm =
      discord_webhook_url === undefined
        ? undefined
        : discord_webhook_url === null
          ? null
          : typeof discord_webhook_url === "string"
            ? discord_webhook_url.trim() || null
            : undefined;

    if (
      webhookNorm !== undefined &&
      webhookNorm !== null &&
      !isValidDiscordWebhookUrl(webhookNorm)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid webhook URL — must start with https://discord.com/api/webhooks/",
        },
        { status: 400 },
      );
    }

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        discordId: user.user_metadata?.provider_id ?? null,
        discordUsername: user.user_metadata?.full_name ?? null,
        ...(webhookNorm !== undefined && {
          discordWebhookUrl: webhookNorm,
        }),
        ...(typeof discord_notifications === "boolean" && {
          discordNotifications: discord_notifications,
        }),
        ...(typeof email_notifications === "boolean" && {
          emailNotifications: email_notifications,
        }),
      },
      create: {
        id: user.id,
        email: user.email,
        discordId: user.user_metadata?.provider_id ?? null,
        discordUsername: user.user_metadata?.full_name ?? null,
        discordWebhookUrl: webhookNorm === undefined ? null : webhookNorm,
        discordNotifications: discord_notifications ?? true,
        emailNotifications: email_notifications ?? true,
      },
    });

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        discordWebhookUrl: true,
        discordNotifications: true,
        emailNotifications: true,
      },
    });

    return NextResponse.json({
      discord_webhook_url: updated?.discordWebhookUrl ?? null,
      discord_notifications: updated?.discordNotifications ?? true,
      email_notifications: updated?.emailNotifications ?? true,
    });
  } catch (error) {
    console.error("POST notification-preferences:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
