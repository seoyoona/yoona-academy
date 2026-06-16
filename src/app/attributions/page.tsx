import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { SOURCES } from "@/content/sources";

export const metadata: Metadata = { title: "출처 및 라이선스" };

export default function AttributionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">출처 및 라이선스</h1>
      <p className="mt-3 text-muted-foreground">
        Yoona Academy는 훌륭한 오픈소스 학습 자료 위에 만들어졌습니다. 모든 콘텐츠는
        아래 원저작자에게 귀속되며, 각 레슨에는 원본 링크를 함께 제공합니다.
      </p>

      <div className="mt-8 space-y-4">
        {SOURCES.map((s) => (
          <a
            key={s.repo}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{s.name}</h2>
                <p className="text-sm text-muted-foreground">{s.author} · {s.repo}</p>
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <p className="mt-3 text-sm">{s.role}</p>
            <span className="mt-2 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
              {s.license}
            </span>
          </a>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        본 사이트는 개인 학습 목적으로 제작되었으며, 큐레이션 자료(프로젝트 기반 학습,
        Awesome ML)는 원본으로 링크합니다. 라이선스 관련 문의는 각 저장소를 참고하세요.
      </p>
    </div>
  );
}
