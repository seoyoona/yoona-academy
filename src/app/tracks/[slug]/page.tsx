import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Layers } from "lucide-react";
import { getAllTracks, getTrack, trackStats } from "@/content/loader";
import { TrackSyllabus } from "@/components/track-syllabus";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
};

export function generateStaticParams() {
  return getAllTracks().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const track = getTrack(slug);
  return { title: track?.title ?? "트랙" };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const track = getTrack(slug);
  if (!track) notFound();

  const stats = trackStats(track);
  const modules = [...track.modules]
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      id: m.id,
      title: m.title,
      lessons: [...m.lessons]
        .sort((a, b) => a.order - b.order)
        .map((l) => ({ id: l.id, title: l.title, estMinutes: l.estMinutes })),
    }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/tracks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> 모든 트랙
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-3xl text-4xl"
          style={{ background: `${track.accent}1a` }}
        >
          {track.emoji}
        </span>
        <div>
          <span className="text-xs font-medium text-muted-foreground">
            {LEVEL_LABEL[track.level] ?? track.level}
          </span>
          <h1 className="text-3xl font-bold tracking-tight">{track.title}</h1>
        </div>
      </div>

      <p className="mt-4 text-muted-foreground">{track.description}</p>

      <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Layers className="size-4" /> {stats.moduleCount}개 모듈
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-4" /> {stats.lessonCount}개 레슨
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" /> 약 {stats.hours}시간
        </span>
      </div>

      <div className="mt-8">
        <TrackSyllabus modules={modules} accent={track.accent} />
      </div>
    </div>
  );
}
