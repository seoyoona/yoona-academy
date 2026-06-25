import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Track, Module, Lesson } from "../../src/content/types";

/**
 * MIT AI 코스 — MIT OpenCourseWare(ocw.mit.edu)에 공개된 AI/ML/딥러닝 강의를
 * 입문 → 핵심 → 딥러닝 → 응용 순으로 큐레이션한 한국어 풀코스.
 *
 * 모든 레슨은 authored(content/authored/mit-ai/*.md) — 각 레슨이 OCW 강의 하나를
 * 한국어로 안내한다(무엇을 배우나 · 핵심 개념 · 대상 · 학습 팁 · 원본 링크).
 * 본문은 우리가 직접 쓴 가이드이고, 강의 자료의 출처/저작권은 OCW로 귀속한다.
 *
 * OCW 강의 자료의 라이선스는 Creative Commons BY-NC-SA 4.0.
 */

const TRACK_SLUG = "mit-ai";
const SOURCE_REPO = "MIT OpenCourseWare";
const LICENSE = "CC BY-NC-SA 4.0";

const AUTHORED_DIR = join(process.cwd(), "content", "authored", "mit-ai");

type LessonSpec = { slug: string; title: string; ocwUrl: string };
type ModuleSpec = { slug: string; title: string; lessons: LessonSpec[] };

