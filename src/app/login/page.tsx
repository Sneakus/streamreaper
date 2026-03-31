"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function signInWithDiscord() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      console.error(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e8e8ec] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-xl border border-[#1e1e2e] bg-[#12121a] p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-lg font-bold tracking-[0.15em] select-none"
          >
            <span className="text-[#e8e8ec]">STREAM</span>
            <span className="text-[#c23a2b]">REAPER</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Connect with Discord to link your account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void signInWithDiscord()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4] disabled:opacity-60"
        >
          <svg
            width="20"
            height="15"
            viewBox="0 0 71 55"
            fill="currentColor"
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M60.1 4.6A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.3 37.3 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.6a.2.2 0 00-.1.1C1.5 18 -.9 31 .3 43.8v.2a58.9 58.9 0 0017.7 9a.2.2 0 00.3-.1 42.1 42.1 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.7.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.3 47.3 0 003.6 5.9.2.2 0 00.3.1A58.7 58.7 0 0070.3 44v-.2c1.4-14.8-2.4-27.7-10.1-39.1a.2.2 0 00-.1-.1zM23.7 36c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.7 7-6.2 7z" />
          </svg>
          {loading ? "Redirecting…" : "Sign in with Discord"}
        </button>

        <p className="mt-6 text-center text-xs text-[#9ca3af]">
          <Link href="/" className="text-[#c23a2b] hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
