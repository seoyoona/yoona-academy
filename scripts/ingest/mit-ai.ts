import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Track, Module, Lesson } from "../../src/content/types";

/**
 * MIT AI 코스 — MIT OpenCourseWare(ocw.mit.edu)에 공개된 AI/ML/딥러닝 강의를
 * 입문 → 핵심 → 딥러닝 → 응용 순으로 큐레이션한 한국어 코스.
 *
 * 구조: 코스 = 모듈, 강의 = 레슨.
 *  - 각 모듈은 우리가 쓴 한국어 "소개" 레슨(content/authored/mit-ai/<slug>.md)으로 연다.
 *  - OCW가 강의 영상을 자체 호스팅하는 코스(6.034 / 6.7960 / 15.773 / 9.40 / 6.S897)는
 *    소개 뒤에 실제 강의 영상을 회차별 레슨으로 임베드한다(content/authored/mit-ai/lectures.json).
 *    영상 ID·제목은 OCW 강의 갤러리 페이지에서 직접 추출한 실데이터다.
 *  - 영상이 OCW 외부(예: 6.S191)이거나 없는 코스는 소개 레슨만 둔다.
 *
 * OCW 자료 라이선스: Creative Commons BY-NC-SA 4.0.
 */

const TRACK_SLUG = "mit-ai";
const SOURCE_REPO = "MIT OpenCourseWare";
const LICENSE = "CC BY-NC-SA 4.0";

const DIR = join(process.cwd(), "content", "authored", "mit-ai");

// --- 강의 영상 인덱스 (OCW에서 추출, 커밋된 실데이터) -------------------------
type LectureRec = { slug: string; title: string; youtubeId: string };
type CourseVideos = { courseSlug: string; galleryUrl: string; lectures: LectureRec[] };
const VIDEOS: Record<string, CourseVideos> = JSON.parse(
  readFileSync(join(DIR, "lectures.json"), "utf8"),
);

// --- 코스(=모듈) 계획 --------------------------------------------------------
type GuideSpec = { slug: string; title: string; ocwUrl: string };
type ModuleSpec = {
  slug: string;
  title: string;
  guides: GuideSpec[];
  /** lectures.json의 키 — 있으면 소개 뒤에 회차별 영상 레슨을 붙인다. */
  videosKey?: string;
};

