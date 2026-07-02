import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Track, Lesson } from "../src/content/types";

/**
 * 콘텐츠 품질 게이트.
 *
 * 과거 mit-ai / ml-engineering 트랙이 얇게 출시돼 여러 번 보강해야 했던 실패를
 * 구조적으로 막는다. ai-consultant 트랙의 모든 레슨이 길이·구조·출처 기준을
 * 넘기지 못하면 레슨 이름과 함께 non-zero exit(CI/빌드 실패)한다.
 *
 * `--report` 모드는 전 트랙을 스캔해 여전히 얇은 레슨을 나열만 한다(gate가
 * 닫지 않는 관측 모드 — 보강 부채를 한눈에).
 */

const ROOT = process.cwd();
const TRACKS_DIR = join(ROOT, "content", "generated", "tracks");
const GATED_TRACK = "ai-consultant";
const REPORT_MODE = process.argv.includes("--report");

// 직핀(authored) 레슨 기준 — ai-engineering 골드스탠다드 관측 min(3,167) 바로 위.
const AUTHORED_MIN_CHARS = 3500;
// 인제스트(mdn 등) 레슨 기준 — 원문 본문 + 래핑 최소치.
const INGESTED_MIN_CHARS = 2000;
// 직핀 레슨 필수 구조: `##` 섹션 개수 하한.
const AUTHORED_MIN_HEADINGS = 4;
// 관측 모드의 '얇음' 임계치.
const THIN_REPORT_THRESHOLD = 3500;

const isAuthored = (l: Lesson) =>
  l.license.toLowerCase().includes("original") || l.sourceRepo.includes("Yoona");

function loadTracks(): Track[] {
  return readdirSync(TRACKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(TRACKS_DIR, f), "utf8")) as Track);
}

function countH2(md: string): number {
  return (md.match(/^##\s/gm) || []).length;
}

function hasWorkedExample(md: string): boolean {
  return (
    /```/.test(md) || // 코드 블록
    /\|.*\|/.test(md) || // 표
    /예시|시나리오|예:|예 :|worked example/i.test(md)
  );
}

function checkLesson(l: Lesson): string[] {
  const problems: string[] = [];
  const min = isAuthored(l) ? AUTHORED_MIN_CHARS : INGESTED_MIN_CHARS;
  const len = l.contentMarkdown.length;
  if (len < min) {
    problems.push(`본문 ${len}자 < ${min} (너무 짧음${len === 0 ? ", authored 파일 누락 가능" : ""})`);
  }
  if (!l.sourceUrl) problems.push("sourceUrl 누락");
  if (!l.license) problems.push("license 누락");
  if (isAuthored(l)) {
    const h2 = countH2(l.contentMarkdown);
    if (h2 < AUTHORED_MIN_HEADINGS) {
      problems.push(`## 섹션 ${h2}개 < ${AUTHORED_MIN_HEADINGS} (템플릿 구조 부족)`);
    }
    if (!hasWorkedExample(l.contentMarkdown)) {
      problems.push("worked example(코드/표/예시) 부재");
    }
  }
  return problems;
}

function main() {
  const tracks = loadTracks();

  if (REPORT_MODE) {
    console.log("📊 전 트랙 얇은 레슨 리포트 (관측 전용, 실패 없음)\n");
    for (const t of tracks) {
      const thin: { id: string; len: number }[] = [];
      for (const m of t.modules) {
        for (const l of m.lessons) {
          if (l.contentMarkdown.length < THIN_REPORT_THRESHOLD) {
            thin.push({ id: l.id, len: l.contentMarkdown.length });
          }
        }
      }
      if (thin.length) {
        console.log(
          `${t.slug} — ${thin.length}개 얇음 (<${THIN_REPORT_THRESHOLD}자)`,
        );
        for (const { id, len } of thin) console.log(`   ${len.toString().padStart(5)}자  ${id}`);
      }
    }
    return;
  }

  const gate = tracks.find((t) => t.slug === GATED_TRACK);
  if (!gate) {
    console.error(`✗ 게이트 대상 트랙 '${GATED_TRACK}' 가 content/generated/tracks/에 없습니다. pnpm ingest 먼저.`);
    process.exit(1);
  }

  const violations: { id: string; problems: string[] }[] = [];
  for (const m of gate.modules) {
    for (const l of m.lessons) {
      const problems = checkLesson(l);
      if (problems.length) violations.push({ id: l.id, problems });
    }
  }

  if (violations.length === 0) {
    const n = gate.modules.reduce((a, m) => a + m.lessons.length, 0);
    console.log(`✓ '${GATED_TRACK}' 품질 게이트 통과 — ${n}레슨 모두 기준 충족`);
    return;
  }

  console.error(`✗ '${GATED_TRACK}' 품질 게이트 실패 — ${violations.length}레슨 미달:\n`);
  for (const { id, problems } of violations) {
    console.error(`  ${id}`);
    for (const p of problems) console.error(`      • ${p}`);
  }
  console.error(
    `\n직핀 레슨은 골드스탠다드 템플릿(진단서론/핵심개념/비교표/worked example/실패모드/단어장/산출물/더보기), ${AUTHORED_MIN_CHARS}자 이상. 인제스트는 ${INGESTED_MIN_CHARS}자 이상.`,
  );
  process.exit(1);
}

main();
