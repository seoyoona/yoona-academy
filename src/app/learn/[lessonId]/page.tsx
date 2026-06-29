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
import { getYouTubeEmbed } from "@/lib/video-embeds";
import { aiEnabled } from "@/lib/ai";
import { LessonNav } from "@/components/lesson/lesson-nav";
import { LessonFooter } from "@/components/lesson/lesson-footer";
import { LessonQuiz } from "@/components/lesson/lesson-quiz";
import { TutorLauncher } from "@/components/lesson/tutor-chat";
import type { LessonTranscripts } from "@/content/types";

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

  const hasTranscripts = Boolean(view.transcripts?.videos.length);
  const html = await renderMarkdown(view.contentMarkdown, {
    embedYouTubeLinks: !hasTranscripts,
    promoteYouTubeEmbeds: !hasTranscripts,
  });
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

        {view.transcripts && view.transcripts.videos.length > 0 && (
          <TranscriptSection transcripts={view.transcripts} />
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

function TranscriptSection({
  transcripts,
}: {
  transcripts: LessonTranscripts;
}) {
  return (
    <details className="mt-12 rounded-2xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">보충 영상 및 Transcript</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {transcripts.videos.length}개 영상 · 한국어 자막
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
          열기
        </span>
      </summary>
      <div className="space-y-5 border-t border-border p-5 sm:p-6">
        {transcripts.videos.map((video) => (
          <VideoTranscriptCard key={video.videoId} video={video} />
        ))}
      </div>
    </details>
  );
}

function VideoTranscriptCard({
  video,
}: {
  video: LessonTranscripts["videos"][number];
}) {
  const embed = getYouTubeEmbed(video.url, video.title);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-background/60">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold">{video.title}</h3>
        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3.5" /> YouTube에서 바로 보기
        </a>
      </div>
      {embed && (
        <div className="relative aspect-video w-full bg-black">
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={embed.src}
            title={embed.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
      <details className="group border-t border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium">
          <span>Transcript</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {video.segments.length}구간
          </span>
        </summary>
        <div className="border-t border-border px-4 py-4">
          <div className="space-y-4">
            {video.segments.map((segment, segmentIndex) => (
              <p
                key={segmentIndex}
                className="grid gap-2 text-sm leading-7 sm:grid-cols-[4.5rem_1fr]"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {segment.start}
                </span>
                <span>{segment.text}</span>
              </p>
            ))}
          </div>
        </div>
      </details>
    </article>
  );
}
