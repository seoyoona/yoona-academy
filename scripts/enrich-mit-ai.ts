import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { Enrichment, Quiz, Track } from "../src/content/types";
import {
  buildMitSourcePacket,
  formatLectureNoteMarkdown,
  isFatalGenerationError,
  isRetryableGenerationError,
  isMitVideoLesson,
  resolveMitModelConfig,
  type MitLectureNote,
  type MitModelEnv,
} from "./lib/mit-ai-notes";

const ROOT = process.cwd();
const GEN = join(ROOT, "content", "generated");
const MIT_TRACK = join(GEN, "tracks", "mit-ai.json");
const ENRICHMENTS = join(GEN, "enrichments.json");
const QUIZZES = join(GEN, "quizzes.json");

const FORCE = process.argv.includes("--force");
const FORCE_BODY = process.argv.includes("--force-body");
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

loadEnvFileIfPresent(join(ROOT, ".env.local"));
if (process.env.MIT_AI_ENV_FILE) {
  loadEnvFileIfPresent(process.env.MIT_AI_ENV_FILE);
}

const ConceptSchema = z.object({
  term: z.string(),
  explanation: z.string(),
});

const LectureNoteSchema = z.object({
  guidingQuestion: z.string(),
  flow: z.array(z.string()).min(3).max(7),
  concepts: z.array(ConceptSchema).min(4).max(8),
  watchFocus: z.array(z.string()).min(2).max(5),
  reviewQuestions: z.array(z.string()).min(2).max(5),
  sourceLimitNote: z.string(),
});

const GeneratedSchema = z.object({
  lectureNote: LectureNoteSchema.nullable(),
  enrichment: z.object({
    objectives: z.array(z.string()).min(2).max(5),
    summary: z.string(),
    keyConcepts: z.array(z.string()).min(3).max(8),
  }),
  quiz: z.array(
    z.object({
      prompt: z.string(),
      choices: z.array(z.string()).length(4),
      answerIndex: z.number().int().min(0).max(3),
      explanation: z.string(),
    }),
  ).min(3).max(5),
});

type GeneratedMitLesson = z.infer<typeof GeneratedSchema>;

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : fallback;
}

function loadEnvFileIfPresent(path: string) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = unquoteEnvValue(rawValue.trim());
  }
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function lessonNeedsWork(args: {
  lessonId: string;
  video: boolean;
  bodyHasNotes: boolean;
  enrichments: Record<string, Enrichment>;
  quizzes: Record<string, Quiz>;
}) {
  if (FORCE) return true;
  if (!args.enrichments[args.lessonId]) return true;
  if (!args.quizzes[args.lessonId]?.questions?.length) return true;
  if (args.video && !args.bodyHasNotes) return true;
  if (args.video && FORCE_BODY) return true;
  return false;
}

function hasGeneratedLectureSections(markdown: string): boolean {
  return (
    markdown.includes("## 이 강의에서 다루는 질문") &&
    markdown.includes("## 강의 흐름") &&
    markdown.includes("## 핵심 개념")
  );
}

function createLanguageModel() {
  const config = resolveMitModelConfig(readMitModelEnv());
  const provider =
    config.provider === "openai"
      ? createOpenAI({ apiKey: config.apiKey })
      : createAnthropic({ apiKey: config.apiKey });
  return { config, model: provider(config.model) };
}

function readMitModelEnv(): MitModelEnv {
  return {
    MIT_AI_PROVIDER: process.env.MIT_AI_PROVIDER,
    MIT_AI_MODEL: process.env.MIT_AI_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  };
}

