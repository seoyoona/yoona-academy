export type CoursePage = {
  slug: string;
  title: string;
  moduleSlug: string;
  moduleTitle: string;
  koreanTitle: string;
};

export const MADE_WITH_ML_COURSE_BASE = "https://madewithml.com/courses/mlops/";

export const MADE_WITH_ML_COURSE_PAGES: CoursePage[] = [
  {
    slug: "setup",
    title: "Setup",
    koreanTitle: "개발 환경 셋업",
    moduleSlug: "setup",
    moduleTitle: "환경 셋업",
  },
  {
    slug: "product-design",
    title: "Product design",
    koreanTitle: "ML 제품 설계",
    moduleSlug: "foundations",
    moduleTitle: "ML 시스템 기초",
  },
  {
    slug: "systems-design",
    title: "Systems design",
    koreanTitle: "ML 시스템 설계",
    moduleSlug: "foundations",
    moduleTitle: "ML 시스템 기초",
  },
  {
    slug: "preparation",
    title: "Data preparation",
    koreanTitle: "데이터 준비",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "exploratory-data-analysis",
    title: "Exploratory data analysis",
    koreanTitle: "탐색적 데이터 분석",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "preprocessing",
    title: "Preprocessing",
    koreanTitle: "전처리",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "distributed-data",
    title: "Distributed data processing",
    koreanTitle: "분산 데이터 처리",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "training",
    title: "Distributed training",
    koreanTitle: "분산 학습",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "experiment-tracking",
    title: "Experiment tracking",
    koreanTitle: "실험 추적",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "tuning",
    title: "Tuning",
    koreanTitle: "하이퍼파라미터 튜닝",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "evaluation",
    title: "Evaluation",
    koreanTitle: "모델 평가",
    moduleSlug: "development",
    moduleTitle: "데이터와 모델 개발",
  },
  {
    slug: "serving",
    title: "Serving",
    koreanTitle: "모델 서빙",
    moduleSlug: "serving",
    moduleTitle: "서빙과 인터페이스",
  },
  {
    slug: "scripting",
    title: "Scripting",
    koreanTitle: "스크립트화",
    moduleSlug: "serving",
    moduleTitle: "서빙과 인터페이스",
  },
  {
    slug: "cli",
    title: "Command-line interface",
    koreanTitle: "CLI 설계",
    moduleSlug: "serving",
    moduleTitle: "서빙과 인터페이스",
  },
  {
    slug: "logging",
    title: "Logging",
    koreanTitle: "로깅",
    moduleSlug: "serving",
    moduleTitle: "서빙과 인터페이스",
  },
  {
    slug: "documentation",
    title: "Documentation",
    koreanTitle: "문서화",
    moduleSlug: "testing-quality",
    moduleTitle: "테스트와 품질",
  },
  {
    slug: "styling",
    title: "Code styling",
    koreanTitle: "코드 스타일링",
    moduleSlug: "testing-quality",
    moduleTitle: "테스트와 품질",
  },
  {
    slug: "pre-commit",
    title: "Pre-commit",
    koreanTitle: "Pre-commit 품질 게이트",
    moduleSlug: "testing-quality",
    moduleTitle: "테스트와 품질",
  },
  {
    slug: "testing",
    title: "Testing",
    koreanTitle: "테스트 전략",
    moduleSlug: "testing-quality",
    moduleTitle: "테스트와 품질",
  },
  {
    slug: "versioning",
    title: "Versioning",
    koreanTitle: "데이터와 모델 버전 관리",
    moduleSlug: "testing-quality",
    moduleTitle: "테스트와 품질",
  },
  {
    slug: "jobs-and-services",
    title: "Jobs and services",
    koreanTitle: "Jobs와 Services",
    moduleSlug: "deployment-ops",
    moduleTitle: "배포 운영",
  },
  {
    slug: "cicd",
    title: "CI/CD",
    koreanTitle: "CI/CD 파이프라인",
    moduleSlug: "deployment-ops",
    moduleTitle: "배포 운영",
  },
  {
    slug: "monitoring",
    title: "Monitoring",
    koreanTitle: "모니터링",
    moduleSlug: "deployment-ops",
    moduleTitle: "배포 운영",
  },
  {
    slug: "data-engineering",
    title: "Data engineering",
    koreanTitle: "데이터 엔지니어링",
    moduleSlug: "deployment-ops",
    moduleTitle: "배포 운영",
  },
];

export function courseUrl(slug: string): string {
  return `${MADE_WITH_ML_COURSE_BASE}${slug}/`;
}

function decodeHtml(input: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name] ?? match);
}

function stripTags(input: string): string {
  return decodeHtml(input.replace(/<[^>]*>/g, ""));
}

function stripTagsOutsideFences(input: string): string {
  return input
    .split(/(```[\s\S]*?```)/g)
    .map((part) => (part.startsWith("```") ? part : part.replace(/<[^>]*>/g, "")))
    .join("");
}

function absoluteUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function inferFenceLanguage(code: string): string {
  const trimmed = code.trim();
  if (/^(export|curl|python|pip|git|anyscale|ray|mlflow|pytest|mkdocs)\b/m.test(trimmed)) {
    return "bash";
  }
  if (/^(base_image|env_vars|cloud|head_node_type|worker_node_types|applications):/m.test(trimmed)) {
    return "yaml";
  }
  if (/^(import|from|def|class|@serve|with open|\w+\s*=)/m.test(trimmed)) {
    return "python";
  }
  if (/^\{[\s\S]*\}$/.test(trimmed) || /^\[[\s\S]*\]$/.test(trimmed)) {
    return "json";
  }
  return "";
}

function codeBlockMarkdown(codeHtml: string): string {
  const code = stripTags(codeHtml)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trimEnd();
  const lang = inferFenceLanguage(code);
  return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
}

function replaceCodeBlocks(html: string): string {
  return html.replace(
    /<div class="highlight">[\s\S]*?<td class="code">[\s\S]*?<code>([\s\S]*?)<\/code>[\s\S]*?<\/table><\/div>/g,
    (_, codeHtml: string) => codeBlockMarkdown(codeHtml),
  );
}

function replaceLinks(html: string, baseUrl: string): string {
  return html
    .replace(
      /<a\b([^>]*?)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g,
      (_, _before: string, href: string, _after: string, labelHtml: string) => {
        const label = stripTags(labelHtml).trim();
        if (!label) return "";
        return `[${label}](${absoluteUrl(href, baseUrl)})`;
      },
    )
    .replace(
      /<img\b([^>]*?)src="([^"]+)"([^>]*)>/g,
      (_, before: string, src: string, after: string) => {
        const alt = (before + after).match(/alt="([^"]*)"/)?.[1] ?? "";
        return `![${decodeHtml(alt)}](${absoluteUrl(src, baseUrl)})`;
      },
    );
}

function htmlBlocksToMarkdown(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, "\n")
    .replace(/<script[\s\S]*?<\/script>/g, "\n")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, "\n# $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, "\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, "\n### $1\n\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, "\n#### $1\n\n")
    .replace(/<p class="admonition-title">([\s\S]*?)<\/p>/g, "\n> **$1**\n\n")
    .replace(/<blockquote[^>]*>/g, "\n> ")
    .replace(/<\/blockquote>/g, "\n\n")
    .replace(/<li[^>]*>/g, "\n- ")
    .replace(/<\/li>/g, "\n")
    .replace(/<\/?(ul|ol)[^>]*>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/p>/g, "\n\n")
    .replace(/<p[^>]*>/g, "\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/g, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, "*$1*")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/g, "*$1*")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, "`$1`")
    .replace(/<\/(div|section|article|details|summary)>/g, "\n\n")
    .replace(/<(div|section|article|details|summary)[^>]*>/g, "\n\n")
    .replace(/<tr[^>]*>/g, "\n| ")
    .replace(/<\/tr>/g, " |\n")
    .replace(/<\/(td|th)>/g, " | ")
    .replace(/<(td|th)[^>]*>/g, "")
    .replace(/<\/?t(head|body|able)[^>]*>/g, "\n");
}

function cleanMarkdown(markdown: string): string {
  const lines = decodeHtml(stripTagsOutsideFences(markdown))
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""));
  const out: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const normalized = line.replace(/\s+/g, " ").trim();
    if (normalized === "[View all lessons](https://madewithml.com/courses/mlops)") continue;
    if (normalized === "![Goku Mohandas](https://madewithml.com/static/images/goku_circle.png)") continue;
    if (normalized === "Goku Mohandas") continue;
    if (normalized === "·" || normalized === "×" || normalized === "**") continue;
    if (normalized === "**Subscribe") continue;
    if (line.includes("Receive new lessons straight to your inbox")) continue;
    if (line.includes("Subscribe to our newsletter")) continue;
    if (line.includes("developers in learning how to responsibly deliver value with ML")) continue;
    if (/^\[Repository\]\(/.test(line)) continue;
    if (/^---+$/.test(line)) continue;
    out.push(rawLine);
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .trim();
}

export function extractCourseMarkdown(html: string, url: string): string {
  const article =
    html.match(/<article class="md-content__inner md-typeset">([\s\S]*?)<\/article>/)?.[1] ??
    html;
  const withCode = replaceCodeBlocks(article);
  const withLinks = replaceLinks(withCode, url);
  const markdown = cleanMarkdown(htmlBlocksToMarkdown(withLinks));
  if (markdown.length < 1000) {
    throw new Error(`Extracted markdown for ${url} is too short (${markdown.length} chars)`);
  }
  return markdown;
}
