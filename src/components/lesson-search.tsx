"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { LessonSearchField } from "@/content/loader";

const FIELDS: { key: LessonSearchField; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "title", label: "제목" },
  { key: "body", label: "본문" },
];

/**
 * Search box for /tracks. Owns the query text locally and reflects it into the
 * URL (?q=&field=) after a short debounce, so the server re-runs the search and
 * large lesson bodies never ship to the client.
 */
export function LessonSearch({
  initialQuery,
  initialField,
}: {
  initialQuery: string;
  initialField: LessonSearchField;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [field, setField] = useState<LessonSearchField>(initialField);
  // Skip the first sync so an initial URL isn't re-pushed on mount.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = setTimeout(() => {
      const q = query.trim();
      const params = new URLSearchParams();
      if (q) {
        params.set("q", q);
        if (field !== "all") params.set("field", field);
      }
      const qs = params.toString();
      router.replace(qs ? `/tracks?${qs}` : "/tracks", { scroll: false });
    }, 250);
    return () => clearTimeout(id);
  }, [query, field, router]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="레슨 검색 — 제목이나 본문 키워드"
          aria-label="레슨 검색"
          className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="검색어 지우기"
            className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="inline-flex rounded-lg border border-input p-0.5 text-sm">
        {FIELDS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setField(f.key)}
            aria-pressed={field === f.key}
            className={[
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              field === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
