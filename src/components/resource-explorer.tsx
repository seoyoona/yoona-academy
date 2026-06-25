"use client";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Play, Search } from "lucide-react";
import type { Resource } from "@/content/types";

const PAGE = 60;
const VIDEO_RE = /youtube\.com|youtu\.be|vimeo\.com|instagram\.com/i;
const ALL = "전체";

type SortKey = "default" | "title" | "source";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "기본 순" },
  { key: "title", label: "이름순" },
  { key: "source", label: "소스순" },
];

/** category = "타입 · 서브" → [타입, 서브]. The committed data is always this shape. */
function splitCategory(c: string): [string, string] {
  const i = c.indexOf(" · ");
  return i === -1 ? [c, "기타"] : [c.slice(0, i), c.slice(i + 3)];
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function ResourceExplorer({ resources }: { resources: Resource[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>(ALL); // level 1 (folder)
  const [sub, setSub] = useState<string>(ALL); //   level 2 (language/subcategory)
  const [sort, setSort] = useState<SortKey>("default");
  const [visible, setVisible] = useState(PAGE);

  // Pre-split once so filtering/counting is cheap.
  const items = useMemo(
    () =>
      resources.map((r, i) => {
        const [t, s] = splitCategory(r.category);
        return { r, t, s, i, video: VIDEO_RE.test(r.url), host: hostOf(r.url) };
      }),
    [resources],
  );

  // Level-1 counts (over everything).
  const typeChips = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.t, (m.get(it.t) ?? 0) + 1);
    return [
      { name: ALL, n: items.length },
      ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n })),
    ];
  }, [items]);

  // Level-2 counts (within the selected type only).
  const subChips = useMemo(() => {
    if (type === ALL) return [];
    const m = new Map<string, number>();
    let total = 0;
    for (const it of items)
      if (it.t === type) {
        m.set(it.s, (m.get(it.s) ?? 0) + 1);
        total++;
      }
    return [
      { name: ALL, n: total },
      ...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n })),
    ];
  }, [items, type]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = items.filter((it) => {
      if (type !== ALL && it.t !== type) return false;
      if (sub !== ALL && it.s !== sub) return false;
      if (!q) return true;
      return (
        it.r.title.toLowerCase().includes(q) ||
        it.r.category.toLowerCase().includes(q) ||
        it.r.description?.toLowerCase().includes(q) ||
        it.host.includes(q)
      );
    });
    if (sort === "title")
      out.sort((a, b) => a.r.title.localeCompare(b.r.title, "en"));
    else if (sort === "source")
      out.sort(
        (a, b) => a.r.sourceRepo.localeCompare(b.r.sourceRepo) || a.i - b.i,
      );
    return out;
  }, [items, query, type, sub, sort]);

  // Reset paging whenever the result set changes.
  useEffect(() => setVisible(PAGE), [query, type, sub, sort]);

  const videoCount = filtered.filter((it) => it.video).length;
  const shown = filtered.slice(0, visible);

  return (
    <div>
      {/* search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="리소스 검색… (예: react, pytorch, youtube)"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border p-0.5 text-sm">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`rounded-lg px-3.5 py-1.5 font-medium transition-colors ${
                sort === s.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* level 1 — folder/type */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          유형
        </p>
        <div className="flex flex-wrap gap-2">
          {typeChips.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setType(c.name);
                setSub(ALL);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                type === c.name
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              {c.name}
              <span
                className={`tabular-nums text-xs ${
                  type === c.name ? "text-primary-foreground/75" : "text-muted-foreground"
                }`}
              >
                {c.n}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* level 2 — language/subcategory, only inside a folder */}
      {subChips.length > 0 && (
        <div className="mt-4 border-l-2 border-primary/30 pl-3.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {type} 세부
          </p>
          <div className="flex flex-wrap gap-2">
            {subChips.map((c) => (
              <button
                key={c.name}
                onClick={() => setSub(c.name)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  sub === c.name
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {c.name === ALL ? `${type} 전체` : c.name}
                <span
                  className={`tabular-nums text-xs ${
                    sub === c.name ? "text-background/75" : "text-muted-foreground"
                  }`}
                >
                  {c.n}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {filtered.length.toLocaleString()}
        </span>
        개 일치
        {videoCount > 0 && (
          <span className="ml-1 inline-flex items-center gap-0.5">
            · <Play className="size-3" /> 영상 {videoCount}
          </span>
        )}
        {shown.length < filtered.length &&
          ` · ${shown.length.toLocaleString()}개 표시 중`}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((it) => (
          <a
            key={it.r.id}
            href={it.r.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">{it.r.category}</span>
              {it.video ? (
                <Play className="size-3.5 shrink-0 text-red-500" />
              ) : (
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              )}
            </span>
            <span className="mt-1.5 font-medium leading-snug">{it.r.title}</span>
            {it.r.description && (
              <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {it.r.description}
              </span>
            )}
            {it.host && (
              <span className="mt-2 truncate text-[11px] text-muted-foreground/70">
                {it.host}
              </span>
            )}
          </a>
        ))}
      </div>

      {shown.length < filtered.length && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + PAGE)}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            더보기 ({(filtered.length - shown.length).toLocaleString()}개 남음)
          </button>
        </div>
      )}

      {shown.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}
