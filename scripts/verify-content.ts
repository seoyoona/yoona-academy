import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Enrichment, Quiz, Track, Translation } from "../src/content/types";
import {
  isMitVideoLesson,
  stripMarkupUrlsAndCode,
  validateMitLessonQuality,
} from "./lib/mit-ai-notes";

const ROOT = process.cwd();
const GEN = join(ROOT, "content", "generated");
const TRACKS = join(GEN, "tracks");
const ML_TRACK = join(TRACKS, "ml-engineering.json");
const MIT_TRACK = join(TRACKS, "mit-ai.json");
const TRANSLATIONS = join(GEN, "translations.json");
const ENRICHMENTS = join(GEN, "enrichments.json");
const QUIZZES = join(GEN, "quizzes.json");

type Failure = {
  check: string;
  detail: string;
};

function readJson<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sourceHash(title: string, content: string): string {
  return createHash("sha256").update(`${title} ${content}`).digest("hex").slice(0, 16);
}

function flatten(track: Track) {
  return track.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ module, lesson })),
  );
}

function stripMarkdownCode(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>]+>/g, " ");
}

function hasKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

function likelyEnglishSentence(line: string): boolean {
  const clean = line
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!clean) return false;
  if (clean.length < 24) return false;
  if (hasKorean(clean)) return false;
  const words = clean.match(/[A-Za-z]{3,}/g) ?? [];
  if (words.length < 5) return false;
  return /\b(the|and|or|to|with|for|from|that|this|will|we|our|can|use|using|model|data|cluster|service|workflow|repository|machine|learning|production)\b/i.test(clean);
}

function main() {
  const failures: Failure[] = [];
  const track = readJson<Track>(ML_TRACK);
  const translations = readJson<Record<string, Translation>>(TRANSLATIONS);
  const lessons = flatten(track);

  const expectedModules = [
    "foundations",
    "setup",
    "development",
    "implementation-internals",
    "serving",
    "testing-quality",
    "deployment-ops",
    "production",
  ];
  const moduleSlugs = new Set(track.modules.map((module) => module.slug));
  for (const slug of expectedModules) {
    if (!moduleSlugs.has(slug)) {
      failures.push({
        check: "ml module coverage",
        detail: `missing module "${slug}"`,
      });
    }
  }

  if (lessons.length < 40) {
    failures.push({
      check: "ml lesson coverage",
      detail: `expected at least 40 ML lessons after source expansion, found ${lessons.length}`,
    });
  }

  const sourceNeedles = [
    "madewithml/config.py",
    "madewithml/data.py",
    "madewithml/models.py",
    "madewithml/utils.py",
    "madewithml/train.py",
    "madewithml/tune.py",
    "madewithml/evaluate.py",
    "madewithml/predict.py",
    "madewithml/serve.py",
    "tests/code/test_data.py",
    "tests/code/test_train.py",
    "tests/code/test_tune.py",
    "tests/code/test_predict.py",
    "tests/model/test_behavioral.py",
    "tests/data/test_dataset.py",
    "deploy/cluster_env.yaml",
    "deploy/cluster_compute.yaml",
    "deploy/jobs/workloads.yaml",
    "deploy/jobs/workloads.sh",
    "deploy/services/serve_model.yaml",
    "deploy/services/serve_model.py",
    ".github/workflows/workloads.yaml",
    ".github/workflows/serve.yaml",
    "notebooks/madewithml.ipynb",
  ];
  const combinedContent = lessons
    .map(({ lesson }) => `${lesson.title}\n${lesson.sourceUrl}\n${lesson.contentMarkdown}`)
    .join("\n\n");
  for (const needle of sourceNeedles) {
    if (!combinedContent.includes(needle)) {
      failures.push({
        check: "ml source coverage",
        detail: `missing source coverage for ${needle}`,
      });
    }
  }

  const duplicateIds = lessons
    .map(({ lesson }) => lesson.id)
    .filter((id, index, arr) => arr.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    failures.push({
      check: "lesson id uniqueness",
      detail: `duplicate lesson ids: ${[...new Set(duplicateIds)].join(", ")}`,
    });
  }

  for (const { lesson } of lessons) {
    const tr = translations[lesson.id];
    if (!tr) {
      failures.push({
        check: "ml translation coverage",
        detail: `missing translation for ${lesson.id}`,
      });
      continue;
    }
    const expectedHash = sourceHash(lesson.title, lesson.contentMarkdown);
    if (tr.hash !== expectedHash) {
      failures.push({
        check: "ml translation freshness",
        detail: `${lesson.id} hash ${tr.hash} does not match source ${expectedHash}`,
      });
    }
    if (!hasKorean(`${tr.title}\n${stripMarkdownCode(tr.contentMarkdown)}`)) {
      failures.push({
        check: "ml translation language",
        detail: `${lesson.id} has no Korean prose outside code blocks`,
      });
    }
    const englishLines = stripMarkdownCode(tr.contentMarkdown)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(likelyEnglishSentence);
    if (englishLines.length > 0) {
      failures.push({
        check: "ml translation language",
        detail: `${lesson.id} contains likely untranslated prose: ${englishLines
          .slice(0, 2)
          .join(" / ")}`,
      });
    }
  }

  verifyMitAi(failures);

  if (failures.length > 0) {
    console.error(`Content verification failed (${failures.length}):`);
    for (const failure of failures) {
      console.error(`- ${failure.check}: ${failure.detail}`);
    }
    process.exit(1);
  }

  console.log(
    `Content verification passed: ${lessons.length} ML lessons, ${track.modules.length} modules, translations fresh; MIT AI content verified.`,
  );
}