const PLAN: ModuleSpec[] = [
  {
    slug: "intro",
    title: "00 · 시작하기: 왜 MIT OCW로 AI를 배우나",
    guides: [
      { slug: "orientation", title: "오리엔테이션 — 이 코스 사용법과 학습 경로", ocwUrl: "https://ocw.mit.edu/" },
      { slug: "ai-101", title: "AI 101 — 배경지식 0에서 출발하기 (RES.6-013)", ocwUrl: "https://ocw.mit.edu/courses/res-6-013-ai-101-fall-2021/" },
      { slug: "foundation-models", title: "Foundation Models & Generative AI — 큰 그림 (6.S087)", ocwUrl: "https://ocw.mit.edu/courses/6-s087-foundation-models-and-generative-ai-january-iap-2024/" },
    ],
  },
  {
    slug: "ai-6034",
    title: "01 · 인공지능 — 고전 AI (6.034)",
    guides: [{ slug: "artificial-intelligence-6034", title: "소개 — Artificial Intelligence (6.034)", ocwUrl: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/" }],
    videosKey: "artificial-intelligence-6034",
  },
  {
    slug: "ml-6036",
    title: "02 · 머신러닝 입문 (6.036)",
    guides: [{ slug: "intro-machine-learning-6036", title: "소개 — Introduction to Machine Learning (6.036)", ocwUrl: "https://ocw.mit.edu/courses/6-036-introduction-to-machine-learning-fall-2020/" }],
  },
  {
    slug: "ml-6867",
    title: "03 · 머신러닝 — 알고리즘 깊게 (6.867)",
    guides: [{ slug: "machine-learning-6867", title: "소개 — Machine Learning (6.867)", ocwUrl: "https://ocw.mit.edu/courses/6-867-machine-learning-fall-2006/" }],
  },
  {
    slug: "dl-6s191",
    title: "04 · 딥러닝 입문 (6.S191)",
    guides: [{ slug: "intro-deep-learning-6s191", title: "소개 — Introduction to Deep Learning (6.S191)", ocwUrl: "https://ocw.mit.edu/courses/6-s191-introduction-to-deep-learning-january-iap-2020/" }],
  },
  {
    slug: "dl-67960",
    title: "05 · 딥러닝 — 트랜스포머까지 (6.7960)",
    guides: [{ slug: "deep-learning-67960", title: "소개 — Deep Learning (6.7960)", ocwUrl: "https://ocw.mit.edu/courses/6-7960-deep-learning-fall-2024/" }],
    videosKey: "deep-learning-67960",
  },
  {
    slug: "dl-15773",
    title: "06 · Hands-On 딥러닝 — LLM·RAG 실습 (15.773)",
    guides: [{ slug: "hands-on-deep-learning-15773", title: "소개 — Hands-On Deep Learning (15.773)", ocwUrl: "https://ocw.mit.edu/courses/15-773-hands-on-deep-learning-spring-2024/" }],
    videosKey: "hands-on-deep-learning-15773",
  },
  {
    slug: "nlp-6864",
    title: "07 · 고급 자연어처리 (6.864)",
    guides: [{ slug: "advanced-nlp-6864", title: "소개 — Advanced Natural Language Processing (6.864)", ocwUrl: "https://ocw.mit.edu/courses/6-864-advanced-natural-language-processing-fall-2005/" }],
  },
  {
    slug: "nlp-6863j",
    title: "08 · 언어와 지식 표현 (6.863J)",
    guides: [{ slug: "nl-knowledge-6863j", title: "소개 — Natural Language & Knowledge (6.863J)", ocwUrl: "https://ocw.mit.edu/courses/6-863j-natural-language-and-the-computer-representation-of-knowledge-spring-2003/" }],
  },
  {
    slug: "cv-68300",
    title: "09 · 컴퓨터 비전의 진전 (6.8300)",
    guides: [{ slug: "advances-computer-vision-68300", title: "소개 — Advances in Computer Vision (6.8300)", ocwUrl: "https://ocw.mit.edu/courses/6-8300-advances-in-computer-vision-spring-2025/" }],
  },
  {
    slug: "robo-6832",
    title: "10 · Underactuated 로보틱스 (6.832)",
    guides: [{ slug: "underactuated-robotics-6832", title: "소개 — Underactuated Robotics (6.832)", ocwUrl: "https://ocw.mit.edu/courses/6-832-underactuated-robotics-spring-2022/" }],
  },
  {
    slug: "robo-16412j",
    title: "11 · 인지 로보틱스 (16.412J)",
    guides: [{ slug: "cognitive-robotics-16412j", title: "소개 — Cognitive Robotics (16.412J)", ocwUrl: "https://ocw.mit.edu/courses/16-412j-cognitive-robotics-spring-2016/" }],
  },
  {
    slug: "neuro-940",
    title: "12 · 신경 계산 입문 (9.40)",
    guides: [{ slug: "neural-computation-940", title: "소개 — Introduction to Neural Computation (9.40)", ocwUrl: "https://ocw.mit.edu/courses/9-40-introduction-to-neural-computation-spring-2018/" }],
    videosKey: "neural-computation-940",
  },
  {
    slug: "bmm",
    title: "13 · 뇌·마음·기계 (RES.9-003)",
    guides: [{ slug: "brains-minds-machines", title: "소개 — Brains, Minds and Machines (RES.9-003)", ocwUrl: "https://ocw.mit.edu/courses/res-9-003-brains-minds-and-machines-summer-course-summer-2015/" }],
  },
  {
    slug: "ethics-1001",
    title: "14 · 엔지니어를 위한 AI 윤리 (10.01)",
    guides: [{ slug: "ethics-for-engineers-1001", title: "소개 — Ethics for Engineers: AI (10.01)", ocwUrl: "https://ocw.mit.edu/courses/10-01-ethics-for-engineers-artificial-intelligence-spring-2020/" }],
  },
  {
    slug: "serc",
    title: "15 · 컴퓨팅의 사회적·윤리적 책임 (SERC)",
    guides: [{ slug: "serc-computing", title: "소개 — Social & Ethical Responsibilities of Computing", ocwUrl: "https://ocw.mit.edu/courses/res-tll-008-social-and-ethical-responsibilities-of-computing-serc/" }],
  },
  {
    slug: "health-6s897",
    title: "16 · 머신러닝과 헬스케어 (6.S897)",
    guides: [{ slug: "ml-for-healthcare-6s897", title: "소개 — Machine Learning for Healthcare (6.S897)", ocwUrl: "https://ocw.mit.edu/courses/6-s897-machine-learning-for-healthcare-spring-2019/" }],
    videosKey: "ml-for-healthcare-6s897",
  },
  {
    slug: "fintech-15s08",
    title: "17 · 핀테크 — 금융을 바꾸는 기술 (15.S08)",
    guides: [{ slug: "fintech-15s08", title: "소개 — FinTech: Shaping the Financial World (15.S08)", ocwUrl: "https://ocw.mit.edu/courses/15-s08-fintech-shaping-the-financial-world-spring-2020/" }],
  },
  {
    slug: "math-resll005",
    title: "18 · 빅데이터·머신러닝의 수학 (RES.LL-005)",
    guides: [{ slug: "math-bigdata-ml-resll005", title: "소개 — Mathematics of Big Data and ML (RES.LL-005)", ocwUrl: "https://ocw.mit.edu/courses/res-ll-005-mathematics-of-big-data-and-machine-learning-january-iap-2020/" }],
  },
];

/** 한국어 분량 기반 예상 시간(분). */
function estKoreanMinutes(md: string): number {
  const chars = md.replace(/\s/g, "").length;
  const lines = (md.match(/\n/g) || []).length;
  return Math.max(5, Math.min(20, Math.round(chars / 400 + lines / 50 + 2)));
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 회차 영상 레슨 본문 — 반응형 16:9 iframe 임베드 + 한국어 안내. */
function lectureBody(courseSlug: string, lec: LectureRec, courseLabel: string): string {
  const watch = `https://www.youtube.com/watch?v=${lec.youtubeId}`;
  const resource = `https://ocw.mit.edu/courses/${courseSlug}/resources/${lec.slug}/`;
  return [
    `**${courseLabel} · ${lec.title}**`,
    "",
    `<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1.25rem 0;background:#000">`,
    `  <iframe style="position:absolute;inset:0;width:100%;height:100%;border:0" src="https://www.youtube.com/embed/${lec.youtubeId}" title="${escAttr(lec.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
    `</div>`,
    "",
    `위 영상은 MIT OpenCourseWare가 공개한 **${courseLabel}** 강의의 한 회차입니다. 영상이 보이지 않으면 [YouTube에서 바로 보기](${watch})를 누르세요. 강의노트·과제 등 회차별 자료는 [OCW 강의 페이지](${resource})에서 받을 수 있습니다.`,
    "",
    `> 영어 강의 영상입니다. YouTube 자막(CC)에서 자동 번역 자막을 켜면 한국어로 볼 수 있습니다.`,
  ].join("\n");
}

export function buildMitAiTrack(): Track {
  let order = 0;
  const modules: Module[] = PLAN.map((mod, mi) => {
    const videos = mod.videosKey ? VIDEOS[mod.videosKey] : undefined;
    const courseLabel = mod.title.replace(/^\d+\s·\s/, "");
    const lessons: Lesson[] = [];

    // 1) 소개(가이드) 레슨들.
    for (const g of mod.guides) {
      const path = join(DIR, `${g.slug}.md`);
      if (!existsSync(path)) throw new Error(`Missing MIT AI guide: ${path}`);
      let body = readFileSync(path, "utf8").trim();
      if (body.length < 200) throw new Error(`Guide too short: ${path}`);
      if (videos && mod.guides.length === 1) {
        body += `\n\n---\n\n**이 모듈에는 아래에 실제 MIT 강의 영상 ${videos.lectures.length}개가 회차별로 임베드되어 있습니다.** 소개를 읽었다면 다음 레슨부터 강의를 들어보세요.`;
      }
      order += 1;
      lessons.push({
        id: `${TRACK_SLUG}__${mod.slug}__${g.slug}`,
        slug: g.slug,
        title: g.title,
        order,
        estMinutes: estKoreanMinutes(body),
        contentMarkdown: body,
        sourceRepo: SOURCE_REPO,
        sourceUrl: g.ocwUrl,
        license: LICENSE,
      });
    }

    // 2) 회차별 영상 레슨들.
    if (videos) {
      for (const lec of videos.lectures) {
        const lessonSlug = lec.slug.replace(/_/g, "-");
        order += 1;
        lessons.push({
          id: `${TRACK_SLUG}__${mod.slug}__${lessonSlug}`,
          slug: lessonSlug,
          title: lec.title,
          order,
          estMinutes: 50,
          contentMarkdown: lectureBody(videos.courseSlug, lec, courseLabel),
          sourceRepo: SOURCE_REPO,
          sourceUrl: `https://ocw.mit.edu/courses/${videos.courseSlug}/resources/${lec.slug}/`,
          license: LICENSE,
        });
      }
    }

    return {
      id: `${TRACK_SLUG}__${mod.slug}`,
      slug: mod.slug,
      title: mod.title,
      order: mi + 1,
      lessons,
    };
  });

  const lectureTotal = Object.values(VIDEOS).reduce((n, c) => n + c.lectures.length, 0);

  return {
    id: TRACK_SLUG,
    slug: TRACK_SLUG,
    title: "MIT AI: OpenCourseWare로 배우는 인공지능",
    description:
      `MIT가 ocw.mit.edu에 무료 공개한 AI 강의들을 입문부터 응용까지 한 길로 엮은 코스입니다. ` +
      `각 코스는 한국어 '소개' 레슨으로 시작하고, MIT가 영상을 공개한 5개 코스(6.034·6.7960·15.773·9.40·6.S897)는 ` +
      `실제 강의 영상 ${lectureTotal}개를 회차별로 바로 보며 들을 수 있게 임베드했습니다. ` +
      `고전 AI·머신러닝·딥러닝/LLM부터 NLP·컴퓨터 비전·로보틱스·계산신경과학·AI 윤리·헬스케어/핀테크 응용까지, 19개 MIT 강의를 담았습니다.`,
    level: "beginner",
    order: 4,
    emoji: "🎓",
    accent: "#A31F34",
    modules,
  };
}
