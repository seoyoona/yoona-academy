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

type SourceItem = {
  path: string;
  title: string;
  focus: string;
  slug?: string;
};
type ProductionItem = {
  h: string;
  slug: string;
  title: string;
  objective: string;
  relatedLessons: string[];
  sources?: SourceItem[];
};

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

const PRODUCTION_ITEMS: ProductionItem[] = [
  {
    h: "Authentication",
    slug: "authentication",
    title: "인증",
    objective:
      "로컬 실행, Anyscale Workspace, GitHub Actions가 같은 클라우드 자원에 접근할 수 있도록 자격 증명의 경계를 분리합니다.",
    relatedLessons: ["jobs-and-services", "cicd"],
  },
  {
    h: "Cluster environment",
    slug: "cluster-environment",
    title: "클러스터 환경",
    objective:
      "운영 워크로드가 어느 OS, Python, Ray, 패키지 조합에서 실행되는지 고정해 재현 가능한 런타임을 만듭니다.",
    relatedLessons: ["jobs-and-services"],
    sources: [DEPLOYMENT_OPS[0]],
  },
  {
    h: "Compute configuration",
    slug: "compute-configuration",
    title: "컴퓨트 구성",
    objective:
      "학습, 평가, 서빙이 사용할 GPU/CPU 노드와 디스크 크기를 명시해 비용과 성능을 코드 리뷰 가능한 설정으로 만듭니다.",
    relatedLessons: ["jobs-and-services"],
    sources: [DEPLOYMENT_OPS[1]],
  },
  {
    h: "Anyscale jobs",
    slug: "anyscale-jobs",
    title: "배치 작업 (Jobs)",
    objective:
      "테스트, 학습, 튜닝, 평가, 결과 저장을 하나의 원격 job으로 묶어 PR마다 반복 가능한 모델 빌드 경로를 만듭니다.",
    relatedLessons: ["jobs-and-services", "cicd", "monitoring"],
    sources: [DEPLOYMENT_OPS[2], DEPLOYMENT_OPS[3]],
  },
  {
    h: "Anyscale Services",
    slug: "anyscale-services",
    title: "서비스 배포",
    objective:
      "job이 만든 모델 registry와 결과물을 읽어 Ray Serve endpoint로 배포하고, query/rollback/terminate까지 운영 명령을 연결합니다.",
    relatedLessons: ["serving", "jobs-and-services", "monitoring"],
    sources: [DEPLOYMENT_OPS[4], DEPLOYMENT_OPS[5]],
  },
  {
    h: "CI/CD",
    slug: "cicd",
    title: "CI/CD 파이프라인",
    objective:
      "PR에서는 워크로드를 검증하고 main 병합 뒤에는 서비스를 배포해, 모델 변경이 사람 손을 덜 타고 운영까지 이어지게 합니다.",
    relatedLessons: ["cicd", "testing", "monitoring"],
    sources: [DEPLOYMENT_OPS[6], DEPLOYMENT_OPS[7], DEPLOYMENT_OPS[8], DEPLOYMENT_OPS[9]],
  },
  {
    h: "Continual learning",
    slug: "continual-learning",
    title: "지속 학습",
    objective:
      "모니터링, 데이터 파이프라인, 오프라인/온라인 평가를 다시 job과 service로 연결해 모델을 한 번 배포하고 끝내지 않는 루프를 만듭니다.",
    relatedLessons: ["monitoring", "data-engineering", "evaluation", "cicd"],
  },
];

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

