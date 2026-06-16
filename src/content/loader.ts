import "server-only";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  type Track,
  type Resource,
  type Enrichment,
  type Quiz,
  type LessonView,
  type Lesson,
  type Module,
  TrackSchema,
  ResourceSchema,
  EnrichmentMapSchema,
  QuizMapSchema,
} from "./types";

const GEN_DIR = join(process.cwd(), "content", "generated");
const TRACKS_DIR = join(GEN_DIR, "tracks");

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** Lazily loaded + cached for the lifetime of the server process. */
let _tracks: Track[] | null = null;
let _resources: Resource[] | null = null;
let _enrichments: Record<string, Enrichment> | null = null;
let _quizzes: Record<string, Quiz> | null = null;

export function getAllTracks(): Track[] {
  if (_tracks) return _tracks;
  if (!existsSync(TRACKS_DIR)) return (_tracks = []);
  const files = readdirSync(TRACKS_DIR).filter((f) => f.endsWith(".json"));
  _tracks = files
    .map((f) => TrackSchema.parse(readJson(join(TRACKS_DIR, f), null)))
    .sort((a, b) => a.order - b.order);
  return _tracks;
}

export function getTrack(slug: string): Track | undefined {
  return getAllTracks().find((t) => t.slug === slug);
}

export function getAllResources(): Resource[] {
  if (_resources) return _resources;
  const raw = readJson<unknown[]>(join(GEN_DIR, "resources.json"), []);
  _resources = raw.map((r) => ResourceSchema.parse(r));
  return _resources;
}

function getEnrichments(): Record<string, Enrichment> {
  if (_enrichments) return _enrichments;
  _enrichments = EnrichmentMapSchema.parse(
    readJson(join(GEN_DIR, "enrichments.json"), {}),
  );
  return _enrichments;
}

function getQuizzes(): Record<string, Quiz> {
  if (_quizzes) return _quizzes;
  _quizzes = QuizMapSchema.parse(readJson(join(GEN_DIR, "quizzes.json"), {}));
  return _quizzes;
}

/** All lessons of a track in reading order, each tagged with its module. */
export function flattenLessons(
  track: Track,
): Array<{ lesson: Lesson; module: Module }> {
  const out: Array<{ lesson: Lesson; module: Module }> = [];
  for (const module of [...track.modules].sort((a, b) => a.order - b.order)) {
    for (const lesson of [...module.lessons].sort((a, b) => a.order - b.order)) {
      out.push({ lesson, module });
    }
  }
  return out;
}

export function getAllLessonIds(): string[] {
  return getAllTracks().flatMap((t) =>
    flattenLessons(t).map(({ lesson }) => lesson.id),
  );
}

/** Resolve a lesson with enrichment + quiz + prev/next navigation merged in. */
export function getLessonView(lessonId: string): LessonView | undefined {
  for (const track of getAllTracks()) {
    const flat = flattenLessons(track);
    const idx = flat.findIndex(({ lesson }) => lesson.id === lessonId);
    if (idx === -1) continue;
    const { lesson, module } = flat[idx];
    const prev = flat[idx - 1]?.lesson;
    const next = flat[idx + 1]?.lesson;
    return {
      ...lesson,
      enrichment: getEnrichments()[lessonId],
      quiz: getQuizzes()[lessonId],
      track: {
        id: track.id,
        slug: track.slug,
        title: track.title,
        emoji: track.emoji,
        accent: track.accent,
      },
      module: { id: module.id, slug: module.slug, title: module.title },
      prev: prev ? { id: prev.id, title: prev.title } : undefined,
      next: next ? { id: next.id, title: next.title } : undefined,
    };
  }
  return undefined;
}

/** Serializable summary for the TrackCard client component. */
export function trackCard(track: Track) {
  const flat = flattenLessons(track);
  const stats = trackStats(track);
  return {
    slug: track.slug,
    title: track.title,
    description: track.description,
    level: track.level,
    emoji: track.emoji,
    accent: track.accent,
    lessonIds: flat.map(({ lesson }) => lesson.id),
    moduleCount: stats.moduleCount,
    hours: stats.hours,
  };
}

/** Flat, ordered lesson references across all tracks (for continue-learning). */
export function lessonRefs() {
  return getAllTracks().flatMap((track) =>
    flattenLessons(track).map(({ lesson, module }) => ({
      id: lesson.id,
      title: lesson.title,
      trackSlug: track.slug,
      trackTitle: track.title,
      emoji: track.emoji,
      moduleTitle: module.title,
    })),
  );
}

export function trackStats(track: Track) {
  const flat = flattenLessons(track);
  const minutes = flat.reduce((sum, { lesson }) => sum + lesson.estMinutes, 0);
  return {
    lessonCount: flat.length,
    moduleCount: track.modules.length,
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
  };
}
