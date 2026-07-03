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
 * v1 = Phase 1~3 (웹구조·백엔드·DB), v2 = Phase 4~6 (BaaS·AWS·시스템설계).
 * 6 모듈 30 레슨. Phase 1의 MDN 2레슨만 인제스트, 나머지는 PM 시선 직필.
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
  {
    slug: "baas-mvp",
    title: "Phase 4 · BaaS / 빠른 MVP",
    lessons: [
      {
        kind: "authored",
        slug: "baas-why-fast",
        title: "BaaS가 왜 빠른가 — 직접 백엔드 vs Firebase/Supabase",
        estMinutes: 25,
        sourceUrl: "https://supabase.com/docs",
      },
      {
        kind: "authored",
        slug: "supabase-auth-crud",
        title: "Supabase로 로그인+CRUD — Auth·Postgres·Storage 한 세트",
        estMinutes: 30,
        sourceUrl: "https://supabase.com/docs/guides/getting-started",
      },
      {
        kind: "authored",
        slug: "firebase-push",
        title: "앱 푸시는 앱이 직접 안 보낸다 — Firebase/FCM 구조",
        estMinutes: 25,
        sourceUrl: "https://firebase.google.com/docs/cloud-messaging",
      },
      {
        kind: "authored",
        slug: "rls-row-security",
        title: "RLS(Row Level Security) — DB 수준 권한 (BaaS에서 꼭)",
        estMinutes: 30,
        sourceUrl: "https://supabase.com/docs/guides/database/postgres/row-level-security",
      },
      {
        kind: "authored",
        slug: "baas-limits-migration",
        title: "BaaS의 한계 — 언제 자체 백엔드로 이관하나",
        estMinutes: 25,
        sourceUrl: "https://supabase.com/docs",
      },
    ],
  },
  {
    slug: "aws-cloud",
    title: "Phase 5 · AWS / Cloud",
    lessons: [
      {
        kind: "authored",
        slug: "why-cloud",
        title: "클라우드가 왜 필요한가 — 서버·DB·저장소·네트워크를 빌리는 일",
        estMinutes: 25,
        sourceUrl: "https://aws.amazon.com/what-is-aws/",
      },
      {
        kind: "authored",
        slug: "ec2-s3-rds",
        title: "EC2·S3·RDS — 서버·파일창고·DB를 빌리는 3가지",
        estMinutes: 30,
        sourceUrl: "https://docs.aws.amazon.com/",
      },
      {
        kind: "authored",
        slug: "vpc-iam-security",
        title: "VPC·IAM·보안그룹 — 사설망과 권한",
        estMinutes: 30,
        sourceUrl: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html",
      },
      {
        kind: "authored",
        slug: "dns-ssl-https",
        title: "DNS·SSL·HTTPS — 도메인과 인증서 (사용자가 안전하게 들어오게)",
        estMinutes: 25,
        sourceUrl: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/welcome.html",
      },
      {
        kind: "authored",
        slug: "env-and-deploy",
        title: "환경변수·배포 — .env 세팅값 표 + Vercel/Render/AWS 배포 방식",
        estMinutes: 30,
        sourceUrl: "https://docs.aws.amazon.com/",
      },
    ],
  },
  {
    slug: "system-design",
    title: "Phase 6 · 시스템 설계 / 상담력",
    lessons: [
      {
        kind: "authored",
        slug: "monolith-vs-microservice",
        title: "monolith vs microservice — 처음엔 하나로",
        estMinutes: 25,
        sourceUrl: "https://github.com/donnemartin/system-design-primer",
      },
      {
        kind: "authored",
        slug: "sync-vs-async",
        title: "동기 vs 비동기 — 큐·배치·웹훅 (고객 요구 → 구조 번역)",
        estMinutes: 30,
        sourceUrl: "https://github.com/donnemartin/system-design-primer",
      },
      {
        kind: "authored",
        slug: "cache-index-scale",
        title: "캐시·인덱스·확장 — 느려지기 시작할 때",
        estMinutes: 30,
        sourceUrl: "https://github.com/donnemartin/system-design-primer",
      },
      {
        kind: "authored",
        slug: "read-real-codebase",
        title: "실전 폴더 구조 읽기 — FastAPI 템플릿을 예로",
        estMinutes: 30,
        sourceUrl: "https://github.com/fastapi/full-stack-fastapi-template",
      },
      {
        kind: "authored",
        slug: "consulting-practice",
        title: "상담 실습 — 고객 요구 → 아키텍처·견적·리스크·개발안",
        estMinutes: 35,
        sourceUrl: "https://github.com/practical-tutorials/project-based-learning",
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