function compactSourceLessonMarkdown(item: SourceItem, source: string): string {
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

function sourceKind(path: string): string {
  if (path.startsWith("tests/")) return "테스트";
  if (path.startsWith("deploy/cluster")) return "클러스터 설정";
  if (path.startsWith("deploy/jobs")) return "배치 Job";
  if (path.startsWith("deploy/services")) return "서비스 배포";
  if (path.startsWith(".github/workflows")) return "CI/CD 워크플로우";
  if (path.endsWith(".ipynb")) return "탐색 노트북";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "운영 설정";
  return "구현 파일";
}

function extractCodeSignals(path: string, source: string): string[] {
  const signals: string[] = [];
  const defs = [...source.matchAll(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/gm)].map(
    (match) => `함수 \`${match[1]}\``,
  );
  const classes = [...source.matchAll(/^class\s+([A-Za-z_]\w*)\s*[\(:]/gm)].map(
    (match) => `클래스 \`${match[1]}\``,
  );
  const yamlKeys = [...source.matchAll(/^([A-Za-z0-9_ -]+):\s*(?:.*)$/gm)]
    .map((match) => match[1].trim())
    .filter((key) => key.length > 1)
    .slice(0, 8)
    .map((key) => `설정 키 \`${key}\``);
  const workflowSteps = [...source.matchAll(/^\s*-\s+name:\s+(.+)$/gm)]
    .map((match) => `워크플로우 단계 \`${match[1].trim()}\``)
    .slice(0, 8);
  const commands = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      /^(pytest|python|anyscale|aws|git|curl|mkdocs|mkdir|export)\b/.test(line),
    )
    .slice(0, 8)
    .map((line) => `명령 \`${line.replace(/`/g, "'")}\``);

  signals.push(...classes, ...defs, ...workflowSteps, ...yamlKeys, ...commands);
  if (signals.length === 0) {
    signals.push(
      `파일 크기 ${source.length.toLocaleString("ko-KR")}자`,
      `확장자 \`${extname(path) || "none"}\``,
    );
  }
  return [...new Set(signals)].slice(0, 10);
}

function operationalContext(item: SourceItem): string {
  const path = item.path;
  if (path.startsWith("tests/code/")) {
    return "이 파일은 모델 품질 자체보다 코드 경계가 깨지지 않는지를 빠르게 확인합니다. 작은 fixture와 최소 데이터로 전처리, 학습 step, 튜닝 설정, 예측 formatting 같은 단위 기능을 검증해 원격 job을 띄우기 전에 실패를 지역화합니다.";
  }
  if (path.startsWith("tests/data/")) {
    return "이 파일은 외부 데이터가 학습 코드의 암묵적 전제를 만족하는지 확인합니다. 프로덕션 ML에서 데이터 스키마가 조용히 바뀌면 모델 코드는 그대로여도 학습과 평가가 의미를 잃기 때문에, column과 label 계약을 별도 테스트로 고정합니다.";
  }
  if (path.startsWith("tests/model/")) {
    return "이 파일은 모델이 특정 입력군에서 기대한 행동을 보이는지 확인합니다. 단순 정확도 평균만 보지 않고 slice와 behavioral case를 둬서, 모델 변경이 제품 관점의 중요한 동작을 깨뜨리지 않는지 살핍니다.";
  }
  if (path === "deploy/cluster_env.yaml") {
    return "이 파일은 실행 환경을 애플리케이션 코드 바깥으로 분리합니다. base image, Debian package, pip 설치 경로를 고정하면 노트북, job, service가 다른 패키지 조합에서 우연히 성공하거나 실패하는 문제를 줄일 수 있습니다.";
  }
  if (path === "deploy/cluster_compute.yaml") {
    return "이 파일은 어떤 컴퓨트 자원에서 워크로드가 실행되는지 선언합니다. GPU instance, worker 수, disk 크기, cloud/region을 코드로 관리하면 비용이 많이 드는 인프라 결정을 PR에서 검토할 수 있습니다.";
  }
  if (path.startsWith("deploy/jobs/")) {
    return "이 파일은 모델 개발 단계를 운영 batch job으로 묶습니다. 데이터 테스트, 코드 테스트, 학습, 튜닝, 평가, 결과 저장이 한 번의 원격 실행 안에서 어떤 순서로 이어지는지 보여 주며, CI가 호출할 수 있는 실행 계약이 됩니다.";
  }
  if (path.startsWith("deploy/services/")) {
    return "이 파일은 offline job이 만든 산출물을 online serving 경계로 넘깁니다. 모델 registry와 결과 파일을 가져오고 Ray Serve deployment를 bind해, 학습 산출물이 실제 endpoint로 노출되는 마지막 단계를 정의합니다.";
  }
  if (path.includes("workflows/workloads")) {
    return "이 워크플로우는 PR에서 원격 ML workload를 실행합니다. 일반적인 unit test와 달리 클러스터, S3, Anyscale job까지 포함하므로, 모델 변경이 운영 실행 경로를 통과하는지 리뷰 단계에서 확인할 수 있습니다.";
  }
  if (path.includes("workflows/serve")) {
    return "이 워크플로우는 main 병합 뒤 서비스를 배포합니다. 모델 build와 서비스 rollout을 분리해, PR에서는 검증하고 main에서는 사용자가 호출하는 endpoint를 갱신하는 CD 경계를 만듭니다.";
  }
  if (path.includes("workflows/documentation")) {
    return "이 워크플로우는 코드 문서가 main 변경과 함께 갱신되도록 합니다. ML 시스템에서는 모델 코드, serving 코드, 운영 명령이 빠르게 바뀌기 때문에 문서 배포도 릴리스 경로의 일부로 다뤄야 합니다.";
  }
  if (path.includes("json_to_md.py")) {
    return "이 파일은 job 결과 JSON을 PR 코멘트로 읽기 좋게 변환합니다. 원격 학습 결과를 artifact에 묻어두지 않고 리뷰 화면에 올리면, 모델 변경의 근거를 코드 변경과 함께 판단할 수 있습니다.";
  }
  if (path.endsWith(".ipynb")) {
    return "이 노트북은 스크립트화되기 전의 탐색 흐름을 보여 줍니다. 프로덕션 코드는 아니지만 데이터 이해, 실험 방향, feature/label 가정이 어디서 출발했는지 추적하는 배경 자료입니다.";
  }
  return "이 파일은 상위 개념을 실제 실행 경계로 바꾸는 코드입니다. 읽을 때는 문법보다 어떤 입력을 받고, 어떤 산출물을 만들며, 어떤 다른 단계가 이 산출물을 소비하는지에 집중해야 합니다.";
}

