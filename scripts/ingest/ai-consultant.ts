import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Track, Module, Lesson } from "../../src/content/types";

/**
 * AI Consultant 코스 — PM/AI consultant가 개발 전반을 이해해 고객 요구사항을
 * 기술 구조로 번역·상담하는 힘을 기르는 코스. (ai/ml engineering 트랙과는 성격이 다름)
 *
 * 하이브리드 구성:
 *  - authored 레슨: content/authored/ai-consultant/<slug>.md 의 한국어 마크다운.
 *    The Odin Project / AWS docs 등 복사 불가 소스는 구조(주제순서)만 참고해
 *    PM 시선으로 직접 집필하고, sourceUrl로 원문을 링크한다.
 *  - mdn 레슨: mdn/content에서 클론한 CC-BY-SA 2.5 글을 frontmatter/매크로만
 *    제거해 영문 그대로 싣는다(한국어는 translate 단계에서 오버레이).
 *
 * v1 = Phase 1~3 (웹구조·백엔드·DB), 3 모듈 15 레슨.
 */

const TRACK_SLUG = "ai-consultant";
const SOURCES = join(process.cwd(), "content", "sources");
const AUTHORED = join(process.cwd(), "content", "authored", "ai-consultant");
const MDN_BASE = join(
  SOURCES,
  "mdn-content",
  "files",
  "en-us",
  "learn_web_development",
);

const MDN_URL_BASE =
  "https://developer.mozilla.org/en-US/docs/Learn_web_development";

// --- 레슨 종류 ---------------------------------------------------------------
type AuthoredSpec = {
  kind: "authored";
  slug: string;
  title: string;
  estMinutes: number;
  /** 원문/참고 링크 — 복사 불가 소스는 이쪽으로 보낸다. */
  sourceUrl: string;
  sourceRepo?: string;
};
type MdnSpec = {
  kind: "mdn";
  slug: string;
  title: string;
  estMinutes: number;
  /** mdn-content 내 상대 경로 (index.md 까지). */
  mdnRelPath: string;
  /** MDN 사이트 URL. */
  mdnUrl: string;
};
type LessonSpec = AuthoredSpec | MdnSpec;
type ModuleSpec = { slug: string; title: string; lessons: LessonSpec[] };

const PLAN: ModuleSpec[] = [
  {
    slug: "web-app-structure",
    title: "Phase 1 · 웹/앱 구조 감 잡기",
    lessons: [
      {
        kind: "authored",
        slug: "service-layers",
        title: "서비스는 왜 화면·서버·DB로 나뉘는가",
        estMinutes: 25,
        sourceUrl: "https://www.theodinproject.com/paths/foundations",
        sourceRepo: "The Odin Project (구조 참고)",
      },
      {
        kind: "mdn",
        slug: "how-the-web-works",
        title: "웹은 어떻게 작동하나 (MDN)",
        estMinutes: 20,
        mdnRelPath: "getting_started/web_standards/how_the_web_works/index.md",
        mdnUrl: `${MDN_URL_BASE}/Getting_started/Web_standards/How_the_web_works`,
      },
      {
        kind: "mdn",
        slug: "how-browsers-load",
        title: "브라우저는 웹을 어떻게 띄우나 (MDN)",
        estMinutes: 20,
        mdnRelPath:
          "getting_started/web_standards/how_browsers_load_websites/index.md",
        mdnUrl: `${MDN_URL_BASE}/Getting_started/Web_standards/How_browsers_load_websites`,
      },
      {
        kind: "authored",
        slug: "html-css-js-and-cloud",
        title: "HTML/CSS/JS에서 클라우드까지 — 한눈에 보는 층위",
        estMinutes: 25,
        sourceUrl: "https://www.theodinproject.com/paths/foundations",
        sourceRepo: "The Odin Project (구조 참고)",
      },
      {
        kind: "authored",
        slug: "git-and-deploy",
        title: "Git/GitHub — 코드가 어떻게 관리되고 배포되나",
        estMinutes: 25,
        sourceUrl:
          "https://www.theodinproject.com/paths/foundations/courses/foundations",
        sourceRepo: "The Odin Project (구조 참고)",
      },
    ],
  },
  {
    slug: "backend-api",
    title: "Phase 2 · 백엔드/API 이해",
    lessons: [
      {
        kind: "authored",
        slug: "why-api",
        title: "API가 왜 필요한가 — REST·JSON·엔드포인트",
        estMinutes: 25,
        sourceUrl:
          "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_website",
      },
      {
        kind: "authored",
        slug: "crud",
        title: "CRUD — 생성·조회·수정·삭제가 실제로 어떻게 도나",
        estMinutes: 25,
        sourceUrl: "https://www.theodinproject.com/paths/full-stack-ruby-on-rails/courses/ruby-on-rails",
      },
      {
        kind: "authored",
        slug: "auth-and-secrets",
        title: "로그인과 인가 — session·token·JWT, 왜 시크릿을 달라 하는가",
        estMinutes: 30,
        sourceUrl: "https://supabase.com/docs/guides/auth",
      },
      {
        kind: "authored",
        slug: "client-vs-server",
        title: "클라이언트사이드 vs 서버사이드 — 코드가 어디서 도나",
        estMinutes: 25,
        sourceUrl:
          "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side",
      },
      {
        kind: "authored",
        slug: "backend-vocab",
        title: "백엔드 단어장 — env·webhook·파일업로드·에러로그",
        estMinutes: 25,
        sourceUrl: "https://www.theodinproject.com/paths/foundations",
      },
    ],
  },
  {
    slug: "db-postgres",
    title: "Phase 3 · DB / Postgres",
    lessons: [
      {
        kind: "authored",
        slug: "data-structure",
        title: "데이터는 어디에 어떻게 저장되나 — table·row·PK·FK",
        estMinutes: 25,
        sourceUrl: "https://www.freecodecamp.org/learn/relational-database/",
      },
      {
        kind: "authored",
        slug: "sql-reading",
        title: "SQL 읽기 — SELECT·JOIN·INDEX (개발자의 쿼리 이해하기)",
        estMinutes: 25,
        sourceUrl: "https://www.postgresql.org/docs/",
      },
      {
        kind: "authored",
        slug: "erd-modeling",
        title: "ERD — 회원·주문·결제·알림 테이블로 쪼개기 (PM 상담력 핵심)",
        estMinutes: 30,
        sourceUrl: "https://www.freecodecamp.org/learn/relational-database/",
      },
      {
        kind: "authored",
        slug: "transaction-migration",
        title: "트랜잭션·마이그레이션·스키마·백업 — 개발자 단어장",
        estMinutes: 25,
        sourceUrl: "https://www.postgresql.org/docs/",
      },
      {
        kind: "authored",
        slug: "managed-db-baas",
        title: "DB를 직접 안 굴릴 때 — RDS·Supabase·BaaS",
        estMinutes: 25,
        sourceUrl: "https://supabase.com/docs",
      },
    ],
  },
];

