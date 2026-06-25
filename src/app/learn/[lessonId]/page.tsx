import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ExternalLink, Target, ListChecks, FileText } from "lucide-react";
import {
  getAllLessonIds,
  getLessonView,
  getLocalizedModules,
} from "@/content/loader";
import { renderMarkdown } from "@/lib/render-markdown";
import { aiEnabled } from "@/lib/ai";
import { LessonNav } from "@/components/lesson/lesson-nav";
import { LessonFooter } from "@/components/lesson/lesson-footer";
import { LessonQuiz } from "@/components/lesson/lesson-quiz";
import { TutorLauncher } from "@/components/lesson/tutor-chat";

export function generateStaticParams() {
  return getAllLessonIds().map((lessonId) => ({ lessonId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const view = getLessonView(lessonId);
  return { title: view ? `${view.title} · ${view.track.title}` : "레슨" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const view = getLessonView(lessonId);
  if (!view) notFound();

  const html = await renderMarkdown(view.contentMarkdown);
  const modules = getLocalizedModules(view.track.slug);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
          <LessonNav
            trackTitle={view.track.title}
            trackSlug={view.track.slug}
            modules={modules}
            currentId={view.id}
            accent={view.track.accent}
          />
        </div>
      </aside>

      <article className="min-w-0">
        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href={`/tracks/${view.track.slug}`} className="hover:text-foreground">
            {view.track.emoji} {view.track.title}
          </Link>
          <span>/</span>
          <span>{view.module.title}</span>
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">{view.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" /> 약 {view.estMinutes}분
          </span>
          <a
            href={view.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <ExternalLink className="size-4" /> 원본 · {view.sourceRepo}
          </a>
        </div>

        {/* AI enrichment */}
        {view.enrichment && (
          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <FileText className="size-4 text-primary" /> 핵심 요약
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {view.enrichment.summary}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Target className="size-4 text-primary" /> 학습 목표
              </p>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {view.enrichment.objectives.map((o, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-primary">·</span> {o}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <ListChecks className="size-4 text-primary" /> 핵심 개념
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {view.enrichment.keyConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* content */}
        <div
          className="lesson-prose prose prose-neutral mt-8 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {view.quiz && view.quiz.questions.length > 0 && (
          <LessonQuiz quiz={view.quiz} />
        )}

        <LessonFooter lessonId={view.id} prev={view.prev} next={view.next} />
      </article>

      <TutorLauncher
        lessonId={view.id}
        lessonTitle={view.title}
        aiEnabled={aiEnabled}
      />
    </div>
  );
}
