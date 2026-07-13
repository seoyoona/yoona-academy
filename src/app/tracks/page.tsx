import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllTracks,
  searchLessons,
  trackCard,
  type LessonSearchField,
} from "@/content/loader";
import { TrackCard } from "@/components/track-card";
import { LessonSearch } from "@/components/lesson-search";
import { Highlight } from "@/components/search-highlight";

export const metadata: Metadata = { title: "트랙" };

const FIELDS: LessonSearchField[] = ["title", "body", "all"];

function normalizeField(raw: string | string[] | undefined): LessonSearchField {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return FIELDS.includes(value as LessonSearchField)
    ? (value as LessonSearchField)
    : "all";
}

export default async function TracksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; field?: string | string[] }>;
}) {
  const sp = await searchParams;
  const query = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const field = normalizeField(sp.field);
  const results = query ? searchLessons(query, field) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">학습 트랙</h1>
      <p className="mt-2 text-muted-foreground">
        한 트랙을 처음부터 끝까지 완주하며 실력을 쌓아보세요.
      </p>

      <div className="mt-8">
        <LessonSearch initialQuery={query} initialField={field} />
      </div>

      {query ? (
        <section className="mt-8">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">“{query}”</span> 검색 결과{" "}
            {results.length}개
          </p>
          {results.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              일치하는 레슨이 없습니다. 다른 키워드로 검색해 보세요.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-lg border">
              {results.map((hit) => (
                <li key={hit.id}>
                  <Link
                    href={`/learn/${hit.id}`}
                    className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-accent"
                  >
                    <span className="mt-0.5 text-lg leading-none">{hit.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        <Highlight text={hit.title} query={query} />
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {hit.trackTitle} · {hit.moduleTitle}
                      </span>
                      {hit.snippet && (
                        <span className="mt-1 block text-sm text-muted-foreground">
                          <Highlight text={hit.snippet} query={query} />
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {getAllTracks().map(trackCard).map((c) => (
            <TrackCard key={c.slug} track={c} />
          ))}
        </div>
      )}
    </div>
  );
}
