지금까지 Phase 1~6의 개념을 배웠다. 이제 그 개념으로 **실제 코드 저장소를 읽는 법**을 배운다. 개발자가 되라는 게 아니다 — 폴더 구조만 봐도 "이 서비스가 화면·서버·DB·인프라를 어떻게 나눴는지"가 보이게 되는, PM의 읽기 능력이다. 이 레슨은 실전 템플릿(FastAPI full-stack template)을 예로, "코드를 안 짜도 구조를 읽는 법"을 다룬다. 상담에서 개발자가 "폴더 구조 한번 볼게요"라고 할 때 그 뒤에서 일어나는 일을 이해하는 것이 목표다.

**폴더만 봐도 뼈대가 보인다** — 구조↔개념 매핑:

<svg viewBox="0 0 560 200" width="100%" style="max-width:560px;height:auto;display:block;margin:10px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="폴더 구조가 화면 API DB 설정 배포 개념으로 매핑되는 관계">
  <text x="120" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">폴더/파일</text>
  <text x="430" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">→ 개념(Phase)</text>
  <text x="20" y="50" font-size="10" fill="#0f172a" font-family="monospace">frontend/</text>
  <text x="360" y="50" font-size="10" fill="#0ea5e9">화면 (Phase 1)</text>
  <text x="20" y="74" font-size="10" fill="#0f172a" font-family="monospace">backend/app/api/</text>
  <text x="360" y="74" font-size="10" fill="#6366f1">API 엔드포인트 (Phase 2)</text>
  <text x="20" y="98" font-size="10" fill="#0f172a" font-family="monospace">backend/app/models.py</text>
  <text x="360" y="98" font-size="10" fill="#8b5cf6">DB 표·ERD (Phase 3)</text>
  <text x="20" y="122" font-size="10" fill="#0f172a" font-family="monospace">.env.example</text>
  <text x="360" y="122" font-size="10" fill="#f59e0b">환경변수 목록 (Phase 5)</text>
  <text x="20" y="146" font-size="10" fill="#0f172a" font-family="monospace">Dockerfile / .github/</text>
  <text x="360" y="146" font-size="10" fill="#10b981">인프라·CI/CD (Phase 5)</text>
  <defs><marker id="arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8"/></marker></defs>
  <line x1="180" y1="46" x2="355" y2="46" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#arr)"/>
  <line x1="180" y1="70" x2="355" y2="70" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#arr)"/>
  <line x1="200" y1="94" x2="355" y2="94" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#arr)"/>
  <line x1="120" y1="118" x2="355" y2="118" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#arr)"/>
  <line x1="180" y1="142" x2="355" y2="142" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#arr)"/>
  <text x="280" y="180" text-anchor="middle" font-size="10" fill="#64748b">줄이 아니라 구조(폴더)를 읽는 것이 PM의 방식</text>
</svg>

## 왜 코드를 읽어야 하나 — 구조가 보이면

개념만 알면 추상적이다. "프론트/백/DB"를 말로 아는 것과, **실제 폴더에서 `frontend/`와 `backend/`가 어떻게 나뉘는지** 보는 것은 다르다. 코드를 읽으면:

- "API가 어디 정의되나"가 보인다(어느 폴더가 라우터).
- "DB 표가 어디 정의되나"가 보인다(모델 폴더).
- "배포 설정은 어디 있나"가 보인다(Dockerfile·CI 파일).
- "환경변수는 뭐가 필요하나"가 보인다(.env.example).

이걸 읽을 수 있으면, 견적·리뷰·인수인계 때 "코드를 보고 구조를 파악"할 수 있다. 개발자와의 대화가 한 차원 올라간다.

## 읽는 순서 — 폴더부터

코드를 줄 단위로 읽을 필요는 없다. **폴더 구조(트리)부터** 본다. 보통 최상위 폴더 이름만 봐도 서비스의 뼈대가 드러난다:

```
my-service/
├── frontend/        ← 화면(프론트엔드)
├── backend/         ← 서버(백엔드 API)
│   ├── app/
│   │   ├── api/     ← API 라우터(엔드포인트)
│   │   ├── models/  ← DB 표 정의(스키마)
│   │   ├── services/← 비즈니스 로직
│   │   └── core/    ← 설정·보안
│   └── tests/
├── Dockerfile       ← 컨테이너 빌드(배포)
├── .github/workflows/ ← CI/CD 파이프라인
└── .env.example     ← 필요 환경변수 목록(세팅값 표)
```

