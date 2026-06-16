"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { useProgress } from "@/lib/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
};

export type TrackCardData = {
  slug: string;
  title: string;
  description: string;
  level: string;
  emoji: string;
  accent: string;
  lessonIds: string[];
  moduleCount: number;
  hours: number;
};

export function TrackCard({ track }: { track: TrackCardData }) {
  const { countOf } = useProgress();
  const total = track.lessonIds.length;
  const done = countOf(track.lessonIds);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Link href={`/tracks/${track.slug}`} className="group block">
      <Card
        className="relative h-full overflow-hidden p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        style={{ "--accent": track.accent } as React.CSSProperties}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: track.accent }}
        />
        <div className="flex items-start justify-between">
          <span
            className="grid size-12 place-items-center rounded-2xl text-2xl"
            style={{ background: `${track.accent}1a` }}
          >
            {track.emoji}
          </span>
          <Badge variant="secondary">{LEVEL_LABEL[track.level] ?? track.level}</Badge>
        </div>

        <h3 className="mt-4 text-lg font-semibold tracking-tight">{track.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {track.description}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5" /> {total}개 레슨 · {track.moduleCount}개 모듈
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> 약 {track.hours}시간
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {done > 0 ? `${pct}% 완료` : "시작하기"}
            </span>
            <span className="text-muted-foreground">
              {done}/{total}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: track.accent }}
            />
          </div>
        </div>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          {done > 0 ? "이어서 학습" : "트랙 보기"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Card>
    </Link>
  );
}
