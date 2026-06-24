import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Track, Module, Lesson } from "../../src/content/types";
import { slugify, estimateMinutes, rewriteRelativeUrls } from "../lib/markdown";

/**
 * AI Engineering track. Two layers:
 *
 * 1. A Korean "인트로" module (authored, content/authored/ai-engineering/*.md) —
 *    a vocabulary/concept-first on-ramp at the application layer, so a learner
 *    who already runs RAG/agents can anchor the precise terms before diving in.
 *
 * 2. The full from-scratch curriculum ingested from
 *    rohitg00/ai-engineering-from-scratch (MIT) — 20 phases / ~503 lessons that
 *    build everything from first principles (linear algebra → backprop →
 *    transformers → LLMs → agents → production). English markdown, ingested
 *    as-is like the python/ml adapters.
 *
 * The intro comes first; the from-scratch phases follow. Supplementary
 * resources (roadmap.sh, aie-book, Anthropic courses, HF courses) are credited
 * on /attributions and surfaced in the resource library.
 */

const TRACK_SLUG = "ai-engineering";

// --- Layer 2: from-scratch repo ---------------------------------------------
const REPO = "ai-engineering-from-scratch";
const SOURCE_REPO = "rohitg00/ai-engineering-from-scratch";
const LICENSE = "MIT";
const RAW_BASE =
  "https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/";
const BLOB_BASE =
  "https://github.com/rohitg00/ai-engineering-from-scratch/blob/main/";

const PHASE_TITLES: Record<string, string> = {
  "00-setup-and-tooling": "환경 설정과 도구",
  "01-math-foundations": "수학 기초",
  "02-ml-fundamentals": "머신러닝 기초",
  "03-deep-learning-core": "딥러닝 핵심",
  "04-computer-vision": "컴퓨터 비전",
  "05-nlp-foundations-to-advanced": "NLP: 기초에서 고급까지",
  "06-speech-and-audio": "음성과 오디오",
  "07-transformers-deep-dive": "트랜스포머 심층",
  "08-generative-ai": "생성형 AI",
  "09-reinforcement-learning": "강화학습",
  "10-llms-from-scratch": "LLM 밑바닥부터",
  "11-llm-engineering": "LLM 엔지니어링",
  "12-multimodal-ai": "멀티모달 AI",
  "13-tools-and-protocols": "도구와 프로토콜",
  "14-agent-engineering": "에이전트 엔지니어링",
  "15-autonomous-systems": "자율 시스템",
  "16-multi-agent-and-swarms": "멀티 에이전트와 스웜",
  "17-infrastructure-and-production": "인프라와 프로덕션",
  "18-ethics-safety-alignment": "윤리·안전·정렬",
  "19-capstone-projects": "캡스톤 프로젝트",
};

// --- Layer 1: authored Korean intro -----------------------------------------
const AUTHORED_DIR = join(
  process.cwd(),
  "content",
  "authored",
  "ai-engineering",
);
const INTRO_SLUG = "intro";

type Source = { repo: string; url: string; license: string };
const SRC = {
  roadmapEng: { repo: "kamranahmedse/developer-roadmap", url: "https://roadmap.sh/ai-engineer", license: "© roadmap.sh · 링크 아웃" },
  roadmapAgents: { repo: "kamranahmedse/developer-roadmap", url: "https://roadmap.sh/ai-agents", license: "© roadmap.sh · 링크 아웃" },
  aieBook: { repo: "chiphuyen/aie-book", url: "https://github.com/chiphuyen/aie-book", license: "© Chip Huyen (O'Reilly) · 링크 아웃" },
  anthropicCourses: { repo: "anthropics/courses", url: "https://github.com/anthropics/courses", license: "CC BY-NC 4.0" },
  hfLLM: { repo: "huggingface/course", url: "https://huggingface.co/learn/llm-course", license: "Apache-2.0" },
  hfAgents: { repo: "huggingface/agents-course", url: "https://huggingface.co/learn/agents-course", license: "Apache-2.0" },
  anthropicAgents: { repo: "anthropic.com", url: "https://www.anthropic.com/research/building-effective-agents", license: "© Anthropic · 링크 아웃" },
} satisfies Record<string, Source>;

