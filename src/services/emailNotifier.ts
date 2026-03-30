/**
 * StreamReaper — Email Notification Service
 *
 * Sends encounter notification emails via Resend (resend.com).
 * Free tier: 3,000 emails/month, 100 emails/day.
 *
 * Setup:
 *   1. Create a free account at resend.com
 *   2. Add and verify your domain (streamreaper.gg) or use the sandbox (onboarding@resend.dev)
 *   3. Generate an API key at resend.com/api-keys
 *   4. Add RESEND_API_KEY to .env.local
 *
 * Resend uses a simple REST API — no SDK needed for basic sending.
 */

import axios from 'axios';

// =============================================================================
// Types
// =============================================================================

export type EncounterType = 'kill' | 'death' | 'ace' | 'clutch' | 'flawless';

export interface EmailNotification {
  /** Recipient email address */
  to: string;
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
  /** Link to the encounter page */
  encounterPageUrl: string;
}

interface ResendResponse {
  id: string;
}

// =============================================================================
// Error Classes
// =============================================================================

export class EmailNotificationError extends Error {
  public status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'EmailNotificationError';
    this.status = status;
  }
}

// =============================================================================
// Config
// =============================================================================

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * From address — use verified domain in production, sandbox for testing.
 * Resend's sandbox domain (onboarding@resend.dev) works without domain verification
 * but can only send to the account owner's email.
 */
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'StreamReaper <notifications@streamreaper.gg>';

function getResendApiKey(): string {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new EmailNotificationError(
      'RESEND_API_KEY is missing. Set it in .env.local or your environment.'
    );
  }
  return key;
}

// =============================================================================
// Email Templates
// =============================================================================

const ENCOUNTER_EMOJI: Record<EncounterType, string> = {
  kill: '☠️',
  death: '💀',
  ace: '🏆',
  clutch: '⚡',
  flawless: '✨',
};

function buildSubject(notification: EmailNotification): string {
  const { encounterType, streamerName } = notification;
  const emoji = ENCOUNTER_EMOJI[encounterType];

  switch (encounterType) {
    case 'kill':
      return `${emoji} You killed ${streamerName}! Watch their reaction`;
    case 'death':
      return `${emoji} ${streamerName} killed you — see the moment`;
    case 'ace':
      return `${emoji} You aced with ${streamerName} in the game!`;
    case 'clutch':
      return `${emoji} Clutch against ${streamerName}! See the reaction`;
    case 'flawless':
      return `${emoji} Flawless round with ${streamerName}!`;
    default:
      return `${emoji} Streamer encounter: ${streamerName}`;
  }
}

function buildHtml(notification: EmailNotification): string {
  const {
    encounterType,
    streamerName,
    streamerViewers,
    weapon,
    mapName,
    matchScore,
    roundNumber,
    encounterPageUrl,
  } = notification;

  const encounterLabel = encounterType.charAt(0).toUpperCase() + encounterType.slice(1);

  // Build stats row
  const stats: string[] = [];
  if (mapName) stats.push(`<strong>Map:</strong> ${escapeHtml(mapName)}`);
  if (matchScore) stats.push(`<strong>Score:</strong> ${escapeHtml(matchScore)}`);
  if (roundNumber !== undefined) stats.push(`<strong>Round:</strong> ${roundNumber}`);
  if (weapon) stats.push(`<strong>Weapon:</strong> ${escapeHtml(formatWeapon(weapon))}`);

  const statsHtml = stats.length > 0
    ? `<p style="color: #9ca3af; font-size: 14px; margin: 16px 0;">${stats.join(' &nbsp;·&nbsp; ')}</p>`
    : '';

  const viewerText = streamerViewers && streamerViewers > 0
    ? `<p style="color: #9ca3af; font-size: 14px; margin: 8px 0;">${escapeHtml(streamerName)} streams to ~${streamerViewers.toLocaleString()} viewers</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 32px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">
        <span style="color: #e8e8ec;">STREAM</span><span style="color: #c23a2b;">REAPER</span>
      </span>
    </div>

    <!-- Card -->
    <div style="background-color: #12121a; border-radius: 12px; padding: 28px; border: 1px solid #1e1e2e;">

      <!-- Encounter type badge -->
      <div style="display: inline-block; background-color: ${getBadgeColour(encounterType)}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">
        ${ENCOUNTER_EMOJI[encounterType]} ${encounterLabel}
      </div>

      <!-- Main headline -->
      <h1 style="color: #e8e8ec; font-size: 22px; font-weight: bold; margin: 0 0 12px 0; line-height: 1.3;">
        ${buildHeadline(notification)}
      </h1>

      ${viewerText}
      ${statsHtml}

      <!-- CTA Button -->
      <div style="margin-top: 24px;">
        <a href="${escapeHtml(encounterPageUrl)}"
           style="display: inline-block; background-color: #c23a2b; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Watch their reaction →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px; color: #6b6b7b; font-size: 12px;">
      <p>StreamReaper — streamreaper.gg</p>
      <p style="margin-top: 8px;">
        <a href="https://streamreaper.gg/settings" style="color: #6b6b7b; text-decoration: underline;">Manage notification preferences</a>
      </p>
    </div>

  </div>
</body>
</html>`.trim();
}

