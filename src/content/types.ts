import { z } from "zod";

/**
 * Canonical content schema — the single source of truth shared by the content
 * pipeline (scripts/) and the web app (src/app/). Content is generated offline
 * and committed as JSON under content/generated/, so the browsing + reading
 * experience needs no database or external service at runtime.
 */

export const LevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export type Level = z.infer<typeof LevelSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  choices: z.array(z.string()).min(2),
  answerIndex: z.number().int().min(0),
  explanation: z.string(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});
export type Quiz = z.infer<typeof QuizSchema>;

export const EnrichmentSchema = z.object({
  objectives: z.array(z.string()),
  summary: z.string(),
  keyConcepts: z.array(z.string()),
  model: z.string(),
  generatedAt: z.string(),
});
export type Enrichment = z.infer<typeof EnrichmentSchema>;

/** A single lesson — the atomic unit of learning. */
export const LessonSchema = z.object({
  /** Globally unique, URL-safe: `${trackSlug}__${moduleSlug}__${lessonSlug}` */
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  order: z.number().int(),
  estMinutes: z.number().int().positive(),
  contentMarkdown: z.string(),
  /** Provenance — honored for attribution + licensing. */
  sourceRepo: z.string(),
  sourceUrl: z.string(),
  license: z.string(),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const ModuleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  order: z.number().int(),
  lessons: z.array(LessonSchema),
});
export type Module = z.infer<typeof ModuleSchema>;

export const TrackSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  level: LevelSchema,
  order: z.number().int(),
  emoji: z.string().default("📘"),
  accent: z.string().default("#6366f1"),
  modules: z.array(ModuleSchema),
});
export type Track = z.infer<typeof TrackSchema>;

export const ResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  sourceRepo: z.string(),
  description: z.string().optional(),
});
export type Resource = z.infer<typeof ResourceSchema>;

/** Korean translation overlay for a lesson, produced by scripts/translate.ts. */
export const TranslationSchema = z.object({
  title: z.string(),
  contentMarkdown: z.string(),
  /** sha256 fingerprint of the English source — invalidates the cache on change. */
  hash: z.string(),
  model: z.string().optional(),
  generatedAt: z.string().optional(),
});
export type Translation = z.infer<typeof TranslationSchema>;

/** Maps keyed by lesson id, produced by the enrichment step (idempotent cache). */
export const EnrichmentMapSchema = z.record(z.string(), EnrichmentSchema);
export const QuizMapSchema = z.record(z.string(), QuizSchema);
/** Permissive on purpose — a malformed/missing entry must never break rendering. */
export const TranslationMapSchema = z.record(z.string(), z.unknown());

/** A lesson with its enrichment + quiz merged in, plus navigation context. */
export type LessonView = Lesson & {
  enrichment?: Enrichment;
  quiz?: Quiz;
  track: Pick<Track, "id" | "slug" | "title" | "emoji" | "accent">;
  module: Pick<Module, "id" | "slug" | "title">;
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
};