type IntroSpec = { slug: string; title: string; source: Source; sourceUrl?: string };
const INTRO_PLAN: IntroSpec[] = [
  { slug: "what-is-ai-engineering", title: "AI 엔지니어링이란 — ML 엔지니어와 뭐가 다른가", source: SRC.roadmapEng },
  { slug: "the-three-pillars", title: "AI 엔지니어링의 세 기둥: 적응·평가·추론", source: SRC.aieBook },
  { slug: "working-on-foundation-models", title: "모델은 어떻게 텍스트를 만드는가 — 샘플링 제어", source: SRC.aieBook },
  { slug: "evaluation-methodology", title: "평가 방법론: 무엇을, 어떻게 믿을 것인가", source: SRC.aieBook },
  { slug: "building-evals", title: "평가 하니스 직접 만들기", source: SRC.anthropicCourses, sourceUrl: "https://github.com/anthropics/courses/tree/master/prompt_evaluations" },
  { slug: "prompt-eng-tutorial", title: "프롬프트 엔지니어링 정석", source: SRC.anthropicCourses, sourceUrl: "https://github.com/anthropics/courses/tree/master/prompt_engineering_interactive_tutorial" },
  { slug: "real-world-prompting", title: "실전: 체이닝·컨텍스트 엔지니어링·인젝션 방어", source: SRC.anthropicCourses, sourceUrl: "https://github.com/anthropics/courses/tree/master/real_world_prompting" },
  { slug: "embeddings-and-retrieval", title: "임베딩과 검색의 원리", source: SRC.hfLLM },
  { slug: "rag-architecture", title: "RAG 아키텍처: 청킹·리랭킹·검색 평가", source: SRC.aieBook },
  { slug: "retrieval-latency-patterns", title: "검색 지연 패턴: 핫/콜드 경로와 비동기 인덱싱", source: SRC.aieBook },
  { slug: "agent-fundamentals", title: "에이전트의 기초: 워크플로우와의 경계", source: SRC.hfAgents, sourceUrl: "https://huggingface.co/learn/agents-course/unit1/introduction" },
  { slug: "building-agents-frameworks", title: "에이전트 구현: smolagents·LangGraph·LlamaIndex 고르기", source: SRC.hfAgents },
  { slug: "effective-agents-patterns", title: "효과적인 에이전트 패턴: 라우팅·오케스트레이터·검증 루프", source: SRC.anthropicAgents },
  { slug: "agent-tracing-eval", title: "에이전트 관측: 트레이싱·궤적 평가·Agentic RAG", source: SRC.hfAgents },
  { slug: "inference-and-deployment", title: "추론 최적화: 지연·비용을 내리는 손잡이", source: SRC.aieBook },
  { slug: "queues-and-idempotency", title: "큐와 Idempotency: 신뢰성 있는 비동기 처리", source: SRC.roadmapAgents },
];

/** Korean-aware estimate (read + quiz + writing task); see prior note. */
function estKoreanMinutes(md: string): number {
  const chars = md.replace(/\s/g, "").length;
  const codeLines = (md.match(/\n/g) || []).length;
  return Math.max(5, Math.min(20, Math.round(chars / 400 + codeLines / 40 + 1.5 + 3)));
}