이 구조만 봐도 Phase 1~5가 어디 실체화됐는지 보인다 — `frontend/`(Phase 1 화면), `backend/api/`(Phase 2 API), `backend/models/`(Phase 3 DB), `Dockerfile`/`.github`(Phase 5 배포), `.env.example`(Phase 5 세팅값). **개념과 코드가 1:1로 대응됨**을 확인하는 순간이다.

## FastAPI 템플릿으로 실전 읽기

[FastAPI full-stack template](https://github.com/fastapi/full-stack-fastapi-template)은 현대적 풀스택 구조의 좋은 예다. 이걸 읽어보자(코드를 안 짜도):

- **`frontend/`**: React 화면. (Phase 1 프론트엔드)
- **`backend/app/api/`**: API 엔드포인트들 — `POST /users/`, `GET /items/` 같은 CRUD 라우터. (Phase 2 API/CRUD)
- **`backend/app/models.py`**: DB 표 정의 — `User`, `Item` 클래스가 각각 한 표. 열(column)과 타입, 관계(FK)가 코드로 적힘. (Phase 3 스키마/ERD)
- **`backend/app/core/config.py`**: 환경변수 읽기 — `DATABASE_URL`, `SECRET_KEY` 등을 `settings`로 모음. (Phase 5 환경변수)
- **`backend/app/api/main.py`**: 모든 라우터를 묶어 앱을 만드는 입구.
- **`docker-compose.yml`**: 백엔드·프론트·DB(Postgres)를 한 번에 띄우는 정의 — "이 서비스는 이 3개로 돈다"가 한 파일에. (Phase 5 인프라)
- **`.github/workflows/`**: push 시 자동 테스트·배포. (Phase 5 CI/CD)
- **`.env`**: 비밀값(gitignore, 실제론 안 보이지만 `.env.example`로 목록 공개).

이 폴더들을 훑으면, Phase 1~6 전체가 **한 서비스 안에서 어떻게 자리잡았는지**가 그림으로 잡힌다. "코드를 모르더라도, 어디서 무엇이 정의되는지"를 아는 것이 이 레슨의 목표다.

## 핵심 파일 — 찾는 법

실제 저장소를 볼 때 이 파일들부터 찾으면 뼈대가 잡힌다:

- **`README.md`**: 서비스 소개 + "어떻게 띄우나" 안내. 첫 번째로 읽을 것.
- **폴더 트리 / `ls`**: 최상위 구조 — frontend/backend 분리 여부, 모듈 구조.
- **`backend/app/models.py` (또는 `models/`)**: DB 표 정의 → 데이터 구조(Phase 3 ERD의 코드판).
- **`backend/app/api/`**: 라우터 → API 목록(Phase 2).
- **`.env.example` / `config.py`**: 필요 환경변수 목록 → 세팅값 표(Phase 5).
- **`docker-compose.yml` / `Dockerfile`**: 인프라 구성(Phase 5).
- **`.github/workflows/`**: CI/CD(Phase 5).

이 7개만 봐도 서비스의 "화면-서버-DB-인프라-배포" 전체가 보인다. 줄 단위 이해가 아니라 **구조 단위 이해**가 PM의 읽기 방식이다.

## "언어/프레임워크"가 달라도 뼈대는 같다

React냐 Vue냐, Node냐 FastAPI냐, Postgres냐 MySQL이냐 — 이름은 달라도 **구조는 거의 같다**. 화면/서버/DB/API/설정/배포의 분리는 현대 서비스의 보편적 패턴이다. 그래서 한 템플릿을 읽는 법을 익히면, 다른 언어의 코드베이스에서도 "이 폴더는 뭐 하는 곳이겠지"라는 추론이 된다. PM의 코드 읽기는 **언어가 아니라 구조 패턴**을 읽는 것이다.

## worked example: 상담에서 "코드 보고 구조 파악하기"

상황: 외부 개발팀이 만든 서비스를 인수·리뷰. "코드 한번 봐 주세요."

PM의 읽기:
1. **README** → 서비스 목적, "어떻게 띄우나" → 대략 파악.
2. **폴더 트리** → `frontend/`+`backend/` 분리(Phase 1), 모듈 구도.
3. **`models.py`** → `User`, `Order`, `Payment`, `Notification` 표 → "회원·주문·결제·알림 구조구나"(Phase 3 ERD). 관계(FK)로 "주문→결제→알림" 흐름 추론.
4. **`api/`** → 엔드포인트 목록 → "이 기능들이 있다"(Phase 2).
5. **`.env.example`** → 결제사 키·DB·푸시 키 → "결제·푸시·DB 연동이 있구나"(Phase 5 세팅값).
6. **`docker-compose.yml`** → 백엔드+DB+Redis → "캐시(Redis)까지 있구나"(Phase 6 캐시).

30분 안에 "이 서비스는 ~구조로 ~기능을 ~인프라에서"라는 요약이 나온다. 코드 한 줄 안 짜고. 이것이 **개념(Phase 1~6)으로 코드를 읽는 능력** — PM 상담력의 실전 적용이다.

## 실 사례(익명화) — 기존 서비스의 구조를 "폴더로" 파악한 리뷰

> 실제 프로젝트 패턴을 익명화해 온다.

한 인수·리뷰 작업에서, 외부가 만든 서비스 코드를 받아 30분 안에 뼈대를 잡아야 했다. 팀은 줄 단위로 읽지 않고 **폴더부터** 봤다 — `frontend/`(화면), `api/`(엔드포인트 목록), `models.py`(DB 표 → "어떤 데이터를 다루나"), `.env.example`(필요 연동·비밀값), `Dockerfile`/CI 파일(인프라). 이것만으로 "이 서비스는 ~구조로 ~기능을 ~인프라에서"라는 요약이 나왔다. 한 가지 더 — **화면을 검증할 때 스크린샷을 증거로 남기며** 비교했기에, "어디가 어떻게 다른가"를 놓치지 않았다.

교훈: 코드를 모르더라도 **폴더(구조)를 읽으면** 서비스의 뼈대가 보인다. 줄 단위가 아니라 `README → 폴더 트리 → models → api → .env.example → docker-compose` 순이 PM의 읽기 방식이다. 상담·리뷰에서 이 순서로 훑으면, 코드를 안 짜도 "이 서비스가 뭘 하는지"를 말할 수 있다.

## 흔한 실패 모드와 처방

- **줄 단위로 읽으려 한다.** 코드를 다 이해하려면 시간이 모자라. 처방: 폴더·파일 단위로 구조 먼저.
- **README 안 읽고 드러든다.** "어떻게 띄우나/목적이 뭔가"를 놓침. 처방: README부터.
- **언어가 다르다고 포기.** 구조 패턴은 언어 무관. 처방: 폴더 이름(`models/`, `api/`, `config`)으로 패턴 읽기.
- **`.env.example`/`docker-compose`를 무시.** 인프라·연동·비밀값 요구를 놓침. 처방: 이 파일들이 Phase 5·6의 실체.

## 상담에 바로 쓰는 한 줄

코드베이스를 리뷰받으면, "README → 폴더 트리 → models → api → .env.example → docker-compose" 순으로 뼈대를 잡아라. 줄이 아니라 구조를 읽는 것이 PM의 방식이다.

## 개발자가 이 단어 말할 때

- **레포(repo) / 코드베이스** — 코드 저장소.
- **라우터(router) / 엔드포인트** — API 정의(어느 폴더에 모아둠).
- **모델(model) / ORM** — DB 표를 코드로 정의한 것 / 코드↔DB 다리.
- **마이그레이션(migration) 파일** — DB 구조 변경 이력.
- **Dockerfile / docker-compose** — 컨테이너 빌드 정의 / 여러 서비스 한 번에 띄우기.
- **CI 워크플로** — 자동 검사·배포 정의(`.github/workflows/`).

## ✍️ 산출물 과제

[FastAPI full-stack template](https://github.com/fastapi/full-stack-fastapi-template)(또는 아는 레포)를 열어, (1) 폴더 트리의 최상위 구조 (2) `models.py`에 정의된 표 2개 (3) `.env.example`의 환경변수 3개를 찾아 적어라. 그리고 "이 구조가 Phase 1~5 중 어디에 해당하는가"를 각각 한 줄로 매핑하라.

> 더 보기: FastAPI full-stack template (실전 구조 예) · https://github.com/fastapi/full-stack-fastapi-template
