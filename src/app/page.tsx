import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e8e8ec] overflow-hidden">
      {/* ── Ambient glow effect ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] bg-[#c23a2b] opacity-[0.04] blur-[150px] rounded-full" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="text-lg font-bold tracking-[0.15em] select-none">
          <span className="text-[#e8e8ec]">STREAM</span>
          <span className="text-[#c23a2b]">REAPER</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-sm text-[#9ca3af] hover:text-[#e8e8ec] transition-colors duration-200"
          >
            Sign in
          </Link>
          <a
            href="#waitlist"
            className="text-sm text-[#9ca3af] hover:text-[#e8e8ec] transition-colors duration-200"
          >
            Join waitlist →
          </a>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-28 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1e1e2e] bg-[#12121a] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-xs text-[#9ca3af] tracking-wide uppercase">
            Valorant · Coming Soon
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          You killed a streamer.
          <br />
          <span className="text-[#c23a2b]">See their reaction.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-xl mx-auto text-lg text-[#9ca3af] leading-relaxed mb-10">
          StreamReaper scans your Valorant matches, finds games where you played
          against a streamer, and sends you a timestamped link to their Twitch
          VOD — so you can watch the exact moment you killed them.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#waitlist"
            className="px-8 py-3.5 bg-[#c23a2b] hover:bg-[#a83225] text-white font-semibold rounded-lg transition-colors duration-200 text-base"
          >
            Join the waitlist
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 border border-[#2a2a3a] hover:border-[#3a3a4a] text-[#9ca3af] hover:text-[#e8e8ec] font-medium rounded-lg transition-all duration-200 text-base"
          >
            See how it works
          </a>
        </div>

        {/* Hero mock notification */}
        <div className="mt-16 max-w-md mx-auto">
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-5 text-left shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-xs font-bold">
                SR
              </div>
              <div>
                <span className="text-sm font-semibold">StreamReaper</span>
                <span className="text-xs text-[#6b6b7b] ml-2">Today at 8:03 PM</span>
              </div>
            </div>
            <div className="border-l-4 border-[#22c55e] bg-[#0f1f15] rounded-r-lg p-4">
              <p className="text-sm font-bold text-[#22c55e] mb-1">
                ☠️ You killed tarik with a Vandal!
              </p>
              <p className="text-xs text-[#9ca3af] mb-3">
                <strong>tarik</strong> streams to ~24,000 viewers
              </p>
              <div className="flex gap-6 text-xs text-[#9ca3af]">
                <span>
                  <strong className="text-[#e8e8ec]">Map</strong>
                  <br />
                  Ascent
                </span>
                <span>
                  <strong className="text-[#e8e8ec]">Score</strong>
                  <br />
                  13-7
                </span>
                <span>
                  <strong className="text-[#e8e8ec]">Round</strong>
                  <br />
                  18
                </span>
              </div>
            </div>
            <p className="text-xs text-[#6b6b7b] mt-3">
              StreamReaper — streamreaper.gg
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-6xl mx-auto px-6 py-24"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          How it works
        </h2>
        <p className="text-center text-[#9ca3af] mb-16 max-w-lg mx-auto">
          Three steps. No downloads. No desktop app. Just notifications.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-7 relative">
            <div className="w-10 h-10 rounded-lg bg-[#c23a2b]/10 flex items-center justify-center text-[#c23a2b] font-bold text-lg mb-5">
              1
            </div>
            <h3 className="text-lg font-bold mb-3">Link your Riot account</h3>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              Sign in with Discord and connect your Valorant account via Riot
              Sign On. We only access your post-match data — nothing else.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-7 relative">
            <div className="w-10 h-10 rounded-lg bg-[#c23a2b]/10 flex items-center justify-center text-[#c23a2b] font-bold text-lg mb-5">
              2
            </div>
            <h3 className="text-lg font-bold mb-3">We scan your matches</h3>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              After each game, StreamReaper checks your match history against our
              database of known streamers. If you were in a streamer&apos;s game, we
              find it.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-7 relative">
            <div className="w-10 h-10 rounded-lg bg-[#c23a2b]/10 flex items-center justify-center text-[#c23a2b] font-bold text-lg mb-5">
              3
            </div>
            <h3 className="text-lg font-bold mb-3">Watch their reaction</h3>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              Get a Discord or email notification with a timestamped link that
              drops you right into the streamer&apos;s VOD — 30 seconds before the
              kill.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ENCOUNTER TYPES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Every encounter, captured
        </h2>
        <p className="text-center text-[#9ca3af] mb-16 max-w-lg mx-auto">
          It&apos;s not just kills. StreamReaper catches every moment worth watching.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              emoji: '☠️',
              label: 'Kills',
              desc: 'You eliminated a streamer',
              colour: '#22c55e',
            },
            {
              emoji: '💀',
              label: 'Deaths',
              desc: 'A streamer eliminated you',
              colour: '#ef4444',
            },
            {
              emoji: '🏆',
              label: 'Aces',
              desc: 'You aced with a streamer in the game',
              colour: '#f59e0b',
            },
            {
              emoji: '⚡',
              label: 'Clutches',
              desc: 'You clutched against a streamer',
              colour: '#8b5cf6',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 text-center hover:border-[#2a2a3a] transition-colors duration-200"
            >
              <div className="text-3xl mb-3">{item.emoji}</div>
              <h3
                className="text-base font-bold mb-1"
                style={{ color: item.colour }}
              >
                {item.label}
              </h3>
              <p className="text-xs text-[#9ca3af]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          Built for gamers
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              title: 'Push notifications',
              desc: "No need to search for clips. StreamReaper sends you a notification the moment it finds an encounter — via Discord webhook or email.",
              icon: '🔔',
            },
            {
              title: 'Timestamped VOD links',
              desc: 'Every link drops you into the VOD 30 seconds before the moment, so you can watch the tension build before the kill lands.',
              icon: '🎯',
            },
            {
              title: 'Seasonal leaderboards',
              desc: "Compete with other players to become the ultimate StreamReaper. Per-season stats, per-streamer rankings, and achievement badges.",
              icon: '📊',
            },
            {
              title: 'Gear Check',
              desc: "See what peripherals the streamer uses — mouse, keyboard, headset — with links to grab the same setup.",
              icon: '🖱️',
            },
            {
              title: 'Shareable encounters',
              desc: 'Every encounter page is designed to be shared. One click to post to Discord, X, or Reddit with your stats and the VOD link.',
              icon: '🔗',
            },
            {
              title: 'No download required',
              desc: "StreamReaper is a web app. No Overwolf, no desktop client, no overlay. Just link your account and you're done.",
              icon: '🌐',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex gap-5 p-6 rounded-xl bg-[#12121a] border border-[#1e1e2e]"
            >
              <div className="text-2xl mt-0.5 shrink-0">{feature.icon}</div>
              <div>
                <h3 className="text-base font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#9ca3af] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          WAITLIST
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="waitlist"
        className="relative z-10 max-w-6xl mx-auto px-6 py-24"
      >
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Get notified at launch
          </h2>
          <p className="text-[#9ca3af] mb-8">
            StreamReaper is in active development. Join the waitlist to be first
            in when we launch.
          </p>

          {/* Simple mailto CTA for now — replace with a proper form later */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://discord.gg/awuJC5BCYk"
              className="px-8 py-3.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-lg transition-colors duration-200 text-base flex items-center justify-center gap-2"
            >
              <svg
                width="20"
                height="15"
                viewBox="0 0 71 55"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M60.1 4.6A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.3 37.3 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.6a.2.2 0 00-.1.1C1.5 18 -.9 31 .3 43.8v.2a58.9 58.9 0 0017.7 9a.2.2 0 00.3-.1 42.1 42.1 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.7.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.3 47.3 0 003.6 5.9.2.2 0 00.3.1A58.7 58.7 0 0070.3 44v-.2c1.4-14.8-2.4-27.7-10.1-39.1a.2.2 0 00-.1-.1zM23.7 36c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.8 7-6.2 7zm23 0c-3.4 0-6.2-3.1-6.2-7s2.7-7 6.2-7 6.3 3.2 6.2 7-2.7 7-6.2 7z" />
              </svg>
              Join the Discord
            </a>
            <a
              href="https://x.com/StreamReaperGG"
              className="px-8 py-3.5 border border-[#2a2a3a] hover:border-[#3a3a4a] text-[#9ca3af] hover:text-[#e8e8ec] font-medium rounded-lg transition-all duration-200 text-base flex items-center justify-center gap-2"
            >
              Follow on X
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#1e1e2e] mt-8">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm font-bold tracking-[0.15em] select-none">
              <span className="text-[#e8e8ec]">STREAM</span>
              <span className="text-[#c23a2b]">REAPER</span>
            </div>
            <div className="flex gap-6 text-sm text-[#6b6b7b]">
              <a href="#" className="hover:text-[#9ca3af] transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-[#9ca3af] transition-colors">
                Terms
              </a>
              <a
                href="https://x.com/StreamReaperGG"
                className="hover:text-[#9ca3af] transition-colors"
              >
                X / Twitter
              </a>
              <a
                href="https://www.tiktok.com/@StreamReaperGG"
                className="hover:text-[#9ca3af] transition-colors"
              >
                TikTok
              </a>
            </div>
          </div>
          <p className="text-xs text-[#4a4a5a] mt-8 text-center leading-relaxed max-w-3xl mx-auto">
            StreamReaper isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the
            views or opinions of Riot Games or anyone officially involved in
            producing or managing Riot Games properties. Riot Games, and all
            associated properties are trademarks or registered trademarks of Riot
            Games, Inc.
          </p>
          <p className="text-xs text-[#4a4a5a] mt-4 text-center">
            © 2026 StreamReaper. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
