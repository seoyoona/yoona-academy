import type { Lesson, Module } from "../../src/content/types";

export const MIT_TRACK_ID = "mit-ai";

export const REQUIRED_LECTURE_NOTE_HEADINGS = [
  "## 이 강의에서 다루는 질문",
  "## 강의 흐름",
  "## 핵심 개념",
  "## 볼 때 집중할 지점",
  "## 보고 나서 확인할 질문",
] as const;

export type MitConcept = {
  term: string;
  explanation: string;
};

export type MitLectureNote = {
  guidingQuestion: string;
  flow: string[];
  concepts: MitConcept[];
  watchFocus: string[];
  reviewQuestions: string[];
  sourceLimitNote: string;
};

export type MitSourcePacket = {
  lessonId: string;
  title: string;
  moduleTitle: string;
  sourceUrl: string;
  license: string;
  existingMarkdown: string;
  isVideo: boolean;
};

export type MitModelProvider = "openai" | "anthropic";

export type MitModelConfig = {
  provider: MitModelProvider;
  model: string;
  apiKey: string;
};

export type MitModelEnv = Partial<
  Pick<
    NodeJS.ProcessEnv,
    "MIT_AI_PROVIDER" | "MIT_AI_MODEL" | "OPENAI_API_KEY" | "ANTHROPIC_API_KEY"
  >
>;

export function isMitLessonId(id: string): boolean {
  return id.startsWith(`${MIT_TRACK_ID}__`);
}

export function isMitVideoLesson(
  lesson: Pick<Lesson, "id" | "contentMarkdown">,
): boolean {
  return isMitLessonId(lesson.id) && /youtube(?:-nocookie)?\.com\/embed\//.test(lesson.contentMarkdown);
}

export function buildMitSourcePacket(lesson: Lesson, module: Module): MitSourcePacket {
  return {
    lessonId: lesson.id,
    title: lesson.title,
    moduleTitle: module.title,
    sourceUrl: lesson.sourceUrl,
    license: lesson.license,
    existingMarkdown: lesson.contentMarkdown,
    isVideo: isMitVideoLesson(lesson),
  };
}

export function formatLectureNoteMarkdown(lesson: Lesson, note: MitLectureNote): string {
  const titleLine = extractTitleLine(lesson);
  const embed = extractVideoEmbed(lesson.contentMarkdown);
  const flow = bulletList(note.flow);
  const concepts = note.concepts
    .map((concept) => `- **${cleanInline(concept.term)}**: ${cleanInline(concept.explanation)}`)
    .join("\n");
  const watchFocus = bulletList(note.watchFocus);
  const reviewQuestions = bulletList(note.reviewQuestions);

  return [
    titleLine,
    "",
    embed,
    "",
    "## 이 강의에서 다루는 질문",
    "",
    cleanBlock(note.guidingQuestion),
    "",
    "## 강의 흐름",
    "",
    flow,
    "",
    "## 핵심 개념",
    "",
    concepts,
    "",
    "## 볼 때 집중할 지점",
    "",
    watchFocus,
    "",
    "## 보고 나서 확인할 질문",
    "",
    reviewQuestions,
    "",
    "> " + cleanBlock(note.sourceLimitNote),
    "",
    `원본 강의 자료와 회차별 리소스는 [MIT OpenCourseWare 강의 페이지](${lesson.sourceUrl})에서 확인할 수 있습니다. 이 자료의 출처는 ${lesson.sourceRepo}이며 라이선스는 ${lesson.license}입니다.`,
  ].join("\n");
}

export function validateMitLessonQuality(lessonId: string, markdown: string): string[] {
  const failures: string[] = [];
  if (!isMitLessonId(lessonId)) return failures;

  for (const heading of REQUIRED_LECTURE_NOTE_HEADINGS) {
    if (!markdown.includes(heading)) {
      failures.push(`missing required section "${heading}"`);
    }
  }
  if (!/youtube(?:-nocookie)?\.com\/embed\//.test(markdown)) {
    failures.push("missing YouTube embed");
  }
  if (!/https:\/\/ocw\.mit\.edu\//.test(markdown)) {
    failures.push("missing OCW source URL");
  }
  const prose = stripMarkupUrlsAndCode(markdown);
  if ((prose.match(/[가-힣]/g) ?? []).length < 80) {
    failures.push("not enough Korean prose");
  }
  if (markdown.length < 600) {
    failures.push("lecture note is too short");
  }
  return failures;
}

export function stripMarkupUrlsAndCode(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
}

export function isRetryableGenerationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /No object generated|did not match schema|schema/i.test(message);
}

export function isFatalGenerationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /credit balance is too low|current quota|billing details|insufficient[_\s-]?quota|invalid x-api-key|401|403|unauthorized|permission/i.test(
    message,
  );
}

export function resolveMitModelConfig(env: MitModelEnv): MitModelConfig {
  const explicitProvider = normalizeProvider(env.MIT_AI_PROVIDER);
  const provider =
    explicitProvider ??
    (env.OPENAI_API_KEY ? "openai" : env.ANTHROPIC_API_KEY ? "anthropic" : undefined);
  if (!provider) {
    throw new Error("No OPENAI_API_KEY or ANTHROPIC_API_KEY found.");
  }
  const apiKey = provider === "openai" ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(`MIT_AI_PROVIDER=${provider} requires ${provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"}.`);
  }
  return {
    provider,
    model: env.MIT_AI_MODEL || (provider === "openai" ? "gpt-4.1-mini" : "claude-sonnet-4-6"),
    apiKey,
  };
}

function extractTitleLine(lesson: Lesson): string {
  const first = lesson.contentMarkdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("**") && line.endsWith("**"));
  return first || `**${lesson.title}**`;
}

function normalizeProvider(value: string | undefined): MitModelProvider | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "openai" || normalized === "anthropic") return normalized;
  throw new Error(`Unsupported MIT_AI_PROVIDER "${value}". Use "openai" or "anthropic".`);
}

function extractVideoEmbed(markdown: string): string {
  const block = markdown.match(/<div class="video-embed"[\s\S]*?<\/div>/);
  if (block) return block[0].trim();

  const iframe = markdown.match(/<iframe[\s\S]*?<\/iframe>/);
  if (iframe) {
    return [
      '<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1.25rem 0;background:#000">',
      `  ${iframe[0].trim()}`,
      "</div>",
    ].join("\n");
  }

  throw new Error(`MIT video lesson is missing iframe embed`);
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${cleanInline(item)}`).join("\n");
}

function cleanInline(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanBlock(value: string): string {
  return value
    .split(/\n+/)
    .map((line) => cleanInline(line))
    .filter(Boolean)
    .join("\n\n");
}
