"use client";
import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { useProgress } from "@/lib/progress";

export type LessonRef = {
  id: string;
  title: string;
  trackSlug: string;
  trackTitle: string;
  emoji: string;
  moduleTitle: string;
};

export function ContinueLearning({ lessons }: { lessons: LessonRef[] }) {
  const { map, totalCompleted } = useProgress();
  const next = lessons.find((l) => !map[l.id]);
  const allDone = !next && lessons.length > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
      <Sparkles className="absolute -right-6 -top-6 size-32 text-primary/10" />
      <p className="text-sm font-medium text-primary">
        {totalCompleted > 0 ? `${totalCompleted}개 레슨 완료 ✨` : "학습을 시작해보세요"}
      </p>
      {allDone ? (
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          모든 레슨을 완료했어요! 🎉
        </h2>
      ) : next ? (
        <>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            {totalCompleted > 0 ? "이어서 학습하기" : "여기서 시작하기"}
          </h2>
          <Link
            href={`/learn/${next.id}`}
            className="group mt-4 flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/40"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Play className="size-5 fill-current" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">
                {next.emoji} {next.trackTitle} · {next.moduleTitle}
              </span>
              <span className="block truncate font-semibold">{next.title}</span>
            </span>
            <ArrowRight className="ml-auto size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </>
      ) : null}
    </div>
  );
}
