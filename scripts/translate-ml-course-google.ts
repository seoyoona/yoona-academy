import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Lesson, Track, Translation } from "../src/content/types";

const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
const GEN = join(process.cwd(), "content", "generated");
const TRACK = join(GEN, "tracks", "ml-engineering.json");
const OUT = join(GEN, "translations.json");
const COURSE_URL_PREFIX = "https://madewithml.com/courses/mlops/";
const MAX_CHARS_PER_REQUEST = 4200;
const MODEL = "google-translate-gtx:en-ko";

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

function hashOf(title: string, content: string): string {
  return createHash("sha256").update(`${title} ${content}`).digest("hex").slice(0, 16);
}

function flatten(track: Track): Lesson[] {
  return track.modules.flatMap((module) => module.lessons);
}

function isCourseLesson(lesson: Lesson): boolean {
  return lesson.sourceUrl?.startsWith(COURSE_URL_PREFIX) ?? false;
}

function replaceProtected(markdown: string): { markdown: string; protectedParts: string[] } {
  const protectedParts: string[] = [];
  const protect = (value: string) => {
    const index = protectedParts.length;
    protectedParts.push(value);
    return `@@YOONA_PROTECTED_${index}@@`;
  };

  const next = markdown
    .replace(/```[\s\S]*?```/g, protect)
    .replace(/!\[[^\]]*]\([^)]+\)/g, protect)
    .replace(/https?:\/\/[^\s)]+/g, protect);
  return { markdown: next, protectedParts };
}

function restoreProtected(markdown: string, protectedParts: string[]): string {
  return markdown.replace(/@@YOONA_PROTECTED_(\d+)@@/g, (match, rawIndex: string) => {
    const part = protectedParts[Number.parseInt(rawIndex, 10)];
    return part ?? match;
  });
}

function restoreSourceCodeBlocks(translated: string, source: string): string {
  const sourceBlocks = source.match(/```[\s\S]*?```/g) ?? [];
  let index = 0;
  return translated.replace(/```[\s\S]*?```/g, (block) => {
    const sourceBlock = sourceBlocks[index];
    index += 1;
    return sourceBlock ?? block;
  });
}

function chunkMarkdown(markdown: string): string[] {
  if (markdown.length <= MAX_CHARS_PER_REQUEST) return [markdown];
  const blocks = markdown.split(/(\n{2,})/g);
  const chunks: string[] = [];
  let current = "";
  for (const block of blocks) {
    if (current && current.length + block.length > MAX_CHARS_PER_REQUEST) {
      chunks.push(current);
      current = "";
    }
    if (block.length <= MAX_CHARS_PER_REQUEST) {
      current += block;
      continue;
    }
    const lines = block.split(/(?<=\n)/g);
    for (const line of lines) {
      if (current && current.length + line.length > MAX_CHARS_PER_REQUEST) {
        chunks.push(current);
        current = "";
      }
      current += line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(chunk: string): Promise<string> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: "ko",
    dt: "t",
    q: chunk,
  });
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    { headers: { "user-agent": "yoona-academy-content-ingest/1.0" } },
  );
  if (!response.ok) {
    throw new Error(`Google Translate ${response.status}: ${await response.text()}`);
  }
  const payload = (await response.json()) as Array<Array<Array<string | null>>>;
  const translated = payload[0]?.map((part) => part[0] ?? "").join("");
  if (!translated) throw new Error("Google Translate returned an empty response.");
  return translated;
}

async function translateMarkdown(markdown: string): Promise<{ translated: string; chunks: number }> {
  const protectedMarkdown = replaceProtected(markdown);
  const chunks = chunkMarkdown(protectedMarkdown.markdown);
  const out: string[] = [];
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk));
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return {
    translated: restoreProtected(out.join("\n\n"), protectedMarkdown.protectedParts)
      .replace(/\n{4,}/g, "\n\n\n")
      .trim(),
    chunks: chunks.length,
  };
}

async function main() {
  const track = readJson<Track>(TRACK, null as unknown as Track);
  const translations = readJson<Record<string, Translation>>(OUT, {});
  const lessons = flatten(track)
    .filter(isCourseLesson)
    .filter((lesson) => (ONLY ? lesson.id.includes(ONLY) : true))
    .filter(
      (lesson) =>
        FORCE || translations[lesson.id]?.hash !== hashOf(lesson.title, lesson.contentMarkdown),
    );
  const rows = lessons.map((lesson) => ({
    id: lesson.id,
    chars: lesson.contentMarkdown.length,
    chunks: chunkMarkdown(replaceProtected(lesson.contentMarkdown).markdown).length,
  }));
  const totalChunks = rows.reduce((sum, row) => sum + row.chunks, 0);
  console.log(
    `${lessons.length} Made With ML course lessons to translate · ${totalChunks} Google Translate requests · ${MODEL}`,
  );

  if (DRY_RUN) {
    console.table(rows);
    console.log("Dry run only. No translation requests were made.");
    return;
  }

  let done = 0;
  for (const lesson of lessons) {
    const result = await translateMarkdown(lesson.contentMarkdown);
    translations[lesson.id] = {
      title: lesson.title,
      contentMarkdown: restoreSourceCodeBlocks(result.translated, lesson.contentMarkdown),
      hash: hashOf(lesson.title, lesson.contentMarkdown),
      model: MODEL,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(OUT, JSON.stringify(translations, null, 2) + "\n");
    done += 1;
    console.log(`✓ [${done}/${lessons.length}] ${lesson.id} (${result.chunks} chunks)`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
