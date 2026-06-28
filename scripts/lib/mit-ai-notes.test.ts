import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMitSourcePacket,
  formatLectureNoteMarkdown,
  isFatalGenerationError,
  isRetryableGenerationError,
  isMitVideoLesson,
  resolveMitModelConfig,
  validateMitLessonQuality,
} from "./mit-ai-notes";

const videoLesson = {
  id: "mit-ai__ai-6034__lecture-1-introduction-and-scope",
  slug: "lecture-1-introduction-and-scope",
  title: "Lecture 1: Introduction and Scope",
  order: 1,
  estMinutes: 50,
  contentMarkdown: [
    "**인공지능 — 고전 AI (6.034) · Lecture 1: Introduction and Scope**",
    "",
    '<div class="video-embed"><iframe src="https://www.youtube.com/embed/TjZBTDzGeGg"></iframe></div>',
    "",
    "위 영상은 MIT OpenCourseWare가 공개한 강의입니다.",
  ].join("\n"),
  sourceRepo: "MIT OpenCourseWare",
  sourceUrl:
    "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/resources/lecture-1-introduction-and-scope/",
  license: "CC BY-NC-SA 4.0",
};

const courseModule = {
  id: "mit-ai__ai-6034",
  slug: "ai-6034",
  title: "01 · 인공지능 — 고전 AI (6.034)",
  order: 1,
  lessons: [videoLesson],
};

test("detects MIT video lessons by id and embedded YouTube iframe", () => {
  assert.equal(isMitVideoLesson(videoLesson), true);
  assert.equal(isMitVideoLesson({ ...videoLesson, id: "python__x__y" }), false);
  assert.equal(isMitVideoLesson({ ...videoLesson, contentMarkdown: "한국어 소개" }), false);
});

test("builds source packet with module and source context", () => {
  const packet = buildMitSourcePacket(videoLesson, courseModule);
  assert.equal(packet.lessonId, videoLesson.id);
  assert.equal(packet.moduleTitle, courseModule.title);
  assert.equal(packet.sourceUrl, videoLesson.sourceUrl);
  assert.match(packet.existingMarkdown, /youtube\.com\/embed/);
});

test("formats compact Korean lecture notes while preserving iframe and source URL", () => {
  const markdown = formatLectureNoteMarkdown(videoLesson, {
    guidingQuestion: "AI 강의의 범위와 학습 관점을 어떻게 잡을 것인가?",
    flow: ["강의의 목적을 설명한다.", "AI의 주요 문제 영역을 훑는다."],
    concepts: [
      { term: "고전 AI", explanation: "탐색과 표현을 중심으로 지능을 설계하는 접근입니다." },
      { term: "문제 해결", explanation: "목표 상태에 도달하는 절차를 계산적으로 구성합니다." },
      { term: "학습", explanation: "경험에서 규칙이나 패턴을 얻는 과정입니다." },
    ],
    watchFocus: ["강사가 AI를 한 문장으로 정의하는 부분을 확인하세요."],
    reviewQuestions: ["이 강의가 딥러닝 이전의 AI를 이해하는 데 왜 중요한가?"],
    sourceLimitNote: "이 노트는 강의 제목과 OCW 맥락을 바탕으로 만든 시청 가이드입니다.",
  });

  assert.match(markdown, /youtube\.com\/embed\/TjZBTDzGeGg/);
  assert.match(markdown, /## 이 강의에서 다루는 질문/);
  assert.match(markdown, /## 핵심 개념/);
  assert.match(markdown, /https:\/\/ocw\.mit\.edu/);
});

test("validates generated MIT note quality", () => {
  const markdown = formatLectureNoteMarkdown(videoLesson, {
    guidingQuestion: "AI 강의의 범위와 학습 관점을 어떻게 잡을 것인가?",
    flow: ["강의의 목적을 설명한다.", "AI의 주요 문제 영역을 훑는다.", "앞으로 이어질 학습 경로를 잡는다."],
    concepts: [
      { term: "고전 AI", explanation: "탐색과 표현을 중심으로 지능을 설계하는 접근입니다." },
      { term: "문제 해결", explanation: "목표 상태에 도달하는 절차를 계산적으로 구성합니다." },
      { term: "학습", explanation: "경험에서 규칙이나 패턴을 얻는 과정입니다." },
      { term: "지식 표현", explanation: "세상의 정보를 기계가 다룰 수 있게 구조화합니다." },
    ],
    watchFocus: ["강사가 AI를 한 문장으로 정의하는 부분을 확인하세요.", "예시가 어떤 문제 유형을 대표하는지 보세요."],
    reviewQuestions: ["이 강의가 딥러닝 이전의 AI를 이해하는 데 왜 중요한가?", "AI 시스템을 구조로 보는 관점은 어디에 쓰이는가?"],
    sourceLimitNote: "이 노트는 강의 제목과 OCW 맥락을 바탕으로 만든 시청 가이드입니다.",
  });

  assert.deepEqual(validateMitLessonQuality(videoLesson.id, markdown), []);
  assert.ok(validateMitLessonQuality(videoLesson.id, "iframe only").length > 0);
});

test("classifies schema mismatch generation failures as retryable", () => {
  assert.equal(
    isRetryableGenerationError(new Error("No object generated: response did not match schema.")),
    true,
  );
  assert.equal(isRetryableGenerationError(new Error("No ANTHROPIC_API_KEY found.")), false);
});

test("classifies billing and auth generation failures as fatal", () => {
  assert.equal(
    isFatalGenerationError(
      new Error("Your credit balance is too low to access the Anthropic API."),
    ),
    true,
  );
  assert.equal(
    isFatalGenerationError(
      new Error("You exceeded your current quota, please check your plan and billing details."),
    ),
    true,
  );
  assert.equal(isFatalGenerationError(new Error("401 invalid x-api-key")), true);
  assert.equal(isFatalGenerationError(new Error("response did not match schema")), false);
});

test("prefers OpenAI API key when resolving MIT generation provider", () => {
  assert.deepEqual(
    resolveMitModelConfig({
      OPENAI_API_KEY: "openai-key",
      ANTHROPIC_API_KEY: "anthropic-key",
    }),
    {
      provider: "openai",
      model: "gpt-4.1-mini",
      apiKey: "openai-key",
    },
  );
});

test("allows explicit MIT model and provider override", () => {
  assert.deepEqual(
    resolveMitModelConfig({
      MIT_AI_PROVIDER: "anthropic",
      MIT_AI_MODEL: "claude-sonnet-4-6",
      OPENAI_API_KEY: "openai-key",
      ANTHROPIC_API_KEY: "anthropic-key",
    }),
    {
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      apiKey: "anthropic-key",
    },
  );
});
