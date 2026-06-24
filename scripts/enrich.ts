import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { Track, Enrichment, Quiz } from "../src/content/types";

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
/** Optional: `--only=<substr>` restricts enrichment to lesson ids containing substr. */
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const GEN = join(process.cwd(), "content", "generated");
const TRACKS = join(GEN, "tracks");

if (!process.env.ANTHROPIC_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
  console.error(
    "✗ No ANTHROPIC_API_KEY (or AI_GATEWAY_API_KEY). Set it in .env.local or the shell.",
  );
  process.exit(1);
}

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCHEMA = z.object({
  objectives: z.array(z.string()).min(2).max(5),
  summary: z.string(),
  keyConcepts: z.array(z.string()).min(3).max(8),
  quiz: z
    .array(
      z.object({
        prompt: z.string(),
        choices: z.array(z.string()).length(4),
        answerIndex: z.number().int().min(0).max(3),
        explanation: z.string(),
      }),
    )
    .min(3)
    .max(5),
});

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

function loadTracks(): Track[] {
  return readdirSync(TRACKS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(TRACKS, f), "utf8")) as Track);
}

async function enrichLesson(title: string, content: string) {
  const { object } = await generateObject({
    model: anthropic(MODEL),
    schema: SCHEMA,
    prompt: [
      "당신은 온라인 강의 플랫폼의 교육 설계자입니다.",
      "아래 레슨을 학습자가 인강처럼 효과적으로 학습할 수 있도록 메타데이터를 한국어로 작성하세요.",
      "- objectives: 이 레슨을 마치면 할 수 있게 되는 것 3~5개 (행동 동사로)",
      "- summary: 레슨의 핵심을 2~3문장으로 요약",
      "- keyConcepts: 꼭 기억할 핵심 용어/개념 4~8개 (짧게)",
      "- quiz: 이해도를 점검하는 4지선다 문제 3~5개. 각 문제는 prompt(질문), choices(보기 4개), answerIndex(정답 0~3), explanation(왜 정답인지 해설).",
      "",
      `# 레슨 제목: ${title}`,
      "",
      "## 레슨 내용",
      content.slice(0, 7000),
    ].join("\n"),
  });
  return object;
}

async function main() {
  const tracks = loadTracks();
  const enrichments = readJson<Record<string, Enrichment>>(
    join(GEN, "enrichments.json"),
    {},
  );
  const quizzes = readJson<Record<string, Quiz>>(join(GEN, "quizzes.json"), {});

  const lessons = tracks.flatMap((t) =>
    t.modules.flatMap((m) =>
      m.lessons.map((l) => ({ id: l.id, title: l.title, content: l.contentMarkdown })),
    ),
  );
  const todo = lessons
    .filter((l) => (ONLY ? l.id.includes(ONLY) : true))
    .filter((l) => FORCE || !enrichments[l.id]);
  console.log(`${lessons.length} lessons total · ${todo.length} to enrich\n`);

  let done = 0;
  for (const lesson of todo) {
    try {
      const result = await enrichLesson(lesson.title, lesson.content);
      enrichments[lesson.id] = {
        objectives: result.objectives,
        summary: result.summary,
        keyConcepts: result.keyConcepts,
        model: MODEL,
        generatedAt: new Date().toISOString(),
      };
      quizzes[lesson.id] = {
        questions: result.quiz.map((q, i) => ({ id: `${lesson.id}-q${i}`, ...q })),
      };
      // Persist after each lesson so a crash never loses progress.
      writeFileSync(join(GEN, "enrichments.json"), JSON.stringify(enrichments, null, 2));
      writeFileSync(join(GEN, "quizzes.json"), JSON.stringify(quizzes, null, 2));
      done += 1;
      console.log(`✓ [${done}/${todo.length}] ${lesson.title}`);
    } catch (err) {
      console.error(`✗ ${lesson.title}:`, (err as Error).message);
    }
  }
  console.log(`\nDone — ${done} lessons enriched → content/generated/`);
}

main();