function reviewChecklist(item: SourceItem): string[] {
  const path = item.path;
  if (path.startsWith("tests/")) {
    return [
      "테스트가 실제 운영에서 깨지면 위험한 계약을 검증하는가?",
      "fixture가 지나치게 낙관적이라 실패해야 할 경우를 숨기고 있지는 않은가?",
      "테스트 실패 메시지만 보고 어느 단계가 깨졌는지 추적할 수 있는가?",
    ];
  }
  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return [
      "환경 이름, project id, bucket 경로처럼 사용자별로 바꿔야 하는 값이 명확한가?",
      "리소스 크기와 worker 수가 비용·성능 요구와 맞는가?",
      "이 설정을 바꾸면 어떤 job 또는 service가 영향을 받는지 추적 가능한가?",
    ];
  }
  if (path.endsWith(".sh")) {
    return [
      "실행 순서가 실패를 빨리 드러내는 순서인가?",
      "중간 결과 파일이 다음 단계와 CI 코멘트에서 재사용 가능한 형태인가?",
      "환경 변수와 경로가 로컬, job, CI에서 같은 의미로 해석되는가?",
    ];
  }
  if (path.startsWith(".github/workflows")) {
    return [
      "trigger가 PR 검증과 main 배포를 명확히 분리하는가?",
      "secret과 cloud role이 필요한 단계에만 노출되는가?",
      "워크플로우 결과가 리뷰어가 읽을 수 있는 형태로 남는가?",
    ];
  }
  return [
    "이 파일의 입력과 출력이 앞뒤 단계와 맞물리는가?",
    "실패했을 때 로그나 결과 파일로 원인을 좁힐 수 있는가?",
    "노트북 실험과 운영 스크립트 사이의 차이가 명확히 드러나는가?",
  ];
}

