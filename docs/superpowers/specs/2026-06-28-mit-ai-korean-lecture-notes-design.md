# MIT AI Korean Lecture Notes Design

## Decision

MIT AI lessons should become Korean study notes, not transcript dumps.

The track has 124 lessons:

- 21 authored guide lessons with Korean prose.
- 103 OCW lecture video lessons whose body is currently only a video embed and generic Korean viewing note.

All 124 lessons need enrichment metadata and quizzes. The 103 video lessons also need Korean lecture-note bodies that help a learner preview, watch, and review the lecture without replacing the lecture itself.

## Scope

In scope:

- Generate Korean enrichment metadata for every `mit-ai__...` lesson:
  - `summary`
  - `objectives`
  - `keyConcepts`
- Generate 3 to 5 Korean multiple-choice quiz questions per MIT lesson.
- Replace video-only MIT lecture bodies with compact Korean lecture notes plus the existing embedded video.
- Preserve MIT OCW source URLs, YouTube embeds, and license attribution.
- Keep generated content committed under `content/generated/`.

Out of scope:

- Full Korean transcript translation.
- Copying large OCW text verbatim.
- Changing the lesson page UI.
- Adding runtime AI calls to the learner-facing app.

## Content Shape

Each MIT lecture video lesson should use this structure:

1. Embedded video.
2. `## 이 강의에서 다루는 질문`
3. `## 강의 흐름`
4. `## 핵심 개념`
5. `## 볼 때 집중할 지점`
6. `## 보고 나서 확인할 질문`
7. Source and license note.

Target length for generated lecture notes is roughly 1,500 to 3,000 Korean characters per video lesson. This is long enough to be useful and short enough to avoid turning the site into a transcript archive.

Guide lessons keep their current authored Korean body unless the generation script is run in a force mode. They still receive enrichment and quiz entries.

## Source Strategy

The generation script should prefer source-grounded inputs in this order:

1. Existing lesson body.
2. OCW lecture title, course title, source URL, and module context.
3. Optional local source cache if later added under `content/sources/mit-ai/`.

If a lecture has no transcript or detailed local notes, the generated note must be framed as a study guide derived from the title and course context, not as a complete lecture summary.

## Implementation Shape

Add a MIT-specific script rather than overloading the generic `scripts/enrich.ts`.

The script should:

- Load `content/generated/tracks/mit-ai.json`.
- Identify all MIT lessons.
- Build a source packet per lesson.
- Generate structured Korean lecture notes, enrichment, and quiz via the existing AI SDK stack.
- Persist after each lesson.
- Be idempotent by default.
- Support `--only=<lesson-id-substring>` and `--force`.
- Avoid modifying non-MIT entries in `content/generated/enrichments.json`, `quizzes.json`, and `translations.json`.

## Verification

Add a content verifier for MIT AI that checks:

- All 124 MIT lessons have enrichment.
- All 124 MIT lessons have at least 3 quiz questions.
- All 103 video lessons have Korean lecture-note sections beyond the iframe.
- Video embeds and source URLs are preserved.
- Generated Korean prose exists outside code, HTML, and URLs.

Run:

```bash
pnpm verify:content
pnpm lint
```

If generated content is not produced because API keys or network access are unavailable, the implementation should still ship the generator and verifier, with clear instructions for the exact generation command.

