"use client";
import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { Resource } from "@/content/types";

const CAP = 240;

export function ResourceExplorer({ resources }: { resources: Resource[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("전체");

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) set.add(r.tags[0] ?? "기타");
    return ["전체", ...Array.from(set)];
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (group !== "전체" && (r.tags[0] ?? "기타") !== group) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    });
  }, [resources, query, group]);

  const shown = filtered.slice(0, CAP);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="리소스 검색… (예: react, pytorch, game)"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              group === g
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-accent"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filtered.length.toLocaleString()}개 중 {shown.length.toLocaleString()}개 표시
        {filtered.length > CAP && " — 검색으로 좁혀보세요"}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xs text-muted-foreground">{r.category}</span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </span>
            <span className="mt-1.5 font-medium leading-snug">{r.title}</span>
            {r.description && (
              <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {r.description}
              </span>
            )}
          </a>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          검색 결과가 없습니다.
        </p>
      )}
    </div>
  );
}