function commonFailureModes(item: SourceItem): string[] {
  const path = item.path;
  if (path.startsWith("tests/")) {
    return [
      "fixture가 실제 데이터보다 너무 작거나 깨끗하면 운영 데이터의 실패를 놓칠 수 있습니다.",
      "테스트가 구현 세부사항에만 묶이면 리팩터링 때 불필요하게 깨지고, 반대로 제품 행동 변화는 잡지 못합니다.",
      "원격 job에서만 필요한 옵션을 로컬 테스트가 검증하지 않으면 CI에서 뒤늦게 실패합니다.",
    ];
  }
  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return [
      "환경 이름이나 bucket 경로가 사용자별 값과 섞이면 다른 사람이 같은 설정을 재사용하기 어렵습니다.",
      "클러스터 설정과 서비스 설정이 서로 다른 runtime을 가리키면 학습은 성공해도 서빙에서 import나 dependency 오류가 납니다.",
      "resource 설정을 코드 리뷰 없이 바꾸면 성능 개선보다 비용 증가가 먼저 발생할 수 있습니다.",
    ];
  }
  if (path.startsWith(".github/workflows")) {
    return [
      "PR trigger와 main trigger가 섞이면 검증해야 할 단계와 배포해야 할 단계가 뒤엉킵니다.",
      "secret을 모든 step에 노출하면 실패 조사와 권한 범위가 불필요하게 커집니다.",
      "원격 workload 결과가 PR에 남지 않으면 리뷰어는 모델 변경을 코드 diff만 보고 판단해야 합니다.",
    ];
  }
  if (path.endsWith(".ipynb")) {
    return [
      "노트북에서만 성공한 셀 순서가 스크립트 실행 순서와 다르면 재현성이 깨집니다.",
      "탐색 중 만든 임시 feature가 운영 전처리 코드로 옮겨졌는지 확인하지 않으면 학습/서빙 skew가 생깁니다.",
      "시각화와 중간 출력이 의사결정 근거로 남지 않으면 나중에 모델 변경 이유를 설명하기 어렵습니다.",
    ];
  }
  return [
    "입력 경로와 출력 경로가 환경마다 달라지면 같은 코드가 로컬과 원격에서 다르게 동작합니다.",
    "예외와 로그가 부족하면 실패한 뒤 어느 운영 단계가 문제인지 좁히기 어렵습니다.",
    "다음 단계가 소비하는 산출물 형식이 암묵적이면 작은 변경도 전체 파이프라인을 깨뜨릴 수 있습니다.",
  ];
}

function expandedSourceLessonMarkdown(item: SourceItem, source: string): string {
  const lang = languageFor(item.path);
  const signals = extractCodeSignals(item.path, source);
  return [
    `이 레슨은 upstream 소스 파일 \`${item.path}\`을 고립된 코드 조각이 아니라 Made With ML 프로덕션 ML 시스템의 한 실행 경계로 읽습니다.`,
    "",
    `**핵심 초점:** ${item.focus}`,
    "",
    `**파일 성격:** ${sourceKind(item.path)}`,
    "",
    "## 왜 이 파일을 따로 읽어야 하나",
    "",
    operationalContext(item),
    "",
    "상위 레슨에서 배운 개념은 여기서 실제 운영 형태로 바뀝니다. 테스트 파일이면 품질 기준이 코드로 고정되는 지점이고, 배포 설정이면 클러스터와 서비스가 어떤 자원에서 어떤 명령으로 실행되는지 선언하는 지점입니다. 따라서 이 파일은 단순히 외우는 대상이 아니라, 변경이 생겼을 때 어떤 운영 위험이 함께 움직이는지 추적하는 지도입니다.",
    "",
    "## 읽는 순서",
    "",
    "1. 먼저 파일 경로를 봅니다. `tests/`, `deploy/`, `.github/workflows/` 중 어디에 있는지가 이 파일의 책임을 거의 결정합니다.",
    "2. 다음으로 입력을 찾습니다. fixture, 환경 변수, YAML key, GitHub secret, CLI 인자가 어떤 외부 상태를 요구하는지 확인합니다.",
    "3. 마지막으로 산출물을 봅니다. 테스트 결과, JSON 결과, S3 경로, Ray Serve endpoint, 문서 배포처럼 다음 단계가 소비하는 형태를 찾아야 합니다.",
    "",
    "## 코드에서 확인할 지점",
    "",
    ...signals.map((signal) => `- ${signal}`),
    "",
    "## 실무 점검 질문",
    "",
    ...reviewChecklist(item).map((question) => `- ${question}`),
    "",
    "## 자주 생기는 실패",
    "",
    ...commonFailureModes(item).map((mode) => `- ${mode}`),
    "",
    "## 학습 포인트",
    "",
    "이 파일을 이해했다는 것은 모든 줄을 암기했다는 뜻이 아닙니다. 어떤 변경이 들어오면 테스트, 원격 job, service rollout, 리뷰 코멘트 중 어디가 영향을 받는지 말할 수 있어야 합니다. 특히 6번 이후 모듈은 “코드를 잘 작성한다”에서 끝나지 않고, 그 코드가 클러스터에서 실행되고, 결과가 저장되고, PR과 배포 파이프라인에서 검증되는 전체 경로를 다룹니다.",
    "",
    "실무에서는 이 파일 하나만 바꾸는 경우보다 주변 파일과 함께 바뀌는 경우가 많습니다. 테스트 파일을 바꾸면 fixture와 dataset contract를 같이 보고, 배포 YAML을 바꾸면 workflow와 service entrypoint를 같이 봐야 합니다. 이 연결 관계를 읽는 능력이 후반부 레슨의 핵심입니다.",
    "",
    `## 소스 파일: \`${item.path}\``,
    "",
    "```" + lang,
    source,
    "```",
  ].join("\n");
}

