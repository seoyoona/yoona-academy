import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import type { Track, Module, Lesson } from "../../src/content/types";
import {
  slugify,
  estimateMinutes,
  extractAllSections,
  rewriteRelativeUrls,
} from "../lib/markdown";
import { MADE_WITH_ML_COURSE_PAGES, courseUrl } from "../lib/madewithml-course";

const REPO = "made-with-ml";
const SOURCE_REPO = "GokuMohandas/Made-With-ML";
const LICENSE = "MIT (code) — lessons © madewithml.com";
const RAW = "https://raw.githubusercontent.com/GokuMohandas/Made-With-ML/main/";
const BLOB = "https://github.com/GokuMohandas/Made-With-ML/blob/main/";

const TRACK_SLUG = "ml-engineering";

type ReadmeItem = { h: string; title: string; code?: string };
type ReadmePlan = { slug: string; title: string; items: ReadmeItem[] };
type SourceItem = {
  path: string;
  title: string;
  focus: string;
  slug?: string;
};

const README_PLAN: ReadmePlan[] = [
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

const IMPLEMENTATION_INTERNALS: SourceItem[] = [
  {
    path: "madewithml/config.py",
    title: "설정과 런타임 경계",
    focus: "환경 변수, 경로, MLflow, 로깅, stopwords처럼 전체 워크로드가 공유하는 설정을 한 곳에 고정합니다.",
  },
  {
    path: "madewithml/data.py",
    title: "데이터 로딩과 전처리",
    focus: "Ray Dataset 로딩, stratified split, 텍스트 정제, SciBERT 토크나이징, 커스텀 전처리기 구조를 연결합니다.",
  },
  {
    path: "madewithml/models.py",
    title: "모델 래퍼와 체크포인트",
    focus: "BERT 기반 분류 모델, 확률 예측, 저장/로드 경계를 프로덕션 추론이 재사용할 수 있게 만듭니다.",
  },
  {
    path: "madewithml/utils.py",
    title: "공통 유틸리티와 배치 변환",
    focus: "seed 고정, JSON 저장, run id 조회, torch batch collation처럼 여러 워크로드가 공유하는 작은 경계를 다룹니다.",
  },
  {
    path: "madewithml/train.py",
    title: "분산 학습 워크로드",
    focus: "Ray Train, TorchTrainer, checkpoint, MLflow logging을 하나의 학습 실행 경계로 묶습니다.",
  },
  {
    path: "madewithml/tune.py",
    title: "튜닝 워크로드",
    focus: "Ray Tune search space, scheduler, initial parameter, result selection을 반복 가능한 최적화 실행으로 구성합니다.",
  },
  {
    path: "madewithml/evaluate.py",
    title: "평가 워크로드",
    focus: "best run으로부터 모델을 불러와 holdout dataset에 대한 metric과 slice 결과를 산출합니다.",
  },
  {
    path: "madewithml/predict.py",
    title: "예측 유틸리티",
    focus: "등록된 run id와 입력 텍스트를 받아 production serving과 CLI가 공유하는 예측 형식을 만듭니다.",
  },
  {
    path: "madewithml/serve.py",
    title: "Ray Serve 배포 코드",
    focus: "모델 로딩, request parsing, batch prediction, Ray Serve deployment boundary를 정의합니다.",
  },
];

const TESTING_QUALITY: SourceItem[] = [
  {
    path: "tests/code/test_data.py",
    title: "데이터 전처리 테스트",
    focus: "텍스트 정제, 데이터 분할, 전처리 결과가 학습 워크로드의 전제와 일치하는지 검증합니다.",
  },
  {
    path: "tests/code/test_train.py",
    title: "학습 루프 테스트",
    focus: "train/eval step과 checkpoint 산출이 최소 데이터에서 안정적으로 동작하는지 확인합니다.",
  },
  {
    path: "tests/code/test_tune.py",
    title: "튜닝 워크로드 테스트",
    focus: "Ray Tune 설정, search space, 결과 저장 경로가 깨지지 않는지 확인합니다.",
  },
  {
    path: "tests/code/test_predict.py",
    title: "예측 유틸리티 테스트",
    focus: "label decoding, probability formatting처럼 serving 전에 재사용되는 작은 추론 함수를 검증합니다.",
  },
  {
    path: "tests/code/test_utils.py",
    title: "공통 유틸리티 테스트",
    focus: "공통 helper의 deterministic behavior를 확인해 학습·평가·서빙 테스트의 기반을 고정합니다.",
  },
  {
    path: "tests/code/conftest.py",
    title: "코드 테스트 Fixture",
    focus: "코드 단위 테스트가 공유하는 pytest fixture와 환경 설정을 분리합니다.",
  },
  {
    path: "tests/data/test_dataset.py",
    title: "데이터 계약 테스트",
    focus: "외부 CSV가 모델 학습에 필요한 column과 label contract를 만족하는지 검증합니다.",
  },
  {
    path: "tests/model/test_behavioral.py",
    title: "모델 행동 테스트",
    focus: "전체 모델이 특정 입력군에서 기대하는 행동을 보이는지 slice와 behavioral 관점으로 점검합니다.",
  },
  {
    path: "tests/model/conftest.py",
    title: "모델 테스트 Fixture",
    focus: "모델 테스트가 재사용하는 run id, dataset, checkpoint fixture를 관리합니다.",
  },
];

const DEPLOYMENT_OPS: SourceItem[] = [
  {
    path: "deploy/cluster_env.yaml",
    title: "클러스터 환경 정의",
    focus: "운영 워크로드가 실행될 OS, Python, 의존성 환경을 재현 가능하게 선언합니다.",
  },
  {
    path: "deploy/cluster_compute.yaml",
    title: "컴퓨트 구성 정의",
    focus: "학습·평가·서빙에 필요한 CPU/GPU 리소스 형태를 인프라 설정으로 고정합니다.",
  },
  {
    path: "deploy/jobs/workloads.yaml",
    title: "Anyscale Job 명세",
    focus: "학습, 튜닝, 평가 워크로드를 하나의 job entrypoint로 묶는 실행 계약을 정의합니다.",
  },
  {
    path: "deploy/jobs/workloads.sh",
    title: "워크로드 실행 스크립트",
    focus: "프로덕션 job 안에서 train, tune, evaluate, 결과 저장이 어떤 순서로 실행되는지 보여줍니다.",
  },
  {
    path: "deploy/services/serve_model.yaml",
    title: "서비스 롤아웃 명세",
    focus: "Ray Serve 서비스를 어떤 import path와 runtime environment로 배포할지 선언합니다.",
  },
  {
    path: "deploy/services/serve_model.py",
    title: "서비스 엔트리포인트",
    focus: "S3에서 모델 registry와 결과를 가져온 뒤 Ray Serve deployment를 bind하는 운영 진입점입니다.",
  },
  {
    path: ".github/workflows/workloads.yaml",
    title: "학습 워크플로우 자동화",
    focus: "PR마다 Anyscale Job을 실행하고 학습·평가 결과를 리뷰 맥락에 연결하는 CI 흐름입니다.",
  },
  {
    path: ".github/workflows/serve.yaml",
    title: "서빙 워크플로우 자동화",
    focus: "main 병합 이후 최신 모델 서비스를 롤아웃하는 CD 흐름입니다.",
  },
  {
    path: ".github/workflows/documentation.yaml",
    title: "문서 배포 워크플로우",
    focus: "코드 변경과 함께 문서 사이트가 갱신되는 경로를 CI에서 관리합니다.",
  },
  {
    path: ".github/workflows/json_to_md.py",
    title: "결과 코멘트 변환기",
    focus: "워크로드가 만든 JSON 결과를 PR에 읽기 쉬운 Markdown 코멘트로 바꿉니다.",
  },
  {
    path: "notebooks/madewithml.ipynb",
    title: "탐색 노트북",
    focus: "스크립트화하기 전 데이터와 모델 워크로드를 대화형으로 훑어보는 실험 표면입니다.",
  },
];

function readmePlan(slug: string): ReadmePlan {
  const plan = README_PLAN.find((p) => p.slug === slug);
  if (!plan) throw new Error(`Unknown README module: ${slug}`);
  return plan;
}

function languageFor(path: string): string {
  const ext = extname(path);
  if (ext === ".py") return "python";
  if (ext === ".yaml" || ext === ".yml") return "yaml";
  if (ext === ".sh") return "bash";
  if (ext === ".json") return "json";
  return "";
}

function readSource(srcDir: string, path: string): string {
  return readFileSync(join(srcDir, path), "utf8").trim();
}

function sourceLessonMarkdown(item: SourceItem, source: string): string {
  const lang = languageFor(item.path);
  return [
    `This lesson opens the upstream source file \`${item.path}\` and reads it as part of the production ML system, not as an isolated snippet.`,
    "",
    `**Focus:** ${item.focus}`,
    "",
    "Use it to connect the high-level course section to the exact implementation boundary that runs in the repository.",
    "",
    `## Source file: \`${item.path}\``,
    "",
    "```" + lang,
    source,
    "```",
  ].join("\n");
}

function notebookLessonMarkdown(srcDir: string, item: SourceItem): string {
  const raw = readFileSync(join(srcDir, item.path), "utf8");
  const notebook = JSON.parse(raw) as {
    cells?: Array<{ cell_type?: string; source?: string[] | string }>;
  };
  const cells = notebook.cells ?? [];
  const markdownCells = cells.filter((cell) => cell.cell_type === "markdown").length;
  const codeCells = cells.filter((cell) => cell.cell_type === "code").length;
  return [
    `This lesson points to the upstream exploratory notebook \`${item.path}\`. The raw notebook JSON is intentionally not embedded verbatim because the useful learning surface is the notebook flow and its executable cells.`,
    "",
    `**Focus:** ${item.focus}`,
    "",
    `- Path: \`${item.path}\``,
    `- Markdown cells: ${markdownCells}`,
    `- Code cells: ${codeCells}`,
    `- Upstream notebook: [${item.path}](${BLOB}${item.path})`,
    "",
    "Read the notebook alongside the script lessons: the notebook is the exploration surface, while the Python modules are the productionized execution surface.",
  ].join("\n");
}

export function buildMlTrack(sourcesDir: string): Track {
  const srcDir = join(sourcesDir, REPO);
  if (!existsSync(srcDir)) throw new Error(`Missing source: ${srcDir}`);
  const courseDir = join(process.cwd(), "content", "external", "madewithml-course");
  if (!existsSync(courseDir)) {
    throw new Error(
      `Missing Made With ML course cache: ${courseDir}. Run \`pnpm sources:ml-course\`.`,
    );
  }

  const readme = rewriteRelativeUrls(
    readFileSync(join(srcDir, "README.md"), "utf8"),
    RAW,
  );
  const sections = extractAllSections(readme);
  const findSection = (h: string) =>
    sections.find((s) => s.title.toLowerCase().startsWith(h.toLowerCase())) ??
    sections.find((s) => s.title.toLowerCase().includes(h.toLowerCase()));

  let lessonOrder = 0;

  function buildReadmeModule(plan: ReadmePlan): Module {
    const lessons: Lesson[] = plan.items
      .map((item) => {
        const section = findSection(item.h);
        if (!section) return null;
        let body = section.body;

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
        return {
          id: `${TRACK_SLUG}__${plan.slug}__${lessonSlug}`,
          slug: lessonSlug,
          title: item.title,
          order: lessonOrder,
          estMinutes: estimateMinutes(body),
          contentMarkdown: body.trim(),
          sourceRepo: SOURCE_REPO,
          sourceUrl: "https://madewithml.com/",
          license: LICENSE,
        } satisfies Lesson;
      })
      .filter((l): l is Lesson => l !== null);

    return {
      id: `${TRACK_SLUG}__${plan.slug}`,
      slug: plan.slug,
      title: plan.title,
      order: 0,
      lessons,
    };
  }

  function buildSourceLessons(slug: string, items: SourceItem[]): Lesson[] {
    return items.map((item) => {
      const lessonSlug = item.slug ?? slugify(item.path);
      const body =
        item.path.endsWith(".ipynb")
          ? notebookLessonMarkdown(srcDir, item)
          : sourceLessonMarkdown(item, readSource(srcDir, item.path));
      lessonOrder += 1;
      return {
        id: `${TRACK_SLUG}__${slug}__${lessonSlug}`,
        slug: lessonSlug,
        title: item.title,
        order: lessonOrder,
        estMinutes: estimateMinutes(body),
        contentMarkdown: body,
        sourceRepo: SOURCE_REPO,
        sourceUrl: BLOB + item.path,
        license: LICENSE,
      };
    });
  }

  function buildSourceModule(slug: string, title: string, items: SourceItem[]): Module {
    const lessons = buildSourceLessons(slug, items);

    return {
      id: `${TRACK_SLUG}__${slug}`,
      slug,
      title,
      order: 0,
      lessons,
    };
  }

  function buildCourseLessons(slug: string): Lesson[] {
    return MADE_WITH_ML_COURSE_PAGES.filter((page) => page.moduleSlug === slug).map((page) => {
      const body = readFileSync(join(courseDir, `${page.slug}.md`), "utf8").trim();
      lessonOrder += 1;
      return {
        id: `${TRACK_SLUG}__${slug}__${page.slug}`,
        slug: page.slug,
        title: page.koreanTitle,
        order: lessonOrder,
        estMinutes: estimateMinutes(body),
        contentMarkdown: body,
        sourceRepo: "madewithml.com",
        sourceUrl: courseUrl(page.slug),
        license: LICENSE,
      } satisfies Lesson;
    });
  }

  function buildCourseModule(slug: string, title: string, items: SourceItem[] = []): Module {
    const lessons = [...buildCourseLessons(slug), ...buildSourceLessons(slug, items)];
    return {
      id: `${TRACK_SLUG}__${slug}`,
      slug,
      title,
      order: 0,
      lessons,
    };
  }

  const modules = [
    buildCourseModule("foundations", "ML 시스템 기초"),
    buildCourseModule("setup", "환경 셋업"),
    buildCourseModule("development", "데이터와 모델 개발"),
    buildSourceModule("implementation-internals", "구현 내부", IMPLEMENTATION_INTERNALS),
    buildCourseModule("serving", "서빙과 인터페이스"),
    buildCourseModule("testing-quality", "테스트와 품질", TESTING_QUALITY),
    buildCourseModule("deployment-ops", "배포 운영", DEPLOYMENT_OPS),
    buildReadmeModule(readmePlan("production")),
  ]
    .filter((m) => m.lessons.length > 0)
    .map((module, index) => ({ ...module, order: index + 1 }));

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
