/**
 * StreamReaper — Notification Service
 *
 * Coordinates sending encounter notifications via Discord webhooks and email.
 * Both channels are optional — users configure whichever they prefer.
 *
 * Usage:
 *   import { sendEncounterNotification } from '@/services/notificationService';
 *
 *   await sendEncounterNotification({
 *     encounterType: 'kill',
 *     streamerName: 'tarik',
 *     weapon: 'Vandal',
 *     mapName: 'Ascent',
 *     matchScore: '13-7',
 *     roundNumber: 18,
 *     encounterPageUrl: 'https://streamreaper.gg/encounter/abc123',
 *     discordWebhookUrl: 'https://discord.com/api/webhooks/...',
 *     email: 'user@example.com',
 *   });
 */

import {
  sendDiscordNotification,
  DiscordNotificationError,
  type EncounterType,
} from './discordNotifier';

import {
  sendEmailNotification,
  EmailNotificationError,
} from './emailNotifier';

// =============================================================================
// Types
// =============================================================================

export interface NotificationRequest {
  /** What happened */
  encounterType: EncounterType;
  /** Streamer's display name */
  streamerName: string;
  /** Streamer's average viewers */
  streamerViewers?: number;
  /** Weapon used */
  weapon?: string;
  /** Map name */
  mapName?: string;
  /** Match score */
  matchScore?: string;
  /** Round number */
  roundNumber?: number;
  /** Link to the encounter page on streamreaper.gg */
  encounterPageUrl: string;
  /** User's Discord webhook URL (optional — skip Discord if not provided) */
  discordWebhookUrl?: string | null;
  /** User's email address (optional — skip email if not provided) */
  email?: string | null;
  /** Whether user has Discord notifications enabled */
  discordEnabled?: boolean;
  /** Whether user has email notifications enabled */
  emailEnabled?: boolean;
}

export interface NotificationResult {
  discord: {
    sent: boolean;
    skipped: boolean;
    error?: string;
  };
  email: {
    sent: boolean;
    skipped: boolean;
    emailId?: string;
    error?: string;
  };
}

// =============================================================================
// Notification Dispatcher
// =============================================================================

/**
 * Send an encounter notification via all configured channels.
 *
 * Never throws — returns a result object indicating success/failure
 * for each channel. This prevents one channel's failure from blocking
 * the other.
 */
export async function sendEncounterNotification(
  request: NotificationRequest,
): Promise<NotificationResult> {
  const result: NotificationResult = {
    discord: { sent: false, skipped: true },
    email: { sent: false, skipped: true },
  };

  // Discord
  const shouldSendDiscord =
    request.discordWebhookUrl &&
    request.discordEnabled !== false;

  if (shouldSendDiscord) {
    result.discord.skipped = false;
    try {
      await sendDiscordNotification({
        webhookUrl: request.discordWebhookUrl!,
        encounterType: request.encounterType,
        streamerName: request.streamerName,
        streamerViewers: request.streamerViewers,
        weapon: request.weapon,
        mapName: request.mapName,
        matchScore: request.matchScore,
        roundNumber: request.roundNumber,
        encounterPageUrl: request.encounterPageUrl,
      });
      result.discord.sent = true;
    } catch (error) {
      result.discord.error =
        error instanceof DiscordNotificationError
          ? error.message
          : String(error);
    }
  }

  // Email
  const shouldSendEmail =
    request.email &&
    request.emailEnabled !== false &&
    process.env.RESEND_API_KEY; // Only attempt if Resend is configured

  if (shouldSendEmail) {
    result.email.skipped = false;
    try {
      const emailId = await sendEmailNotification({
        to: request.email!,
        encounterType: request.encounterType,
        streamerName: request.streamerName,
        streamerViewers: request.streamerViewers,
        weapon: request.weapon,
        mapName: request.mapName,
        matchScore: request.matchScore,
        roundNumber: request.roundNumber,
        encounterPageUrl: request.encounterPageUrl,
      });
      result.email.sent = true;
      result.email.emailId = emailId;
    } catch (error) {
      result.email.error =
        error instanceof EmailNotificationError
          ? error.message
          : String(error);
    }
  }

  return result;
}

// Re-export types for convenience
export type { EncounterType } from './discordNotifier';
