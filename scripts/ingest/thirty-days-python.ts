import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Track, Module, Lesson } from "../../src/content/types";
import {
  slugify,
  estimateMinutes,
  rewriteRelativeUrls,
  stripNav,
} from "../lib/markdown";

const REPO = "thirty-days-python";
const SOURCE_REPO = "asabeneh/30-Days-Of-Python";
const LICENSE = "MIT";
const RAW = "https://raw.githubusercontent.com/asabeneh/30-Days-Of-Python/master";
const GH = "https://github.com/asabeneh/30-Days-Of-Python/tree/master";

const TRACK_SLUG = "python";

/** Thematic grouping of the 30 days into 4 modules. */
const MODULE_PLAN: Array<{ slug: string; title: string; days: number[] }> = [
  { slug: "foundations", title: "기초 다지기", days: [1, 2, 3, 4, 5, 6, 7, 8] },
  { slug: "control-and-functions", title: "흐름 제어와 함수", days: [9, 10, 11, 12, 13, 14] },
  { slug: "robust-python", title: "견고한 파이썬", days: [15, 16, 17, 18, 19, 20, 21] },
  { slug: "applied-python", title: "실전 응용", days: [22, 23, 24, 25, 26, 27, 28, 29, 30] },
];

function dayFolder(srcDir: string, day: number): string | undefined {
  const prefix = String(day).padStart(2, "0") + "_Day";
  return readdirSync(srcDir).find((d) => d.startsWith(prefix));
}

/** Clean lesson title from the day folder name, e.g. 05_Day_Lists → "Lists". */
function titleFromFolder(folder: string): string {
  return folder
    .replace(/^\d+_Day_/, "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function readDay(srcDir: string, day: number): { title: string; folder: string; md: string } | null {
  const folder = dayFolder(srcDir, day);
  if (!folder) return null;
  const dir = join(srcDir, folder);

  let md: string;
  if (day === 1) {
    // Day 1's lesson body lives in the root readme, not the folder.
    const readme = readFileSync(join(srcDir, "readme.md"), "utf8");
    const start = readme.indexOf("# 📘 Day 1");
    const end = readme.indexOf("[Day 2 >>]");
    md = start >= 0 ? readme.slice(start, end > start ? end : undefined) : "";
  } else {
    const file = readdirSync(dir).find((f) => /^\d+_.*\.md$/i.test(f));
    md = file ? readFileSync(join(dir, file), "utf8") : "";
  }

  // Drop the source's own leading H1 (e.g. "# 📘 Day 5") — we render our own title.
  md = stripNav(md).replace(/^\s*#\s+.*\n+/, "");
  md = rewriteRelativeUrls(md, `${RAW}/${folder}/`);
  return { title: titleFromFolder(folder), folder, md };
}

export function buildPythonTrack(sourcesDir: string): Track {
  const srcDir = join(sourcesDir, REPO);
  if (!existsSync(srcDir)) throw new Error(`Missing source: ${srcDir}`);

  const modules: Module[] = MODULE_PLAN.map((plan, mi) => {
    const lessons: Lesson[] = plan.days
      .map((day) => {
        const d = readDay(srcDir, day);
        if (!d || d.md.length < 50) return null;
        const lessonSlug = `day-${String(day).padStart(2, "0")}-${slugify(d.title)}`;
        const lesson: Lesson = {
          id: `${TRACK_SLUG}__${plan.slug}__${lessonSlug}`,
          slug: lessonSlug,
          title: `Day ${day}: ${d.title}`,
          order: day,
          estMinutes: estimateMinutes(d.md),
          contentMarkdown: d.md,
          sourceRepo: SOURCE_REPO,
          sourceUrl: `${GH}/${d.folder}`,
          license: LICENSE,
        };
        return lesson;
      })
      .filter((l): l is Lesson => l !== null);

    return {
      id: `${TRACK_SLUG}__${plan.slug}`,
      slug: plan.slug,
      title: plan.title,
      order: mi + 1,
      lessons,
    };
  });

  return {
    id: TRACK_SLUG,
    slug: TRACK_SLUG,
    title: "30일 파이썬 마스터",
    description:
      "변수와 자료형부터 함수·클래스·정규표현식, 그리고 웹 스크래핑·Pandas·API 구축까지. 30개의 실습 중심 레슨으로 파이썬을 처음부터 끝까지 익힙니다.",
    level: "beginner",
    order: 1,
    emoji: "🐍",
    accent: "#3776AB",
    modules,
  };
}