function buildHeadline(notification: EmailNotification): string {
  const { encounterType, streamerName, weapon } = notification;

  switch (encounterType) {
    case 'kill':
      return weapon
        ? `You killed <span style="color: #c23a2b;">${escapeHtml(streamerName)}</span> with a ${escapeHtml(formatWeapon(weapon))}`
        : `You killed <span style="color: #c23a2b;">${escapeHtml(streamerName)}</span>`;
    case 'death':
      return weapon
        ? `<span style="color: #c23a2b;">${escapeHtml(streamerName)}</span> killed you with a ${escapeHtml(formatWeapon(weapon))}`
        : `<span style="color: #c23a2b;">${escapeHtml(streamerName)}</span> killed you`;
    case 'ace':
      return `You aced a round with <span style="color: #c23a2b;">${escapeHtml(streamerName)}</span> in the game`;
    case 'clutch':
      return `You clutched against <span style="color: #c23a2b;">${escapeHtml(streamerName)}</span>`;
    case 'flawless':
      return `Flawless round with <span style="color: #c23a2b;">${escapeHtml(streamerName)}</span> in the game`;
    default:
      return `Streamer encounter: <span style="color: #c23a2b;">${escapeHtml(streamerName)}</span>`;
  }
}

function getBadgeColour(encounterType: EncounterType): string {
  const colours: Record<EncounterType, string> = {
    kill: '#22c55e',
    death: '#ef4444',
    ace: '#f59e0b',
    clutch: '#8b5cf6',
    flawless: '#f59e0b',
  };
  return colours[encounterType];
}

function formatWeapon(weapon: string): string {
  if (!weapon.includes('-') && weapon.length < 30) {
    return weapon.charAt(0).toUpperCase() + weapon.slice(1).toLowerCase();
  }
  return weapon;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =============================================================================
// Email Sender
// =============================================================================

/**
 * Send an encounter notification email via Resend.
 *
 * @param notification - The encounter details to send
 * @returns The Resend email ID if sent successfully
 */
export async function sendEmailNotification(
  notification: EmailNotification,
): Promise<string> {
  const apiKey = getResendApiKey();

  const payload = {
    from: FROM_ADDRESS,
    to: [notification.to],
    subject: buildSubject(notification),
    html: buildHtml(notification),
  };

  try {
    const response = await axios.post<ResendResponse>(RESEND_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });

    return response.data.id;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data;
      const message = typeof body === 'object' && body?.message
        ? body.message
        : error.response.statusText;
      throw new EmailNotificationError(
        `Resend API failed: ${error.response.status} — ${message}`,
        error.response.status,
      );
    }
    throw new EmailNotificationError(
      `Resend API failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Send a test email to verify Resend is configured correctly.
 *
 * @param to - Recipient email
 * @returns The Resend email ID
 */
export async function sendTestEmail(to: string): Promise<string> {
  const apiKey = getResendApiKey();

  const payload = {
    from: FROM_ADDRESS,
    to: [to],
    subject: '✅ StreamReaper email notifications connected!',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 32px 20px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">
        <span style="color: #e8e8ec;">STREAM</span><span style="color: #c23a2b;">REAPER</span>
      </span>
    </div>
    <div style="background-color: #12121a; border-radius: 12px; padding: 28px; border: 1px solid #1e1e2e; text-align: center;">
      <h1 style="color: #22c55e; font-size: 22px; margin: 0 0 12px 0;">Email notifications connected!</h1>
      <p style="color: #9ca3af; font-size: 14px; margin: 0;">You'll receive notifications here whenever you encounter a streamer in Valorant.</p>
    </div>
    <div style="text-align: center; margin-top: 24px; color: #6b6b7b; font-size: 12px;">
      <p>StreamReaper — streamreaper.gg</p>
    </div>
  </div>
</body>
</html>`.trim(),
  };

  try {
    const response = await axios.post<ResendResponse>(RESEND_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    });

    return response.data.id;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      throw new EmailNotificationError(
        `Resend test email failed: ${error.response.status} ${error.response.statusText}`,
        error.response.status,
      );
    }
    throw new EmailNotificationError(
      `Resend test email failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