function titleize(slug: string): string {
  return slug.replace(/^\d+[-_]/, "").split(/[-_]/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

function dirs(path: string): string[] {
  return readdirSync(path).filter((d) => statSync(join(path, d)).isDirectory()).sort();
}

export function buildAiEngineeringTrack(sourcesDir: string): Track {
  let lessonOrder = 0;
  const modules: Module[] = [];

  // Layer 1 — Korean intro module (first).
  const introLessons: Lesson[] = INTRO_PLAN.map((spec) => {
    const path = join(AUTHORED_DIR, `${spec.slug}.md`);
    const body = readFileSync(path, "utf8").trim();
    if (body.length < 200) throw new Error(`Intro body too short: ${path}`);
    lessonOrder += 1;
    return {
      id: `${TRACK_SLUG}__${INTRO_SLUG}__${spec.slug}`,
      slug: spec.slug,
      title: spec.title,
      order: lessonOrder,
      estMinutes: estKoreanMinutes(body),
      contentMarkdown: body,
      sourceRepo: spec.source.repo,
      sourceUrl: spec.sourceUrl ?? spec.source.url,
      license: spec.source.license,
    };
  });
  modules.push({
    id: `${TRACK_SLUG}__${INTRO_SLUG}`,
    slug: INTRO_SLUG,
    title: "00 · 인트로 (한국어): 용어와 개념부터",
    order: 1,
    lessons: introLessons,
  });

  // Layer 2 — from-scratch phases (after the intro).
  const phasesDir = join(sourcesDir, REPO, "phases");
  if (!existsSync(phasesDir)) throw new Error(`Missing source: ${phasesDir}`);
  dirs(phasesDir).forEach((phase, pi) => {
    const phaseDir = join(phasesDir, phase);
    const lessons: Lesson[] = dirs(phaseDir)
      .map((lessonName) => {
        const docPath = join(phaseDir, lessonName, "docs", "en.md");
        if (!existsSync(docPath)) return null;
        const raw = readFileSync(docPath, "utf8");
        const h1 = raw.match(/^#\s+(.+)$/m);
        const title = h1 ? h1[1].trim() : titleize(lessonName);
        const rel = `phases/${phase}/${lessonName}/docs/`;
        let body = raw.replace(/^#\s+.+\r?\n/, "");
        body = rewriteRelativeUrls(body, RAW_BASE + rel).trim();
        if (body.length < 200) return null;
        const tm = raw.match(/\*\*Time:\*\*\s*~?\s*(\d+)\s*min/i);
        const estMinutes = tm ? Math.max(5, Math.min(180, parseInt(tm[1], 10))) : estimateMinutes(body);
        lessonOrder += 1;
        const lessonSlug = slugify(lessonName);
        return {
          id: `${TRACK_SLUG}__${phase}__${lessonSlug}`,
          slug: lessonSlug,
          title,
          order: lessonOrder,
          estMinutes,
          contentMarkdown: body,
          sourceRepo: SOURCE_REPO,
          sourceUrl: BLOB_BASE + rel + "en.md",
          license: LICENSE,
        } as Lesson;
      })
      .filter((l): l is Lesson => l !== null);
    if (lessons.length === 0) return;
    modules.push({
      id: `${TRACK_SLUG}__${phase}`,
      slug: phase,
      title: PHASE_TITLES[phase] ?? titleize(phase),
      order: pi + 2,
      lessons,
    });
  });

  return {
    id: TRACK_SLUG,
    slug: TRACK_SLUG,
    title: "AI 엔지니어링: 밑바닥부터 (From Scratch)",
    description:
      "용어와 개념부터 한국어 인트로로 워밍업한 뒤, 수학 1원리부터 직접 구현하며 올라가는 정식 커리큘럼으로 들어갑니다. 선형대수·역전파·토크나이저·어텐션을 손으로 만들고, 트랜스포머·LLM·RAG·에이전트·멀티 에이전트 스웜, 인프라·운영·정렬까지 — 20개 phase, 500여 개 레슨. (from-scratch 본편: rohitg00/ai-engineering-from-scratch, MIT)",
    level: "advanced",
    order: 3,
    emoji: "🛠️",
    accent: "#0EA5E9",
    modules,
  };
}
