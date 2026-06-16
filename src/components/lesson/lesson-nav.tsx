"use client";
import Link from "next/link";
import { CheckCircle2, Circle, Dot } from "lucide-react";
import { useProgress } from "@/lib/progress";

type LessonItem = { id: string; title: string };
type ModuleItem = { id: string; title: string; lessons: LessonItem[] };

export function LessonNav({
  trackTitle,
  trackSlug,
  modules,
  currentId,
  accent,
}: {
  trackTitle: string;
  trackSlug: string;
  modules: ModuleItem[];
  currentId: string;
  accent: string;
}) {
  const { map } = useProgress();
  return (
    <nav className="text-sm">
      <Link
        href={`/tracks/${trackSlug}`}
        className="block px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {trackTitle}
      </Link>
      <div className="mt-3 space-y-4">
        {modules.map((m) => (
          <div key={m.id}>
            <p className="px-2 text-xs font-medium text-muted-foreground">{m.title}</p>
            <ul className="mt-1">
              {m.lessons.map((l) => {
                const active = l.id === currentId;
                const complete = Boolean(map[l.id]);
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${l.id}`}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                        active
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      }`}
                    >
                      {complete ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" style={{ color: accent }} />
                      ) : active ? (
                        <Dot className="-ml-1 size-5 shrink-0" style={{ color: accent }} />
                      ) : (
                        <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
                      )}
                      <span className="line-clamp-2">{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
