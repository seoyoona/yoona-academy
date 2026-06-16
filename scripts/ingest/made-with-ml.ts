import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Track, Module, Lesson } from "../../src/content/types";
import {
  slugify,
  estimateMinutes,
  extractAllSections,
  rewriteRelativeUrls,
} from "../lib/markdown";

const REPO = "made-with-ml";
const SOURCE_REPO = "GokuMohandas/Made-With-ML";
const LICENSE = "MIT (code) — lessons © madewithml.com";
const RAW = "https://raw.githubusercontent.com/GokuMohandas/Made-With-ML/main/";

const TRACK_SLUG = "ml-engineering";

type Item = { h: string; title: string; code?: string };
const PLAN: Array<{ slug: string; title: string; items: Item[] }> = [
  {
    slug: "foundations",
    title: "ML 시스템 기초",
    items: [
      { h: "Overview", title: "ML 시스템 개요" },
      { h: "Audience", title: "누구를 위한 코스인가" },
    ],
  },
  {
    slug: "setup",
    title: "환경 셋업",
    items: [
      { h: "Cluster", title: "클러스터 준비" },
      { h: "Git setup", title: "Git 설정" },
      { h: "Credentials", title: "자격 증명" },
      { h: "Virtual environment", title: "가상 환경" },
    ],
  },
  {
    slug: "development",
    title: "모델 개발",
    items: [
      { h: "Notebook", title: "노트북 워크플로우" },
      { h: "Training", title: "모델 학습", code: "train.py" },
      { h: "Tuning", title: "하이퍼파라미터 튜닝", code: "tune.py" },
      { h: "Experiment tracking", title: "실험 추적" },
      { h: "Evaluation", title: "모델 평가", code: "evaluate.py" },
      { h: "Inference", title: "추론 (Inference)", code: "predict.py" },
    ],
  },
  {
    slug: "serving",
    title: "서빙 & 테스트",
    items: [
      { h: "Serving", title: "모델 서빙", code: "serve.py" },
      { h: "Testing", title: "테스트 전략" },
    ],
  },
  {
    slug: "production",
    title: "프로덕션 MLOps",
    items: [
      { h: "Authentication", title: "인증" },
      { h: "Cluster environment", title: "클러스터 환경" },
      { h: "Compute configuration", title: "컴퓨트 구성" },
      { h: "Anyscale jobs", title: "배치 작업 (Jobs)" },
      { h: "Anyscale Services", title: "서비스 배포" },
      { h: "CI/CD", title: "CI/CD 파이프라인" },
      { h: "Continual learning", title: "지속 학습" },
    ],
  },
];

export function buildMlTrack(sourcesDir: string): Track {
  const srcDir = join(sourcesDir, REPO);
  if (!existsSync(srcDir)) throw new Error(`Missing source: ${srcDir}`);

  const readme = rewriteRelativeUrls(
    readFileSync(join(srcDir, "README.md"), "utf8"),
    RAW,
  );
  const sections = extractAllSections(readme);
  const findSection = (h: string) =>
    sections.find((s) => s.title.toLowerCase().startsWith(h.toLowerCase())) ??
    sections.find((s) => s.title.toLowerCase().includes(h.toLowerCase()));

  let lessonOrder = 0;
  const modules: Module[] = PLAN.map((plan, mi) => {
    const lessons: Lesson[] = plan.items
      .map((item) => {
        const section = findSection(item.h);
        if (!section) return null;
        let body = section.body;

        // Embed the real implementation source as a teachable code lesson.
        if (item.code) {
          const codePath = join(srcDir, "madewithml", item.code);
          if (existsSync(codePath)) {
            const code = readFileSync(codePath, "utf8");
            body +=
              `\n\n## 📄 소스 코드: \`madewithml/${item.code}\`\n\n` +
              "이 레슨에서 다루는 실제 구현 코드입니다.\n\n" +
              "```python\n" +
              code.trim() +
              "\n```\n";
          }
        }
        if (body.trim().length < 40) return null;

        lessonOrder += 1;
        const lessonSlug = slugify(item.h);
        const lesson: Lesson = {
          id: `${TRACK_SLUG}__${plan.slug}__${lessonSlug}`,
          slug: lessonSlug,
          title: item.title,
          order: lessonOrder,
          estMinutes: estimateMinutes(body),
          contentMarkdown: body.trim(),
          sourceRepo: SOURCE_REPO,
          sourceUrl: "https://madewithml.com/",
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
  }).filter((m) => m.lessons.length > 0);

  return {
    id: TRACK_SLUG,
    slug: TRACK_SLUG,
    title: "ML 엔지니어링 & MLOps",
    description:
      "데이터 준비부터 모델 학습·평가·서빙, 그리고 CI/CD·지속 학습까지. 실제 프로덕션 ML 시스템을 설계하고 운영하는 MLOps 엔지니어링을 코드 중심으로 배웁니다.",
    level: "advanced",
    order: 2,
    emoji: "🤖",
    accent: "#A24BCF",
    modules,
  };
}
