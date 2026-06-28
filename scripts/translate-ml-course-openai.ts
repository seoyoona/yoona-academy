import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Lesson, Track, Translation } from "../src/content/types";

try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
    ".env.local",
  );
} catch {
  /* no .env.local — rely on shell env */
}

const ENV_FILE = process.argv.find((arg) => arg.startsWith("--env-file="))?.slice("--env-file=".length);
if (ENV_FILE) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
      ENV_FILE,
    );
  } catch (error) {
    throw new Error(`Failed to load env file ${ENV_FILE}: ${(error as Error).message}`);
  }
}

const MODEL =
  process.env.ML_COURSE_OPENAI_MODEL?.trim() ||
  process.env.OPENAI_MODEL?.trim() ||
  "gpt-4.1-mini";
const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
const GEN = join(process.cwd(), "content", "generated");
const TRACK = join(GEN, "tracks", "ml-engineering.json");
const OUT = join(GEN, "translations.json");
const COURSE_URL_PREFIX = "https://madewithml.com/courses/mlops/";
const MAX_CHARS_PER_REQUEST = 16000;

type LessonRef = { lesson: Lesson };

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

function hashOf(title: string, content: string): string {
  return createHash("sha256").update(`${title} ${content}`).digest("hex").slice(0, 16);
}

function flatten(track: Track): LessonRef[] {
  return track.modules.flatMap((module) => module.lessons.map((lesson) => ({ lesson })));
}

function isCourseLesson(lesson: Lesson): boolean {
  return lesson.sourceUrl?.startsWith(COURSE_URL_PREFIX) ?? false;
}

function replaceFencedBlocks(markdown: string): { markdown: string; blocks: string[] } {
  const blocks: string[] = [];
  const next = markdown.replace(/```[\s\S]*?```/g, (block) => {
    const index = blocks.length;
    blocks.push(block);
    return `\n\n@@YOONA_CODE_BLOCK_${index}@@\n\n`;
  });
  return { markdown: next, blocks };
}

function restoreFencedBlocks(markdown: string, blocks: string[]): string {
  return markdown.replace(/@@YOONA_CODE_BLOCK_(\d+)@@/g, (match, rawIndex: string) => {
    const block = blocks[Number.parseInt(rawIndex, 10)];
    return block ?? match;
  });
}

function chunkProse(prose: string): string[] {
  if (prose.length <= MAX_CHARS_PER_REQUEST) return [prose];
  const blocks = prose.split(/(?=\n#{1,4}\s+)|\n{2,}/g);
  const chunks: string[] = [];
  let current = "";
  for (const block of blocks) {
    if (!block.trim()) {
      current += block;
      continue;
    }
    if (current && current.length + block.length > MAX_CHARS_PER_REQUEST) {
      chunks.push(current);
      current = "";
    }
    if (block.length <= MAX_CHARS_PER_REQUEST) {
      current += block;
      continue;
    }
    const sentences = block.split(/(?<=[.!?])\s+/g);
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > MAX_CHARS_PER_REQUEST) {
        chunks.push(current);
        current = "";
      }
      current += (current ? " " : "") + sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function extractOutputText(payload: unknown): string {
  const response = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };
  if (typeof response.output_text === "string") return response.output_text;
  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("");
  if (text) return text;
  throw new Error("OpenAI response did not include output_text.");
}

async function translateChunk(chunk: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for OpenAI translation.");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content: [
            "You translate technical ML/MLOps course material into natural Korean.",
            "Preserve Markdown structure, heading levels, lists, tables, blockquotes, links, and inline code.",
            "Do not alter placeholders that match @@YOONA_CODE_BLOCK_0@@.",
            "Do not translate code identifiers, file paths, package names, CLI commands, URLs, or text inside inline code.",
            "Translate all ordinary prose into Korean. Return only the translated Markdown chunk.",
          ].join("\n"),
        },
        {
          role: "user",
          content: chunk,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `OpenAI ${response.status}: ${JSON.stringify(payload).slice(0, 1000)}`,
    );
  }
  return extractOutputText(payload).trim();
}

async function translateMarkdown(markdown: string): Promise<{ translated: string; chunks: number }> {
  const withPlaceholders = replaceFencedBlocks(markdown);
  const out: string[] = [];
  let translatedChunks = 0;
  const chunks = chunkProse(withPlaceholders.markdown);
  translatedChunks += chunks.length;
  for (const chunk of chunks) {
    out.push(await translateChunk(chunk));
  }
  const translated = restoreFencedBlocks(
    out.join("\n\n").replace(/\n{4,}/g, "\n\n\n").trim(),
    withPlaceholders.blocks,
  );
  return { translated, chunks: translatedChunks };
}

async function main() {
  const track = readJson<Track>(TRACK, null as unknown as Track);
  const translations = readJson<Record<string, Translation>>(OUT, {});
  const lessons = flatten(track)
    .map(({ lesson }) => lesson)
    .filter(isCourseLesson)
    .filter((lesson) => (ONLY ? lesson.id.includes(ONLY) : true))
    .filter((lesson) => FORCE || translations[lesson.id]?.hash !== hashOf(lesson.title, lesson.contentMarkdown));

  const dryRunRows = lessons.map((lesson) => {
    const chunks = chunkProse(replaceFencedBlocks(lesson.contentMarkdown).markdown);
    return {
      id: lesson.id,
      chars: lesson.contentMarkdown.length,
      chunks: chunks.length,
    };
  });

  const totalChunks = dryRunRows.reduce((sum, row) => sum + row.chunks, 0);
  const totalChars = dryRunRows.reduce((sum, row) => sum + row.chars, 0);
  console.log(
    `${lessons.length} Made With ML course lessons to translate · ${totalChunks} OpenAI requests · ${totalChars.toLocaleString()} source chars · model ${MODEL}`,
  );

  if (DRY_RUN) {
    console.table(dryRunRows);
    console.log("Dry run only. No OpenAI API calls were made.");
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Refusing to fall back to Anthropic.");
  }

  let done = 0;
  for (const lesson of lessons) {
    const result = await translateMarkdown(lesson.contentMarkdown);
    translations[lesson.id] = {
      title: lesson.title,
      contentMarkdown: result.translated,
      hash: hashOf(lesson.title, lesson.contentMarkdown),
      model: MODEL,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(OUT, JSON.stringify(translations, null, 2) + "\n");
    done += 1;
    console.log(`✓ [${done}/${lessons.length}] ${lesson.id} (${result.chunks} chunks)`);
  }

  console.log(`\nDone — translated ${done} course lessons with OpenAI → ${OUT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
