# MIT AI Korean Lecture Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate Korean lecture-note bodies, enrichment metadata, and quizzes for all MIT AI lessons without turning lecture videos into transcript dumps.

**Architecture:** Keep content generation offline and committed under `content/generated/`. Put deterministic formatting and validation helpers in `scripts/lib/mit-ai-notes.ts`, and put AI/file orchestration in `scripts/enrich-mit-ai.ts`. Extend `scripts/verify-content.ts` so generated MIT content is enforced by the same content verification command.

**Tech Stack:** TypeScript, `tsx`, Node file APIs, Vercel AI SDK, Anthropic provider, Zod, existing JSON content schemas.

---

## File Structure

- Create `scripts/lib/mit-ai-notes.ts`: Pure helpers for detecting MIT video lessons, extracting video embeds, building source packets, formatting note markdown, stripping generated-note sections, and validating Korean note quality.
- Create `scripts/lib/mit-ai-notes.test.ts`: Node test-runner tests for the helper functions.
- Create `scripts/enrich-mit-ai.ts`: Offline generator for MIT-only lecture notes, enrichment entries, and quiz entries.
- Modify `scripts/verify-content.ts`: Keep existing ML checks and add MIT AI checks.
- Modify `package.json`: Add `enrich:mit-ai` and `test:mit-ai-notes` scripts while preserving the existing `verify:content` addition.
- Generated later by command: `content/generated/tracks/mit-ai.json`, `content/generated/enrichments.json`, `content/generated/quizzes.json`.

## Task 1: Add MIT Note Helper Tests

**Files:**

- Create: `scripts/lib/mit-ai-notes.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMitSourcePacket,
  formatLectureNoteMarkdown,
  isMitVideoLesson,
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
  sourceUrl: "https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/resources/lecture-1-introduction-and-scope/",
  license: "CC BY-NC-SA 4.0",
};

const module = {
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
  const packet = buildMitSourcePacket(videoLesson, module);
  assert.equal(packet.lessonId, videoLesson.id);
  assert.equal(packet.moduleTitle, module.title);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec tsx --test scripts/lib/mit-ai-notes.test.ts`

Expected: FAIL because `scripts/lib/mit-ai-notes.ts` does not exist.

## Task 2: Implement MIT Note Helpers

**Files:**

- Create: `scripts/lib/mit-ai-notes.ts`
- Test: `scripts/lib/mit-ai-notes.test.ts`

- [ ] **Step 1: Add helper implementation**

Implement:

- `isMitLessonId(id: string): boolean`
- `isMitVideoLesson(lesson: Pick<Lesson, "id" | "contentMarkdown">): boolean`
- `buildMitSourcePacket(lesson: Lesson, module: Module): MitSourcePacket`
- `formatLectureNoteMarkdown(lesson: Lesson, note: MitLectureNote): string`
- `validateMitLessonQuality(lessonId: string, markdown: string): string[]`

The formatter must preserve the existing iframe HTML and source URL, add the required Korean headings, include the source-limit note, and avoid transcript-like long raw text.

- [ ] **Step 2: Run helper tests**

Run: `pnpm exec tsx --test scripts/lib/mit-ai-notes.test.ts`

Expected: PASS.

## Task 3: Add MIT Generator

**Files:**

- Create: `scripts/enrich-mit-ai.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `enrich:mit-ai` and `test:mit-ai-notes` scripts**

Add:

```json
"enrich:mit-ai": "tsx scripts/enrich-mit-ai.ts",
"test:mit-ai-notes": "tsx --test scripts/lib/mit-ai-notes.test.ts"
```

- [ ] **Step 2: Implement generator**

The generator must:

- Load `.env.local` when available.
- Require `ANTHROPIC_API_KEY` or `AI_GATEWAY_API_KEY`.
- Load only `content/generated/tracks/mit-ai.json`.
- Load and preserve existing `content/generated/enrichments.json` and `content/generated/quizzes.json`.
- Support `--only=<substr>`, `--force`, and `--dry-run`.
- For video lessons, generate `MitLectureNote`, `Enrichment`, and `Quiz`.
- For guide lessons, generate only `Enrichment` and `Quiz` unless `--force-body` is supplied.
- Persist after each successful lesson.
- Never delete non-MIT entries.

- [ ] **Step 3: Smoke test without network**

Run: `pnpm enrich:mit-ai --dry-run --only=mit-ai__ai-6034__lecture-1`

Expected: lists the target lesson and exits without writing generated files.

## Task 4: Extend Content Verification

**Files:**

- Modify: `scripts/verify-content.ts`

- [ ] **Step 1: Add MIT verification helpers**

Add checks that load `content/generated/tracks/mit-ai.json`, `content/generated/enrichments.json`, and `content/generated/quizzes.json`.

Verify:

- MIT track has 124 lessons.
- MIT track has 103 video lessons.
- Every MIT lesson has enrichment with Korean `summary`, at least 2 objectives, and at least 3 key concepts.
- Every MIT lesson has at least 3 quiz questions.
- Every MIT video lesson contains the required Korean note sections.
- Every MIT video lesson still contains a YouTube embed and OCW source URL.

- [ ] **Step 2: Run verifier before generation**

Run: `pnpm verify:content`

Expected: FAIL with MIT missing enrichment/quiz/note messages until generated content exists.

## Task 5: Generate MIT Content

**Files:**

- Modify: `content/generated/tracks/mit-ai.json`
- Modify: `content/generated/enrichments.json`
- Modify: `content/generated/quizzes.json`

- [ ] **Step 1: Run one-lesson pilot**

Run: `pnpm enrich:mit-ai --only=mit-ai__ai-6034__lecture-1-introduction-and-scope`

Expected: writes one video lecture note body, one enrichment entry, and one quiz entry.

- [ ] **Step 2: Verify pilot**

Run: `pnpm verify:content`

Expected: still FAIL because the rest of MIT is missing, but the pilot lesson should not appear in the failure list.

- [ ] **Step 3: Run full MIT generation**

Run: `pnpm enrich:mit-ai`

Expected: fills all missing MIT entries, preserving existing non-MIT content.

- [ ] **Step 4: Verify full content**

Run: `pnpm verify:content`

Expected: PASS for ML and MIT content checks.

## Task 6: Final Verification

**Files:**

- All touched files.

- [ ] **Step 1: Run focused helper tests**

Run: `pnpm test:mit-ai-notes`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: PASS.

- [ ] **Step 3: Inspect diff**

Run: `git diff --stat`

Expected: shows only MIT generator/helper/verifier/package/docs and generated MIT content changes, plus any pre-existing user changes preserved.

