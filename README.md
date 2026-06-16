# Yoona Academy

오픈소스 학습 자료를 인강 수준의 구조화된 코스로 만들어주는 개인 학습 플랫폼.
커리큘럼 · AI 튜터 · 자동 채점 퀴즈를 갖춘 Next.js 앱 (Vercel 배포).

## 트랙
- 🐍 **30일 파이썬 마스터** — `30-Days-Of-Python` 기반, 4개 모듈 · 30개 레슨
- 🤖 **ML 엔지니어링 & MLOps** — `Made-With-ML` 기반, 5개 모듈 · 21개 레슨
- 📚 **리소스 라이브러리** — `project-based-learning` · `awesome-machine-learning` · CS229 (907개)

## 아키텍처
- **콘텐츠는 빌드타임에 JSON으로 생성** (`content/generated/`) → DB 없이도 읽기/탐색 동작
- **DB(Neon) + 인증(Clerk)** 은 "계정 모드"(진도 동기화·공유)에서만 필요 — 선택사항
- **AI**(Claude via Vercel AI SDK): 레슨 보강(요약·목표·퀴즈) + 맥락 인지 AI 튜터

```
scripts/ingest/   5개 저장소 → 정규화된 Track/Module/Lesson + Resource (커밋됨)
scripts/enrich.ts 레슨별 학습목표·요약·핵심개념·퀴즈 생성 (Claude, 멱등·캐시)
src/content/      스키마(zod) + 로더
src/app/          /  ·  /tracks  ·  /tracks/[slug]  ·  /learn/[lessonId]  ·  /resources
src/app/api/tutor 스트리밍 AI 튜터 (레슨 맥락 주입)
```

## 개발
```bash
pnpm install
pnpm ingest        # 소스 저장소 파싱 → content/generated (이미 커밋되어 있음)
pnpm enrich        # (선택) ANTHROPIC_API_KEY 필요 — AI 보강·퀴즈 생성
pnpm dev
```

## 환경 변수 (`.env.local`)
| 변수 | 필요 시점 |
|---|---|
| `ANTHROPIC_API_KEY` | AI 튜터 + `pnpm enrich` 보강 스크립트 |
| `DATABASE_URL` | (선택) 계정 모드 — 진도 서버 동기화 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | (선택) 다중 사용자 인증 |

키가 없으면 진도는 브라우저 `localStorage`에 저장되어 단독 사용자로 동작합니다.

## 출처
모든 콘텐츠는 원저작자에게 귀속됩니다 — `/attributions` 참고.
