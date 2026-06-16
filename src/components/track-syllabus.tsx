"use client";
import Link from "next/link";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useProgress } from "@/lib/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type LessonItem = { id: string; title: string; estMinutes: number };
type ModuleItem = { id: string; title: string; lessons: LessonItem[] };

export function TrackSyllabus({
  modules,
  accent,
}: {
  modules: ModuleItem[];
  accent: string;
}) {
  const { map, countOf } = useProgress();
  const allIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const done = countOf(allIds);
  const total = allIds.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">진행률</span>
          <span className="text-muted-foreground">
            {done} / {total} 완료 · {pct}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
      </div>

      <Accordion defaultValue={modules.map((m) => m.id)} className="space-y-3">
        {modules.map((m, i) => {
          const mDone = countOf(m.lessons.map((l) => l.id));
          return (
            <AccordionItem
              key={m.id}
              value={m.id}
              className="rounded-2xl border border-border bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-3 text-left">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-semibold"
                    style={{ background: `${accent}1a`, color: accent }}
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{m.title}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {mDone}/{m.lessons.length} 완료
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <ul className="space-y-0.5">
                  {m.lessons.map((l) => {
                    const complete = Boolean(map[l.id]);
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/learn/${l.id}`}
                          className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                        >
                          {complete ? (
                            <CheckCircle2
                              className="size-4 shrink-0"
                              style={{ color: accent }}
                            />
                          ) : (
                            <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                          )}
                          <span
                            className={`flex-1 text-sm ${complete ? "text-muted-foreground" : ""}`}
                          >
                            {l.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" /> {l.estMinutes}분
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
