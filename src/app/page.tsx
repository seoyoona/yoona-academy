import Link from "next/link";
import { ArrowRight, Bot, ListChecks, Library } from "lucide-react";
import { getAllTracks, trackCard, lessonRefs, trackStats } from "@/content/loader";
import { TrackCard } from "@/components/track-card";
import { ContinueLearning } from "@/components/continue-learning";

export default function HomePage() {
  const tracks = getAllTracks();
  const cards = tracks.map(trackCard);
  const refs = lessonRefs();
  const totals = tracks.reduce(
    (acc, t) => {
      const s = trackStats(t);
      acc.lessons += s.lessonCount;
      acc.hours += s.hours;
      return acc;
    },
    { lessons: 0, hours: 0 },
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          오픈소스로 만든 나만의 개발 아카데미
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          인강처럼 배우는,{" "}
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            나만의 커리큘럼
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          엄선된 오픈소스 강의를 구조화된 코스로. {totals.lessons}개 레슨, 약 {totals.hours}시간
          분량을 AI 튜터·퀴즈와 함께 학습하세요.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            href="/tracks"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            트랙 둘러보기 <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            리소스 라이브러리
          </Link>
        </div>
      </section>

      {/* Continue learning */}
      <section className="mt-12">
        <ContinueLearning lessons={refs} />
      </section>

      {/* Tracks */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">학습 트랙</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <TrackCard key={c.slug} track={c} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mt-14 grid gap-5 sm:grid-cols-3">
        {[
          { icon: ListChecks, title: "구조화된 커리큘럼", desc: "모듈과 레슨으로 정돈된 학습 경로를 따라갑니다." },
          { icon: Bot, title: "AI 튜터", desc: "레슨 내용을 맥락으로 이해될 때까지 질문하세요." },
          { icon: Library, title: "리소스 라이브러리", desc: "프로젝트 기반 튜토리얼과 ML 도구 모음." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
            <f.icon className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