function notebookLessonMarkdown(srcDir: string, item: SourceItem, expanded = false): string {
  const raw = readFileSync(join(srcDir, item.path), "utf8");
  const notebook = JSON.parse(raw) as {
    cells?: Array<{ cell_type?: string; source?: string[] | string }>;
  };
  const cells = notebook.cells ?? [];
  const markdownCells = cells.filter((cell) => cell.cell_type === "markdown").length;
  const codeCells = cells.filter((cell) => cell.cell_type === "code").length;
  if (expanded) {
    return [
      `이 레슨은 upstream 탐색 노트북 \`${item.path}\`을 프로덕션 코드의 배경 자료로 읽습니다.`,
      "",
      `**핵심 초점:** ${item.focus}`,
      "",
      "## 왜 노트북을 다시 봐야 하나",
      "",
      operationalContext(item),
      "",
      "노트북은 최종 운영 경계가 아니지만, 데이터와 모델 설계가 어떤 실험에서 출발했는지 알려 줍니다. 스크립트 레슨에서는 함수와 CLI 경계를 보지만, 노트북에서는 데이터 분포를 훑고, 중간 결과를 눈으로 확인하고, 어떤 가정이 코드로 굳어졌는지 추적할 수 있습니다.",
      "",
      "## 읽는 순서",
      "",
      `- 경로: \`${item.path}\``,
      `- Markdown 셀: ${markdownCells}개`,
      `- 코드 셀: ${codeCells}개`,
      `- Upstream 노트북: [${item.path}](${BLOB}${item.path})`,
      "",
      "1. 노트북의 markdown 셀에서 실험 목적과 데이터 가정을 먼저 확인합니다.",
      "2. 코드 셀에서 어떤 전처리와 모델 호출이 반복되는지 봅니다.",
      "3. 같은 로직이 `madewithml/` 모듈과 `deploy/` 스크립트로 어떻게 이동했는지 비교합니다.",
      "",
      "## 실무 점검 질문",
      "",
      ...reviewChecklist(item).map((question) => `- ${question}`),
      "",
      "## 자주 생기는 실패",
      "",
      ...commonFailureModes(item).map((mode) => `- ${mode}`),
      "",
      "## 운영 코드와 연결하기",
      "",
      "노트북에서 확인한 가정은 결국 `madewithml/data.py`, `madewithml/train.py`, `madewithml/evaluate.py`, `deploy/jobs/workloads.sh` 같은 스크립트로 이동해야 합니다. 이때 중요한 것은 셀의 결과를 그대로 복사하는 것이 아니라, 반복 가능한 입력, 명확한 출력, 실패 시 확인할 로그를 갖춘 실행 경계로 바꾸는 것입니다.",
      "",
      "특히 후반부 모듈에서는 노트북을 “학습 자료”로만 보지 않고 운영 리스크의 출발점으로 봅니다. 탐색 중 정한 label mapping, 전처리 순서, metric 선택, threshold 가정이 운영 코드와 다르면 모델은 학습 때와 다른 입력을 받게 됩니다. 그래서 노트북을 읽을 때는 어떤 셀이 최종 코드로 승격되었고, 어떤 셀은 실험 기록으로만 남았는지 구분해야 합니다.",
      "",
      "운영 코드로 승격할 때는 세 가지를 확인합니다. 첫째, 셀 실행 순서에 의존하던 상태가 함수 인자나 설정 파일로 이동했는지 봅니다. 둘째, 사람이 눈으로 보던 중간 결과가 테스트나 metric으로 고정되었는지 봅니다. 셋째, 노트북에서만 쓰던 로컬 경로와 임시 파일이 job과 CI에서도 접근 가능한 경로로 바뀌었는지 확인합니다.",
      "",
      "노트북은 배포 대상이 아니라 의사결정 기록입니다. 그래서 레슨의 목표는 notebook JSON을 그대로 읽는 것이 아니라, 탐색에서 운영 코드로 이동하면서 어떤 가정이 유지되고 어떤 부분이 자동화되었는지 설명할 수 있게 되는 것입니다.",
    ].join("\n");
  }
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

  function buildSourceLessons(slug: string, items: SourceItem[]): Lesson[] {
    return items.map((item) => {
      const lessonSlug = item.slug ?? slugify(item.path);
      const expanded = slug === "testing-quality" || slug === "deployment-ops";
      const body =
        item.path.endsWith(".ipynb")
          ? notebookLessonMarkdown(srcDir, item, expanded)
          : expanded
            ? expandedSourceLessonMarkdown(item, readSource(srcDir, item.path))
            : compactSourceLessonMarkdown(item, readSource(srcDir, item.path));
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

  function sourceExcerpt(path: string, source: string): string {
    const lang = languageFor(path);
    const maxLines = path.endsWith(".sh") || path.endsWith(".py") ? 90 : 80;
    const lines = source.split("\n").slice(0, maxLines).join("\n").trim();
    return ["```" + lang, lines, "```"].join("\n");
  }

  function relatedLessonLinks(slugs: string[]): string[] {
    return slugs.map(
      (slug) => `- [${slug}](https://madewithml.com/courses/mlops/${slug}/)`,
    );
  }

  function productionLessonMarkdown(item: ProductionItem): string {
    const section = findSection(item.h);
    const hasReadmeSection = Boolean(section?.body.trim());
    const sourceSections = (item.sources ?? []).map((sourceItem) => {
      const source = readSource(srcDir, sourceItem.path);
      return [
        `### \`${sourceItem.path}\``,
        "",
        sourceItem.focus,
        "",
        operationalContext(sourceItem),
        "",
        "확인할 신호:",
        "",
        ...extractCodeSignals(sourceItem.path, source)
          .slice(0, 6)
          .map((signal) => `- ${signal}`),
        "",
        sourceExcerpt(sourceItem.path, source),
      ].join("\n");
    });

    return [
      `이 레슨은 프로덕션 단계의 \`${item.slug}\` 경계를 Made With ML 운영 흐름 안에서 다시 풀어 읽습니다.`,
      "",
      `**운영 목표:** ${item.objective}`,
      "",
      "## 왜 이 단계가 필요한가",
      "",
      "1~5번 모듈에서는 데이터, 모델, 서빙 코드가 어떻게 만들어지는지 확인했습니다. 6번 이후부터는 그 코드가 실제 운영 환경에서 반복 실행되고, 검증되고, 배포되는 과정을 다룹니다. 이 단계는 단순 명령 모음이 아니라 자격 증명, 클러스터 환경, 컴퓨트 자원, batch job, service rollout, CI/CD, 지속 학습이 서로 맞물리는 운영 계약입니다.",
      "",
      "이 레슨을 읽을 때는 “명령을 어떤 순서로 치는가”보다 “이 명령이 어떤 상태를 만들고 다음 단계가 그 상태를 어떻게 소비하는가”를 봐야 합니다. 예를 들어 job은 결과 파일과 model registry를 만들고, service는 그 registry를 읽어 endpoint를 열며, CI/CD는 이 흐름을 PR과 main branch 이벤트에 연결합니다.",
      "",
      "## 공식 README 원문 맥락",
      "",
      hasReadmeSection
        ? "upstream README에도 이 단계가 production 실행 순서의 일부로 등장합니다. 다만 README는 빠른 실행 명령 중심이라 학습 화면에서는 운영 목적, 앞뒤 연결, 실패 지점을 한국어 해설로 보강해 읽습니다."
        : "upstream README에는 이 항목만 길게 풀린 독립 섹션이 없으므로, 관련 공식 레슨과 배포 파일을 기준으로 운영 맥락을 보강합니다.",
      "",
      "## 함께 읽을 공식 레슨",
      "",
      ...relatedLessonLinks(item.relatedLessons),
      "",
      "## 운영 체크포인트",
      "",
      "- 이 단계가 요구하는 secret, 환경 변수, project id, bucket path가 어디에서 주입되는지 확인합니다.",
      "- 실패했을 때 사람이 볼 수 있는 결과가 어디에 남는지 확인합니다. 로컬 로그, S3 결과 파일, GitHub PR 코멘트, service status가 대표적인 관찰 지점입니다.",
      "- 이 단계의 산출물이 다음 단계의 입력과 연결되는지 확인합니다. 모델 registry, `run_id.txt`, JSON 결과, Ray Serve import path, cluster env 이름 같은 값이 끊기면 운영 흐름이 멈춥니다.",
      "- 설정을 바꿀 때 비용과 안정성이 같이 움직이는지 봅니다. GPU instance, worker 수, rollout 전략, retry 정책은 모두 기능 변경만큼 중요한 운영 변경입니다.",
      "- 인증 정보는 코드에 넣지 않고 실행 환경이나 CI secret에서 주입합니다. 인증이 실패하면 학습 코드 문제가 아니라 cloud 권한, token 만료, role 범위 문제일 수 있으므로 로그를 분리해서 봐야 합니다.",
      "- 운영 레슨을 읽을 때는 한 단계만 보지 말고 이전 단계의 산출물과 다음 단계의 소비자를 함께 확인합니다. 이 연결을 놓치면 명령은 성공했는데 서비스가 갱신되지 않는 상태가 생깁니다.",
      "",
      "## 관련 소스 파일",
      "",
      ...(sourceSections.length > 0
        ? sourceSections
        : [
            "이 단계는 별도 파일 하나보다 여러 운영 경계의 연결 방식이 핵심입니다. 관련 레슨의 `jobs-and-services`, `cicd`, `monitoring`, `data-engineering`을 함께 보면서 어떤 이벤트가 새 학습과 재배포를 촉발하는지 추적하세요.",
          ]),
      "",
      "## 학습 기준",
      "",
      "이 레슨을 마친 뒤에는 명령어를 외우는 대신, 변경이 들어왔을 때 어떤 단계까지 다시 실행해야 하는지 설명할 수 있어야 합니다. 인증이 바뀌면 job과 GitHub Actions가 영향을 받고, cluster image가 바뀌면 학습과 서빙 모두 재검증해야 하며, monitoring이나 data pipeline이 바뀌면 지속 학습 trigger와 평가 기준을 같이 봐야 합니다. 이것이 프로덕션 MLOps를 단순 배포 문서가 아니라 운영 시스템으로 읽는 기준입니다.",
    ].join("\n");
  }

  function buildProductionModule(): Module {
    const lessons = PRODUCTION_ITEMS.map((item) => {
      const body = productionLessonMarkdown(item).trim();
      lessonOrder += 1;
      return {
        id: `${TRACK_SLUG}__production__${item.slug}`,
        slug: item.slug,
        title: item.title,
        order: lessonOrder,
        estMinutes: estimateMinutes(body),
        contentMarkdown: body,
        sourceRepo: SOURCE_REPO,
        sourceUrl: "https://madewithml.com/",
        license: LICENSE,
      } satisfies Lesson;
    });

    return {
      id: `${TRACK_SLUG}__production`,
      slug: "production",
      title: "프로덕션 MLOps",
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
    buildProductionModule(),
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
