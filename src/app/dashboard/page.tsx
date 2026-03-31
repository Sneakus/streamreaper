import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LinkRiotAccount from "./link-riot-account";
import { SignOutButton } from "./sign-out-button";

function discordDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  if (typeof meta.full_name === "string" && meta.full_name) return meta.full_name;
  if (typeof meta.name === "string" && meta.name) return meta.name;
  if (typeof meta.user_name === "string" && meta.user_name) return meta.user_name;
  const discord = user.identities?.find((i) => i.provider === "discord");
  const data = discord?.identity_data as Record<string, string> | undefined;
  if (data?.full_name) return data.full_name;
  if (data?.name) return data.name;
  if (user.email) return user.email;
  return "Discord user";
}

function discordAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  if (typeof meta.avatar_url === "string" && meta.avatar_url) return meta.avatar_url;
  if (typeof meta.picture === "string" && meta.picture) return meta.picture;
  const discord = user.identities?.find((i) => i.provider === "discord");
  const data = discord?.identity_data as Record<string, string> | undefined;
  if (typeof data?.avatar_url === "string" && data.avatar_url) return data.avatar_url;
  return null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = discordDisplayName(user);
  const avatarUrl = discordAvatarUrl(user);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e8e8ec]">
      <header className="border-b border-[#1e1e2e] px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-[0.15em] select-none"
          >
            <span className="text-[#e8e8ec]">STREAM</span>
            <span className="text-[#c23a2b]">REAPER</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 shrink-0 rounded-full border border-[#1e1e2e] object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#1e1e2e] bg-[#12121a] text-2xl font-bold text-[#9ca3af]">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm text-[#9ca3af]">Signed in as</p>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {user.email ? (
              <p className="mt-1 text-sm text-[#9ca3af]">{user.email}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-12">
          <LinkRiotAccount />
        </div>

        <section className="mt-12 rounded-xl border border-[#1e1e2e] bg-[#12121a] p-8">
          <h2 className="text-lg font-bold">Encounters</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
            Your streamer encounters will show up here once match scanning is
            connected. Nothing to see yet — check back after launch.
          </p>
        </section>
      </div>
    </main>
  );
}
