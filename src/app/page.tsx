import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StreamReaper",
  description:
    "Find when you killed a streamer in Valorant and jump to their VOD reaction.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-[0.12em] sm:text-5xl md:text-6xl">
            <span className="text-white">STREAM</span>
            <span className="text-[#c23a2b]">REAPER</span>
          </h1>

          <p className="mt-8 text-lg font-medium text-zinc-100 sm:text-xl">
            You killed a streamer. See their reaction.
          </p>

          <p className="mt-6 text-base leading-relaxed text-zinc-400 sm:text-lg">
            StreamReaper scans your Valorant matches, finds every time you
            killed or outplayed a streamer, and sends you a timestamped link
            to their VOD reaction. Coming soon.
          </p>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/[0.06] px-6 py-8">
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-zinc-500 sm:text-sm">
          StreamReaper isn&apos;t endorsed by Riot Games and doesn&apos;t
          reflect the views or opinions of Riot Games or anyone officially
          involved in producing or managing Riot Games properties.
        </p>
      </footer>
    </div>
  );
}
