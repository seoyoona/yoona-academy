import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { Track, Translation } from "../src/content/types";

// Load ANTHROPIC_API_KEY from .env.local if present (Node 21+).
try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
    ".env.local",
  );
} catch {
  /* no .env.local — rely on shell env */
}

const MODEL = "claude-sonnet-4-6";
const FORCE = process.argv.includes("--force");
/** `--track=<slug>` restricts translation to a single track (pilot = python). */
const TRACK = process.argv.find((a) => a.startsWith("--track="))?.slice("--track=".length);
/** `--only=<substr>` further restricts to lesson ids containing substr. */
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const GEN = join(process.cwd(), "content", "generated");
const TRACKS = join(GEN, "tracks");
const OUT = join(GEN, "translations.json");

if (!process.env.ANTHROPIC_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
  console.error(
    "✗ No ANTHROPIC_API_KEY (or AI_GATEWAY_API_KEY). Set it in .env.local or the shell.",
  );
  process.exit(1);
}

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCHEMA = z.object({
  title: z.string(),
  contentMarkdown: z.string(),
});

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

function loadTracks(): Track[] {
  return readdirSync(TRACKS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(TRACKS, f), "utf8")) as Track)
    .filter((t) => (TRACK ? t.slug === TRACK : true));
}

/** Stable fingerprint of the English source — re-translates only when it changes. */
function hashOf(title: string, content: string): string {
  return createHash("sha256").update(`${title} ${content}`).digest("hex").slice(0, 16);
}

async function translateLesson(title: string, content: string) {
  const { object } = await generateObject({
    model: anthropic(MODEL),
    schema: SCHEMA,
    prompt: [
      "당신은 프로그래밍 강의 콘텐츠를 한국어로 번역하는 전문 번역가입니다.",
      "아래 레슨의 제목과 본문(마크다운)을 자연스럽고 정확한 한국어로 번역하세요.",
      "",
      "규칙:",
      "- 마크다운 구조를 그대로 보존: 헤딩 레벨(#, ##), 목록, 표, 인용, 굵게/기울임, 이미지 문법.",
      "- 절대 번역하지 말 것: 펜스 코드블록(``` ```)과 인라인 코드(`...`) 안의 코드, 식별자/변수/함수/클래스명, 키워드, 파일 경로, 패키지명, CLI 명령, URL.",
      "- 링크는 보이는 텍스트만 번역하고 괄호 안 URL은 그대로 둔다.",
      "- 코드블록 안의 주석은 번역해도 되지만 코드 자체는 절대 바꾸지 않는다.",
      "- 본문의 산문, 헤딩 텍스트, 목록 항목은 모두 한국어로 옮긴다.",
      "- 정착된 한국어 기술 용어를 우선 사용하되, 통용되는 영어 용어(list, API, variable 등)는 자연스러우면 그대로 둔다.",
      "- 의미를 더하거나 빼지 말고 원문 내용을 그대로 옮긴다. 서문/설명 없이 번역 결과만 낸다.",
      "",
      `# 원문 제목: ${title}`,
      "",
      "## 원문 본문(마크다운)",
      content,
    ].join("\n"),
  });
  return object;
}

async function main() {
  const tracks = loadTracks();
  if (TRACK && tracks.length === 0) {
    console.error(`✗ No track with slug "${TRACK}" found in ${TRACKS}`);
    process.exit(1);
  }
  const translations = readJson<Record<string, Translation>>(OUT, {});

  const lessons = tracks.flatMap((t) =>
    t.modules.flatMap((m) =>
      m.lessons.map((l) => ({ id: l.id, title: l.title, content: l.contentMarkdown })),
    ),
  );
  const todo = lessons
    .filter((l) => (ONLY ? l.id.includes(ONLY) : true))
    .filter((l) => {
      const hash = hashOf(l.title, l.content);
      return FORCE || translations[l.id]?.hash !== hash;
    });
  console.log(
    `${lessons.length} lessons${TRACK ? ` in "${TRACK}"` : ""} · ${todo.length} to translate\n`,
  );

  let done = 0;
  for (const lesson of todo) {
    try {
      const result = await translateLesson(lesson.title, lesson.content);
      translations[lesson.id] = {
        title: result.title,
        contentMarkdown: result.contentMarkdown,
        hash: hashOf(lesson.title, lesson.content),
        model: MODEL,
        generatedAt: new Date().toISOString(),
      };
      // Persist after each lesson so a crash never loses progress.
      writeFileSync(OUT, JSON.stringify(translations, null, 2));
      done += 1;
      console.log(`✓ [${done}/${todo.length}] ${lesson.id}`);
    } catch (err) {
      console.error(`✗ ${lesson.id}:`, (err as Error).message);
    }
  }
  console.log(`\nDone — ${done} lessons translated → ${OUT}`);
}

main();
