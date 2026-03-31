"use client";

import { useCallback, useEffect, useState } from "react";

export default function NotificationPreferences() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [discordOn, setDiscordOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notification-preferences");
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to load preferences");
        return;
      }
      const data = (await res.json()) as {
        discord_webhook_url: string | null;
        discord_notifications: boolean;
        email_notifications: boolean;
      };
      setWebhookUrl(data.discord_webhook_url ?? "");
      setDiscordOn(data.discord_notifications);
      setEmailOn(data.email_notifications);
    } catch {
      setError("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discord_webhook_url: webhookUrl.trim() || null,
          discord_notifications: discordOn,
          email_notifications: emailOn,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setMessage("Preferences saved.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: true,
          discord_webhook_url: webhookUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Test failed");
        return;
      }
      if (data.success) {
        setMessage("Test message sent — check your Discord channel.");
      } else {
        setError(data.error ?? "Test failed");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#12121a] p-6">
      <h2 className="text-lg font-bold text-[#e8e8ec]">
        Notification preferences
      </h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        Choose how we notify you about streamer encounters. Discord uses your own
        webhook so messages go to your server.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-[#9ca3af]">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div>
            <label
              htmlFor="discord-webhook"
              className="block text-sm font-medium text-[#e8e8ec] mb-2"
            >
              Discord webhook URL
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <input
                id="discord-webhook"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
                className="min-w-0 flex-1 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-4 py-3 text-sm text-[#e8e8ec] placeholder-[#4a4a5a] focus:border-[#c23a2b] focus:outline-none transition-colors"
                disabled={saving || testing}
              />
              <button
                type="button"
                onClick={() => void handleTest()}
                disabled={testing || saving || !webhookUrl.trim()}
                className="shrink-0 rounded-lg border border-[#1e1e2e] px-4 py-3 text-sm font-medium text-[#9ca3af] transition-colors hover:border-[#2a2a3a] hover:text-[#e8e8ec] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {testing ? "Testing…" : "Test"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={discordOn}
                onChange={(e) => setDiscordOn(e.target.checked)}
                className="h-4 w-4 rounded border-[#2a2a3a] bg-[#0a0a0f] text-[#c23a2b] focus:ring-[#c23a2b] focus:ring-offset-0"
                disabled={saving || testing}
              />
              <span className="text-sm text-[#e8e8ec]">
                Discord notifications
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={emailOn}
                onChange={(e) => setEmailOn(e.target.checked)}
                className="h-4 w-4 rounded border-[#2a2a3a] bg-[#0a0a0f] text-[#c23a2b] focus:ring-[#c23a2b] focus:ring-offset-0"
                disabled={saving || testing}
              />
              <span className="text-sm text-[#e8e8ec]">
                Email notifications
              </span>
            </label>
          </div>

          {error ? (
            <p className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg px-4 py-3">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving || testing}
            className="rounded-lg bg-[#c23a2b] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a83225] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </form>
      )}
    </div>
  );
}
