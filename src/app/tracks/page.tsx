import type { Metadata } from "next";
import { getAllTracks, trackCard } from "@/content/loader";
import { TrackCard } from "@/components/track-card";

export const metadata: Metadata = { title: "트랙" };

export default function TracksPage() {
  const cards = getAllTracks().map(trackCard);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">학습 트랙</h1>
      <p className="mt-2 text-muted-foreground">
        한 트랙을 처음부터 끝까지 완주하며 실력을 쌓아보세요.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {cards.map((c) => (
          <TrackCard key={c.slug} track={c} />
        ))}
      </div>
    </div>
  );
}