// --- 본문 로더 ---------------------------------------------------------------
function loadAuthored(slug: string): string {
  const file = join(AUTHORED, `${slug}.md`);
  if (!existsSync(file)) {
    console.warn(`⚠ authored 누락: ${file} (빈 본문으로 생성 → 게이트가 잡음)`);
    return "";
  }
  return readFileSync(file, "utf8").trim();
}

/** MDN index.md에서 YAML frontmatter와 {{Macro}} 줄을 제거하고 본문만 반환. */
function loadMdn(relPath: string): string {
  const file = join(MDN_BASE, relPath);
  const raw = readFileSync(file, "utf8");
  // 1) YAML frontmatter 제거
  const noFront = raw.replace(/^---\n[\s\S]*?\n---\n*/, "");
  // 2) {{Macro ...}} 줄 제거 (NextMenu/PreviousMenu 등)
  const noMacros = noFront
    .split("\n")
    .filter((line) => !/^\s*\{\{[A-Z][^}]*\}\}\s*$/.test(line))
    .join("\n");
  return noMacros.trim();
}

function buildLesson(moduleSlug: string, spec: LessonSpec, order: number): Lesson {
  const id = `${TRACK_SLUG}__${moduleSlug}__${spec.slug}`;
  if (spec.kind === "authored") {
    return {
      id,
      slug: spec.slug,
      title: spec.title,
      order,
      estMinutes: spec.estMinutes,
      contentMarkdown: loadAuthored(spec.slug),
      sourceRepo: spec.sourceRepo ?? "Original (Yoona)",
      sourceUrl: spec.sourceUrl,
      license: "Original (c) Yoona",
    };
  }
  return {
    id,
    slug: spec.slug,
    title: spec.title,
    order,
    estMinutes: spec.estMinutes,
    contentMarkdown: loadMdn(spec.mdnRelPath),
    sourceRepo: "MDN Web Docs",
    sourceUrl: spec.mdnUrl,
    license: "CC-BY-SA-2.5",
  };
}

function buildModule(spec: ModuleSpec, order: number): Module {
  return {
    id: `${TRACK_SLUG}__${spec.slug}`,
    slug: spec.slug,
    title: spec.title,
    order,
    lessons: spec.lessons.map((l, i) => buildLesson(spec.slug, l, i + 1)),
  };
}

export function buildAiConsultantTrack(): Track {
  return {
    id: TRACK_SLUG,
    slug: TRACK_SLUG,
    title: "AI Consultant — 개발 전반 이해",
    description:
      "PM/AI consultant가 고객 요구사항을 기술 구조로 번역하는 힘을 기르는 코스. 웹/앱 구조, 백엔드/API, DB/Postgres를 거쳐 상담에 바로 쓰는 언어로 바꾼다.",
    level: "beginner",
    order: 5,
    emoji: "🧭",
    accent: "#0ea5e9",
    modules: PLAN.map((m, i) => buildModule(m, i + 1)),
  };
}