async function generateMitLesson(source: ReturnType<typeof buildMitSourcePacket>): Promise<GeneratedMitLesson> {
  const { config, model } = createLanguageModel();
  const kind = source.isVideo ? "video lecture" : "authored guide";
  const { object } = await generateObject({
    model,
    schema: GeneratedSchema,
    prompt: [
      "당신은 MIT OpenCourseWare를 한국어 학습 코스로 바꾸는 교육 설계자입니다.",
      "출력은 모두 자연스러운 한국어여야 합니다.",
      "",
      "핵심 원칙:",
      "- 절대 자막 전체 번역이나 장문 전사본을 만들지 마세요.",
      "- 영상 레슨은 강의 대체물이 아니라 보기 전/본 뒤에 쓰는 강의 노트형 시청 가이드로 만드세요.",
      "- 제공된 소스에 없는 세부 내용을 실제 강의에서 말했다고 단정하지 마세요.",
      "- transcript가 없는 경우 sourceLimitNote에 '강의 제목과 OCW 맥락을 바탕으로 만든 시청 가이드'라는 취지를 명시하세요.",
      "- 퀴즈는 제목과 노트에서 확인 가능한 개념 이해를 묻고, 사소한 암기나 영상 속 발언 위치를 묻지 마세요.",
      "- lectureNote는 video lecture일 때만 객체로 채우고, authored guide일 때는 null로 두세요.",
      "",
      `# Lesson kind: ${kind}`,
      `# Lesson ID: ${source.lessonId}`,
      `# Title: ${source.title}`,
      `# Module: ${source.moduleTitle}`,
      `# Source URL: ${source.sourceUrl}`,
      `# License: ${source.license}`,
      "",
      "## Existing lesson markdown",
      source.existingMarkdown.slice(0, 9000),
    ].join("\n"),
  });
  console.log(`  model: ${config.provider}/${config.model}`);
  return object;
}

async function generateMitLessonWithRetry(
  source: ReturnType<typeof buildMitSourcePacket>,
  attempts = 3,
): Promise<GeneratedMitLesson> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await generateMitLesson(source);
    } catch (error) {
      lastError = error;
      if (!isRetryableGenerationError(error) || attempt === attempts) break;
      console.warn(
        `  retrying ${source.lessonId} after structured generation mismatch (${attempt}/${attempts})`,
      );
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function main() {
  const track = readJson<Track>(MIT_TRACK, null as unknown as Track);
  if (!track || track.slug !== "mit-ai") {
    throw new Error(`Missing MIT AI track at ${MIT_TRACK}`);
  }
  const enrichments = readJson<Record<string, Enrichment>>(ENRICHMENTS, {});
  const quizzes = readJson<Record<string, Quiz>>(QUIZZES, {});
  const candidates = track.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ module, lesson })),
  ).filter(({ lesson }) => (ONLY ? lesson.id.includes(ONLY) : true));
  const todo = candidates.filter(({ lesson }) =>
    lessonNeedsWork({
      lessonId: lesson.id,
      video: isMitVideoLesson(lesson),
      bodyHasNotes: hasGeneratedLectureSections(lesson.contentMarkdown),
      enrichments,
      quizzes,
    }),
  );

  console.log(`${candidates.length} MIT lessons selected · ${todo.length} to generate`);
  if (DRY_RUN) {
    for (const { lesson } of todo.slice(0, 20)) {
      console.log(`- ${lesson.id} · ${lesson.title}`);
    }
    if (todo.length > 20) console.log(`...and ${todo.length - 20} more`);
    return;
  }

  let done = 0;
  for (const { module, lesson } of todo) {
    try {
      const source = buildMitSourcePacket(lesson, module);
      const result = await generateMitLessonWithRetry(source);
      if (source.isVideo && result.lectureNote && (FORCE_BODY || !hasGeneratedLectureSections(lesson.contentMarkdown))) {
        lesson.contentMarkdown = formatLectureNoteMarkdown(lesson, result.lectureNote as MitLectureNote);
      }
      const modelConfig = resolveMitModelConfig(readMitModelEnv());
      enrichments[lesson.id] = {
        objectives: result.enrichment.objectives,
        summary: result.enrichment.summary,
        keyConcepts: result.enrichment.keyConcepts,
        model: `${modelConfig.provider}/${modelConfig.model}`,
        generatedAt: new Date().toISOString(),
      };
      quizzes[lesson.id] = {
        questions: result.quiz.map((question, index) => ({
          id: `${lesson.id}-q${index}`,
          ...question,
        })),
      };
      writeJson(MIT_TRACK, track);
      writeJson(ENRICHMENTS, enrichments);
      writeJson(QUIZZES, quizzes);
      done += 1;
      console.log(`✓ [${done}/${todo.length}] ${lesson.id}`);
    } catch (error) {
      console.error(`✗ ${lesson.id}: ${(error as Error).message}`);
      if (isFatalGenerationError(error)) {
        console.error("Fatal generation error; stopping so the same external failure is not repeated.");
        break;
      }
    }
  }
  console.log(`\nDone — ${done} MIT lessons generated.`);
}

main();
