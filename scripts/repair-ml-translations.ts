import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Lesson, Track, Translation } from "../src/content/types";

const ROOT = process.cwd();
const GEN = join(ROOT, "content", "generated");
const TRACK = join(GEN, "tracks", "ml-engineering.json");
const OUT = join(GEN, "translations.json");
const MODEL = "manual:ml-code-wrapper-ko";

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

function splitFencedBlocks(markdown: string): Array<{ fenced: boolean; text: string }> {
  const parts: Array<{ fenced: boolean; text: string }> = [];
  let cursor = 0;
  const re = /```[\s\S]*?```/g;
  for (const match of markdown.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ fenced: false, text: markdown.slice(cursor, index) });
    parts.push({ fenced: true, text: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < markdown.length) parts.push({ fenced: false, text: markdown.slice(cursor) });
  return parts;
}

function translateTemplateProse(prose: string): string {
  return prose
    .replace(
      /This lesson opens the upstream source file `([^`]+)` and reads it as part of the production ML system, not as an isolated snippet\./g,
      "이 레슨은 upstream 소스 파일 `$1`을 열어, 고립된 코드 조각이 아니라 프로덕션 ML 시스템의 일부로 읽습니다.",
    )
    .replace(
      /Use it to connect the high-level course section to the exact implementation boundary that runs in the repository\./g,
      "상위 코스 개념이 실제 저장소에서 실행되는 구현 경계와 어떻게 연결되는지 확인하는 데 사용하세요.",
    )
    .replace(/## Source file: `([^`]+)`/g, "## 소스 파일: `$1`")
    .replace(
      /This lesson points to the upstream exploratory notebook `([^`]+)`\. The raw notebook JSON is intentionally not embedded verbatim because the useful learning surface is the notebook flow and its executable cells\./g,
      "이 레슨은 upstream 탐색 노트북 `$1`을 가리킵니다. 원본 notebook JSON은 그대로 넣지 않습니다. 학습에 유용한 표면은 JSON 구조가 아니라 노트북의 흐름과 실행 가능한 셀입니다.",
    )
    .replace(/^- Path: `([^`]+)`$/gm, "- 경로: `$1`")
    .replace(/^- Markdown cells: (\d+)$/gm, "- Markdown 셀: $1개")
    .replace(/^- Code cells: (\d+)$/gm, "- 코드 셀: $1개")
    .replace(/^- Upstream notebook: \[([^\]]+)\]\(([^)]+)\)$/gm, "- Upstream 노트북: [$1]($2)")
    .replace(
      /Read the notebook alongside the script lessons: the notebook is the exploration surface, while the Python modules are the productionized execution surface\./g,
      "노트북은 스크립트 레슨과 나란히 읽으세요. 노트북은 탐색 표면이고, Python 모듈은 프로덕션화된 실행 표면입니다.",
    );
}

function translateDeterministic(markdown: string): string {
  return splitFencedBlocks(markdown)
    .map((part) => (part.fenced ? part.text : translateTemplateProse(part.text)))
    .join("");
}

function repairKnownLeftovers(translation: Translation): Translation {
  return {
    ...translation,
    contentMarkdown: translation.contentMarkdown.replace(
      "We'll start by setting up our cluster with the environment and compute configurations.",
      "먼저 환경 및 컴퓨트 구성으로 클러스터를 설정합니다.",
    ),
  };
}

function needsSeed(lesson: Lesson, translation: Translation | undefined): boolean {
  if (!translation) return true;
  return translation.hash !== hashOf(lesson.title, lesson.contentMarkdown);
}

function isTemplateSeedable(lesson: Lesson): boolean {
  if (lesson.sourceUrl?.startsWith("https://madewithml.com/courses/mlops/")) {
    return false;
  }
  return (
    lesson.id.includes("__implementation-internals__") ||
    lesson.id.includes("__testing-quality__") ||
    lesson.id.includes("__deployment-ops__")
  );
}

function main() {
  const track = readJson<Track>(TRACK, null as unknown as Track);
  const translations = readJson<Record<string, Translation>>(OUT, {});
  const generatedAt = new Date().toISOString();
  let repaired = 0;
  let seeded = 0;
  const skipped: string[] = [];

  for (const { lesson } of flatten(track)) {
    const current = translations[lesson.id];
    if (current) {
      const next = repairKnownLeftovers(current);
      if (next.contentMarkdown !== current.contentMarkdown) {
        translations[lesson.id] = next;
        repaired += 1;
      }
    }

    if (!needsSeed(lesson, translations[lesson.id])) continue;
    if (!isTemplateSeedable(lesson)) {
      skipped.push(lesson.id);
      continue;
    }

    translations[lesson.id] = {
      title: lesson.title,
      contentMarkdown: translateDeterministic(lesson.contentMarkdown),
      hash: hashOf(lesson.title, lesson.contentMarkdown),
      model: MODEL,
      generatedAt,
    };
    seeded += 1;
  }

  writeFileSync(OUT, JSON.stringify(translations, null, 2) + "\n");

  console.log(`Repaired ${repaired} existing ML translations.`);
  console.log(`Seeded ${seeded} deterministic ML source-file translations.`);
  if (skipped.length > 0) {
    console.log("Skipped non-template stale/missing ML lessons:");
    for (const id of skipped) console.log(`- ${id}`);
  }
}

main();
