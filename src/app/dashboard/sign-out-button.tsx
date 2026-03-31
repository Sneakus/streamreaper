"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={loading}
      className="rounded-lg border border-[#1e1e2e] bg-transparent px-4 py-2 text-sm font-medium text-[#9ca3af] transition-colors hover:border-[#2a2a3a] hover:text-[#e8e8ec] disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
