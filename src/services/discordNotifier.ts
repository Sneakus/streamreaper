import axios from 'axios';

// =============================================================================
// Types
// =============================================================================

export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  url?: string;
  thumbnail?: {
    url: string;
  };
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

export type EncounterType = 'kill' | 'death' | 'ace' | 'clutch' | 'flawless';

export interface EncounterNotification {
  /** User's Discord webhook URL */
  webhookUrl: string;
  /** What happened */
  encounterType: EncounterType;
  /** Streamer's display name */
  streamerName: string;
  /** Streamer's average viewers (for context) */
  streamerViewers?: number;
  /** Weapon used (from finishingDamage.damageItem) */
  weapon?: string;
  /** Map name */
  mapName?: string;
  /** Match score (e.g. "13-7") */
  matchScore?: string;
  /** Round number */
  roundNumber?: number;
  /** Link to the encounter page on streamreaper.gg */
  encounterPageUrl: string;
}

// =============================================================================
// Error Classes
// =============================================================================

export class DiscordNotificationError extends Error {
  public status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DiscordNotificationError';
    this.status = status;
  }
}

// =============================================================================
// Colour Constants
// =============================================================================

/** Embed colours by encounter type (decimal, not hex) */
const EMBED_COLOURS: Record<EncounterType, number> = {
  kill: 0x22c55e,    // Green — you killed them
  death: 0xef4444,   // Red — they killed you
  ace: 0xf59e0b,     // Gold — ace round
  clutch: 0x8b5cf6,  // Purple — clutch round
  flawless: 0xf59e0b, // Gold — flawless round
};

/** Emoji by encounter type */
const ENCOUNTER_EMOJI: Record<EncounterType, string> = {
  kill: '☠️',
  death: '💀',
  ace: '🏆',
  clutch: '⚡',
  flawless: '✨',
};

// =============================================================================
// Title Builders
// =============================================================================

function buildTitle(notification: EncounterNotification): string {
  const { encounterType, streamerName, weapon } = notification;
  const emoji = ENCOUNTER_EMOJI[encounterType];

  switch (encounterType) {
    case 'kill':
      return weapon
        ? `${emoji} You killed ${streamerName} with a ${formatWeapon(weapon)}!`
        : `${emoji} You killed ${streamerName}!`;
    case 'death':
      return weapon
        ? `${emoji} ${streamerName} killed you with a ${formatWeapon(weapon)}`
        : `${emoji} ${streamerName} killed you`;
    case 'ace':
      return `${emoji} You aced a round with ${streamerName} in the game!`;
    case 'clutch':
      return `${emoji} You clutched a round against ${streamerName}!`;
    case 'flawless':
      return `${emoji} Flawless round in a game with ${streamerName}!`;
    default:
      return `${emoji} Streamer encounter: ${streamerName}`;
  }
}

function buildDescription(notification: EncounterNotification): string {
  const parts: string[] = [];

  if (notification.streamerViewers && notification.streamerViewers > 0) {
    parts.push(
      `**${notification.streamerName}** streams to ~${notification.streamerViewers.toLocaleString()} viewers`
    );
  }

  parts.push('Watch their reaction on StreamReaper →');

  return parts.join('\n');
}

/**
 * Format a weapon ID into a readable name.
 * Riot API returns weapon IDs like "29A0CFAB-...", but match data also
 * includes damageItem strings like "Vandal", "Phantom", etc.
 * This handles both.
 */
function formatWeapon(weapon: string): string {
  // If it looks like a readable name already, just capitalise it
  if (!weapon.includes('-') && weapon.length < 30) {
    return weapon.charAt(0).toUpperCase() + weapon.slice(1).toLowerCase();
  }
  // Otherwise return as-is (UUID — would need a lookup table later)
  return weapon;
}

// =============================================================================
// Discord Webhook Sender
// =============================================================================

/**
 * Send an encounter notification to a user's Discord webhook.
 *
 * @param notification - The encounter details to send
 * @returns true if sent successfully, false otherwise
 */
export async function sendDiscordNotification(
  notification: EncounterNotification,
): Promise<boolean> {
  const { webhookUrl, encounterType } = notification;

  if (!webhookUrl) {
    throw new DiscordNotificationError('No webhook URL provided');
  }

  // Basic webhook URL validation
  if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    throw new DiscordNotificationError(
      'Invalid Discord webhook URL — must start with https://discord.com/api/webhooks/'
    );
  }

  const fields: Array<{ name: string; value: string; inline: boolean }> = [];

  if (notification.mapName) {
    fields.push({ name: 'Map', value: notification.mapName, inline: true });
  }
  if (notification.matchScore) {
    fields.push({ name: 'Score', value: notification.matchScore, inline: true });
  }
  if (notification.roundNumber !== undefined) {
    fields.push({
      name: 'Round',
      value: notification.roundNumber.toString(),
      inline: true,
    });
  }
  if (notification.weapon) {
    fields.push({
      name: 'Weapon',
      value: formatWeapon(notification.weapon),
      inline: true,
    });
  }

  const embed: DiscordEmbed = {
    title: buildTitle(notification),
    description: buildDescription(notification),
    color: EMBED_COLOURS[encounterType],
    fields: fields.length > 0 ? fields : undefined,
    footer: {
      text: 'StreamReaper — streamreaper.gg',
    },
    timestamp: new Date().toISOString(),
    url: notification.encounterPageUrl,
  };

  const payload: DiscordWebhookPayload = {
    username: 'StreamReaper',
    embeds: [embed],
  };

  try {
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10_000,
    });
    return true;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new DiscordNotificationError(
        `Discord webhook failed: ${error.response.status} ${error.response.statusText}`,
        error.response.status,
      );
    }
    throw new DiscordNotificationError(
      `Discord webhook failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Validate a Discord webhook URL by sending a test message.
 * Used during onboarding when a user provides their webhook URL.
 *
 * @param webhookUrl - The webhook URL to test
 * @returns true if valid and working
 */
export async function testDiscordWebhook(webhookUrl: string): Promise<boolean> {
  const payload: DiscordWebhookPayload = {
    username: 'StreamReaper',
    embeds: [
      {
        title: '✅ StreamReaper Connected!',
        description:
          "You'll receive notifications here whenever you encounter a streamer in Valorant.",
        color: 0x22c55e,
        footer: {
          text: 'StreamReaper — streamreaper.gg',
        },
      },
    ],
  };

  try {
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10_000,
    });
    return true;
  } catch {
    return false;
  }
}