/** 강의 메타 — 슬러그는 authored 마크다운 파일명과 1:1로 일치한다. */
const PLAN: ModuleSpec[] = [
  {
    slug: "intro",
    title: "00 · 시작하기: 왜 MIT OCW로 AI를 배우나",
    lessons: [
      { slug: "orientation", title: "오리엔테이션 — 이 코스 사용법과 학습 경로", ocwUrl: "https://ocw.mit.edu/" },
      { slug: "ai-101", title: "AI 101 — 배경지식 0에서 출발하기 (RES.6-013)", ocwUrl: "https://ocw.mit.edu/courses/res-6-013-ai-101-fall-2021/" },
      { slug: "foundation-models", title: "Foundation Models & Generative AI — 큰 그림 (6.S087)", ocwUrl: "https://ocw.mit.edu/courses/6-s087-foundation-models-and-generative-ai-january-iap-2024/" },
    ],
  },
  {
    slug: "core-ai-ml",
    title: "01 · 핵심 AI / 머신러닝",
    lessons: [
      { slug: "artificial-intelligence-6034", title: "Artificial Intelligence — 고전 AI의 정석 (6.034)", ocwUrl: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" },
      { slug: "intro-machine-learning-6036", title: "Introduction to Machine Learning (6.036)", ocwUrl: "https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-fall-2020/" },
      { slug: "machine-learning-6867", title: "Machine Learning — 알고리즘 깊게 (6.867)", ocwUrl: "https://ocw.mit.edu/courses/6-867-machine-learning-fall-2006/" },
    ],
  },
  {
    slug: "deep-learning",
    title: "02 · 딥러닝",
    lessons: [
      { slug: "intro-deep-learning-6s191", title: "Introduction to Deep Learning (6.S191)", ocwUrl: "https://ocw.mit.edu/courses/6-s191-introduction-to-deep-learning-january-iap-2020/" },
      { slug: "deep-learning-67960", title: "Deep Learning — 트랜스포머까지 정규 과목 (6.7960)", ocwUrl: "https://ocw.mit.edu/courses/6-7960-deep-learning-fall-2024/" },
      { slug: "hands-on-deep-learning-15773", title: "Hands-On Deep Learning — LLM·RAG·생성형 실습 (15.773)", ocwUrl: "https://ocw.mit.edu/courses/15-773-hands-on-deep-learning-spring-2024/" },
    ],
  },
  {
    slug: "nlp",
    title: "03 · 자연어처리 (NLP)",
    lessons: [
      { slug: "advanced-nlp-6864", title: "Advanced Natural Language Processing (6.864)", ocwUrl: "https://ocw.mit.edu/courses/6-864-advanced-natural-language-processing-fall-2005/" },
      { slug: "nl-knowledge-6863j", title: "언어와 지식 표현 — 고전 NLP (6.863J)", ocwUrl: "https://ocw.mit.edu/courses/6-863j-natural-language-and-the-computer-representation-of-knowledge-spring-2003/" },
    ],
  },
  {
    slug: "vision-robotics",
    title: "04 · 컴퓨터 비전 · 로보틱스",
    lessons: [
      { slug: "advances-computer-vision-68300", title: "Advances in Computer Vision (6.8300)", ocwUrl: "https://ocw.mit.edu/courses/6-8300-advances-in-computer-vision-spring-2025/" },
      { slug: "underactuated-robotics-6832", title: "Underactuated Robotics — 강화학습 기반 제어 (6.832)", ocwUrl: "https://ocw.mit.edu/courses/6-832-underactuated-robotics-spring-2022/" },
      { slug: "cognitive-robotics-16412j", title: "Cognitive Robotics — 자율 시스템 (16.412J)", ocwUrl: "https://ocw.mit.edu/courses/16-412j-cognitive-robotics-spring-2016/" },
    ],
  },
  {
    slug: "brain-cognition",
    title: "05 · 뇌 · 인지과학 × AI",
    lessons: [
      { slug: "neural-computation-940", title: "Introduction to Neural Computation (9.40)", ocwUrl: "https://ocw.mit.edu/courses/9-40-introduction-to-neural-computation-spring-2018/" },
      { slug: "brains-minds-machines", title: "Brains, Minds and Machines — 지능의 본질 (RES.9-003)", ocwUrl: "https://ocw.mit.edu/courses/res-9-003-brains-minds-and-machines-summer-course-summer-2015/" },
    ],
  },
  {
    slug: "ethics-society",
    title: "06 · AI 윤리 · 사회적 책임",
    lessons: [
      { slug: "ethics-for-engineers-1001", title: "Ethics for Engineers: AI (10.01)", ocwUrl: "https://ocw.mit.edu/courses/10-01-ethics-for-engineers-artificial-intelligence-spring-2020/" },
      { slug: "serc-computing", title: "Social & Ethical Responsibilities of Computing (SERC)", ocwUrl: "https://ocw.mit.edu/courses/res-tll-008-social-and-ethical-responsibilities-of-computing-serc/" },
    ],
  },
  {
    slug: "applications",
    title: "07 · 도메인 응용",
    lessons: [
      { slug: "ml-for-healthcare-6s897", title: "Machine Learning for Healthcare (6.S897)", ocwUrl: "https://ocw.mit.edu/courses/6-s897-machine-learning-for-healthcare-spring-2019/" },
      { slug: "fintech-15s08", title: "FinTech: Shaping the Financial World (15.S08)", ocwUrl: "https://ocw.mit.edu/courses/15-s08-fintech-shaping-the-financial-world-spring-2020/" },
      { slug: "math-bigdata-ml-resll005", title: "Mathematics of Big Data and ML (RES.LL-005)", ocwUrl: "https://ocw.mit.edu/courses/res-ll-005-mathematics-of-big-data-and-machine-learning-january-iap-2020/" },
    ],
  },
];

/** 한국어 분량 기반 예상 시간(분): 본문 길이 + 코드/목록 줄 + 읽기 여유. */
function estKoreanMinutes(md: string): number {
  const chars = md.replace(/\s/g, "").length;
  const lines = (md.match(/\n/g) || []).length;
  return Math.max(5, Math.min(20, Math.round(chars / 400 + lines / 50 + 2)));
}

export function buildMitAiTrack(): Track {
  let lessonOrder = 0;
  const modules: Module[] = PLAN.map((mod, mi) => {
    const lessons: Lesson[] = mod.lessons.map((spec) => {
      const path = join(AUTHORED_DIR, `${spec.slug}.md`);
      if (!existsSync(path)) throw new Error(`Missing MIT AI lesson: ${path}`);
      const body = readFileSync(path, "utf8").trim();
      if (body.length < 200) throw new Error(`Lesson body too short: ${path}`);
      lessonOrder += 1;
      return {
        id: `${TRACK_SLUG}__${mod.slug}__${spec.slug}`,
        slug: spec.slug,
        title: spec.title,
        order: lessonOrder,
        estMinutes: estKoreanMinutes(body),
        contentMarkdown: body,
        sourceRepo: SOURCE_REPO,
        sourceUrl: spec.ocwUrl,
        license: LICENSE,
      };
    });
    return {
      id: `${TRACK_SLUG}__${mod.slug}`,
      slug: mod.slug,
      title: mod.title,
      order: mi + 1,
      lessons,
    };
  });

  return {
    id: TRACK_SLUG,
    slug: TRACK_SLUG,
    title: "MIT AI: OpenCourseWare로 배우는 인공지능",
    description:
      "MIT가 ocw.mit.edu에 무료 공개한 AI 강의들을 입문부터 응용까지 한 길로 엮은 큐레이션 코스입니다. AI 101·6.034로 기초를 잡고, 6.S191·6.7960·15.773로 딥러닝과 LLM·RAG까지, 거기에 NLP·컴퓨터 비전·로보틱스·계산신경과학·AI 윤리·헬스케어/핀테크 응용까지 — 21개 MIT 강의를 8개 모듈로 안내합니다. 각 레슨은 '무엇을 배우나·핵심 개념·누구에게·학습 팁'과 원본 OCW 링크를 담았습니다.",
    level: "beginner",
    order: 4,
    emoji: "🎓",
    accent: "#A31F34",
    modules,
  };
}
