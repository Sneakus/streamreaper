'use client';

import { useState, useEffect } from 'react';

interface LinkedAccount {
  gameName: string;
  tagLine: string;
  region: string;
  puuid: string;
  linkedAt?: string;
}

export default function LinkRiotAccount() {
  const [riotId, setRiotId] = useState('');
  const [region, setRegion] = useState('na');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [fetchingAccounts, setFetchingAccounts] = useState(true);

  // Fetch existing linked accounts on mount
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/riot-account');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts || []);
        }
      } catch {
        // Silently fail — user just won't see existing accounts
      } finally {
        setFetchingAccounts(false);
      }
    }
    fetchAccounts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/riot-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotId, region }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to link account');
        return;
      }

      // Add the new account to the list
      setAccounts((prev) => [
        ...prev.filter((a) => a.puuid !== data.account.puuid),
        data.account,
      ]);
      setRiotId('');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Linked accounts */}
      {!fetchingAccounts && accounts.length > 0 && (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6">
          <h3 className="text-base font-bold text-[#e8e8ec] mb-4">
            Linked Riot Account{accounts.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.puuid}
                className="flex items-center justify-between bg-[#0a0a0f] rounded-lg p-4"
              >
                <div>
                  <span className="text-[#e8e8ec] font-semibold">
                    {account.gameName}
                  </span>
                  <span className="text-[#6b6b7b]">#{account.tagLine}</span>
                  <span className="text-xs text-[#6b6b7b] ml-3 uppercase">
                    {account.region}
                  </span>
                </div>
                <span className="text-xs text-[#22c55e]">✓ Linked</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link form */}
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6">
        <h3 className="text-base font-bold text-[#e8e8ec] mb-2">
          {accounts.length > 0
            ? 'Link another Riot account'
            : 'Link your Riot account'}
        </h3>
        <p className="text-sm text-[#9ca3af] mb-5">
          Enter your Valorant Riot ID so we can scan your matches for streamer
          encounters.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Riot ID input */}
            <div className="flex-1">
              <input
                type="text"
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                placeholder="GameName#TagLine"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-4 py-3 text-[#e8e8ec] placeholder-[#4a4a5a] focus:border-[#c23a2b] focus:outline-none transition-colors text-sm"
                disabled={loading}
                required
              />
            </div>

            {/* Region select */}
            <div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full sm:w-auto bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-4 py-3 text-[#e8e8ec] focus:border-[#c23a2b] focus:outline-none transition-colors text-sm appearance-none cursor-pointer"
                disabled={loading}
              >
                <option value="na">NA</option>
                <option value="eu">EU</option>
                <option value="ap">AP</option>
                <option value="kr">KR</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !riotId.includes('#')}
              className="px-6 py-3 bg-[#c23a2b] hover:bg-[#a83225] disabled:bg-[#4a4a5a] disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              {loading ? 'Verifying...' : 'Link account'}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Help text */}
          <p className="text-xs text-[#6b6b7b]">
            Your Riot ID is visible in the Valorant client. It looks like{' '}
            <span className="text-[#9ca3af]">PlayerName#1234</span>. We only
            access your post-match data — nothing else.
          </p>
        </form>
      </div>
    </div>
  );
}