function verifyMitAi(failures: Failure[]) {
  const track = readJson<Track>(MIT_TRACK);
  const enrichments = readJson<Record<string, Enrichment>>(ENRICHMENTS);
  const quizzes = readJson<Record<string, Quiz>>(QUIZZES);
  const lessons = flatten(track);
  const videoLessons = lessons.filter(({ lesson }) => isMitVideoLesson(lesson));

  if (lessons.length !== 124) {
    failures.push({
      check: "mit lesson coverage",
      detail: `expected 124 MIT lessons, found ${lessons.length}`,
    });
  }
  if (videoLessons.length !== 103) {
    failures.push({
      check: "mit video coverage",
      detail: `expected 103 MIT video lessons, found ${videoLessons.length}`,
    });
  }

  for (const { lesson } of lessons) {
    const enrichment = enrichments[lesson.id];
    if (!enrichment) {
      failures.push({
        check: "mit enrichment coverage",
        detail: `missing enrichment for ${lesson.id}`,
      });
    } else {
      if (!hasKorean(stripMarkupUrlsAndCode(enrichment.summary))) {
        failures.push({
          check: "mit enrichment language",
          detail: `${lesson.id} summary has no Korean prose`,
        });
      }
      if (enrichment.objectives.length < 2) {
        failures.push({
          check: "mit enrichment objectives",
          detail: `${lesson.id} has fewer than 2 objectives`,
        });
      }
      if (enrichment.keyConcepts.length < 3) {
        failures.push({
          check: "mit enrichment concepts",
          detail: `${lesson.id} has fewer than 3 key concepts`,
        });
      }
    }

    const quiz = quizzes[lesson.id];
    if (!quiz || quiz.questions.length < 3) {
      failures.push({
        check: "mit quiz coverage",
        detail: `${lesson.id} has fewer than 3 quiz questions`,
      });
    }

    if (isMitVideoLesson(lesson)) {
      for (const detail of validateMitLessonQuality(lesson.id, lesson.contentMarkdown)) {
        failures.push({
          check: "mit lecture note quality",
          detail: `${lesson.id}: ${detail}`,
        });
      }
    }
  }
}

main();
