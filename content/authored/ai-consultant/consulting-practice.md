이 코스를 통틀어 가장 중요한 한 레슨이다. Phase 1~6의 개념은 전부 **이 한 행위를 위한 도구**다: 고객의 요구사항을 듣고, **아키텍처 + 견적 + 리스크 + 개발안**으로 번역하기. 이것이 PM/AI consultant의 본질이다. 코드를 짤 필요 없다 — 요구를 구조로 바꾸고, 그 구조의 공수와 위험을 가늠하는 것. 이 레슨은 그 종합 번역을 연습한다. 배운 모든 것을 한 상담 흐름으로 묶는 피날레다.

**상담의 5단계 워크플로** — 요구를 한 장으로 번역한다:

<svg viewBox="0 0 560 150" width="100%" style="max-width:560px;height:auto;display:block;margin:10px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="요구를 명사동사 ERD API 리스크로 번역하는 5단계 상담 워크플로">
  <defs><marker id="arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#64748b"/></marker></defs>
  <rect x="5"   y="50" width="95" height="50" rx="8" fill="#0ea5e9"/><text x="52"  y="73" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">1 요구</text><text x="52"  y="89" text-anchor="middle" font-size="9" fill="#e0f2fe">고객 말</text>
  <rect x="115" y="50" width="95" height="50" rx="8" fill="#6366f1"/><text x="162" y="73" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">2 명사·동사</text><text x="162" y="89" text-anchor="middle" font-size="9" fill="#e0e7ff">뽑아내기</text>
  <rect x="225" y="50" width="95" height="50" rx="8" fill="#8b5cf6"/><text x="272" y="73" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">3 ERD</text><text x="272" y="89" text-anchor="middle" font-size="9" fill="#ede9fe">표·관계</text>
  <rect x="335" y="50" width="95" height="50" rx="8" fill="#f59e0b"/><text x="382" y="73" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">4 API·화면</text><text x="382" y="89" text-anchor="middle" font-size="9" fill="#fef3c7">CRUD</text>
  <rect x="445" y="50" width="110" height="50" rx="8" fill="#10b981"/><text x="500" y="73" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">5 리스크·공수</text><text x="500" y="89" text-anchor="middle" font-size="9" fill="#d1fae5">견적</text>
  <line x1="100" y1="75" x2="113" y2="75" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <line x1="210" y1="75" x2="223" y2="75" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <line x1="320" y1="75" x2="333" y2="75" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <line x1="430" y1="75" x2="443" y2="75" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <text x="280" y="128" text-anchor="middle" font-size="10" fill="#64748b">이 흐름을 한 장으로 만드는 것이 상담의 끝</text>
</svg>

## 상담이란 '요구 → 구조 → 판단'의 번역

PM 상담은 한 문장(요구)을 여러 층위의 판단으로 풀어내는 일이다:

- **요구**(고객): "예약 앱 만들어 주세요."
- **구조**(번역): 화면(프론트) / API / DB 표 / 인프라 — 무엇이 필요한가(Phase 1~5).
- **판단**(견적·리스크·개발안): 그 구조가 공수는 얼마이고, 어떤 위험이 있으며, 어떻게 만들 것인가.

이 세 단계(요구 → 구조 → 판단)를 빠르게 하는 것이 상담력이다. Phase 1~6은 모두 이 번역의 어휘를 주기 위한 것이었다.

## 상담 프레임 — 네 가지 산출물

좋은 상담은 고객에게 네 가지를 돌려준다:

1. **기능/화면 목록**: 뭘 만들 건가(Phase 1). 사용자 화면·관리자 화면 구분.
2. **데이터 모델(ERD)**: 무슨 표가 필요한가(Phase 3). 요구의 숨은 복잡도를 드러냄.
3. **API 목록**: 화면과 서버 사이의 문(Phase 2). CRUD별 엔드포인트.
4. **인프라/연동 + 리스크**: 어디에 올리고 뭘 연결하나(Phase 4·5), 어디가 위험한가(Phase 6 — 비동기·확장·보안).

이 네 가지를 한 장에 정리할 수 있으면 상담이 끝난 것이다. 아래 워크플로로 만들어 간다.

## 상담 워크플로 (5단계)

1. **요구에서 명사·동사 뽑기**: 요구 문장에서 명사는 엔터티(표 후보), 동사는 기능(CRUD 후보)다. "회원이 예약하고 결제한다" → 명사(회원·예약·결제), 동사(예약한다·결제한다).
2. **ERD 스케치**: 엔터티→표, 관계→선(Phase 3). `users`, `reservations`, `payments` + FK. 이 단계에서 "복잡도"가 드러난다(표 3개 vs 8개).
3. **API/화면 도출**: 각 동사를 CRUD로 → 엔드포인트와 화면(Phase 1·2). "예약한다"→`POST /reservations` + 예약 화면. 관리자 화면 별도인지 확인.
4. **인프라/연동/비동기 식별**: 결제(웹훹·비동기), 푸시(FCM), 파일(S3), 배포(PaaS/AWS) — 어디 걸리나(Phase 4·5·6). "오래 걸리는가→큐"까지(Phase 6).
5. **리스크·공수 요약**: 어디가 위험(보안·동시성·비용)하고, 대략 어느 정도 규모인가.

## worked example: 종합 번역

고객 요구: "사용자가 날짜 잡아 예약하고 결제하고, 예약 하루 전 알림 받고, 사장님은 관리자 화면에서 예약 보는 서비스요."

번역:
1. **명사·동사**: 회원, 예약, 결제, 알림, 사장님(관리자) / 예약한다, 결제한다, 알림 보낸다, 조회한다.
2. **ERD**: `users`, `reservations`(user_id FK, date, status), `payments`(reservation_id FK, amount, status), `notifications`(reservation_id FK, type, status), `availability_slots`. — 표 5개, 관계 명확(Phase 3).
3. **API/화면**: `POST /reservations`(예약 생성), `GET /reservations`(사장님 전체 조회·RLS/인가로 관리자만), `POST /payments` + 결제 웹훹, 사용자 화면 + 관리자 화면(2종). — 엔드포인트 ~5개(Phase 2).
4. **인프라/연동/비동기**: 결제사(웹훹), 푸시(FCM), 파일(S3, 사장님 로고 등), "하루 전 알림"은 **스케줄러/큐(비동기)**로(Phase 6 동기/비동기). 배포는 초기엔 PaaS(Vercel/Render) + 관리형 DB(Phase 5). MVP라 BaaS(Supabase)로 시작도 가능(Phase 4).
5. **리스크·공수**: 결제 중복(idempotency), 동시 예약(잠금/유니크 제약, Phase 3), 알림 실패(재시도·로그, Phase 6), 비용(BaaS 과금 폭발 시 이관). — 표 5·API 5·인프라 보통 → "MVP 3~6주, 관리자 화면·결제·알림이 주 공수" 식의 요약 가능.

이렇게 **한 문장이 5개 표, 5개 API, 2개 화면, 결제/푸시/스케줄러 인프라, 그리고 구체적 리스크 목록**으로 펼쳐진다. Phase 1~6 전부가 이 한 번역에 쓰였다. 이것이 "개발 지식이 상담 언어로 바뀌는" 순간이다.

## AI를 어디에 쓰나 — 이 코스의 맥락

"AI consultant" 코스인 만큼 한 가지 더: **AI로 초안 구현, 사람이 검수**. 고객 요구를 번역한 뒤:

- **AI가 할 수 있는 것**: ERD 초안, API 명세 초안, 프론트/백엔드 코드 초안, 간단한 화면 프로토타입. 요구→구조의 초안을 빠르게 뽑는 데 강함.
- **사람(AI consultant)이 검수할 것**: 요구사항 해석의 정확성, 구조의 적절성(과잉/부족), 보안(RLS·환경변수), 동시성·트랜잭션, 비용·확장 전망. **AI 초안의 위험한 부분(인가 없는 API·데이터 무결성·비용 폭발)을 잡는 것**이 상담의 핵심 가치다.

즉 "AI가 짠 초안에서 어디를 검수해야 하나"를 아는 것이 이 코스의 목적이었다. AI가 늘어날수록 이 **검수 능력**이 가치를 발한다.

## 실 사례(익명화) — "IA → 기능명세 → 견적"의 실제 워크플로

> 실제 프로젝트 사례를 익명화해 옮긴다. 이 코스 전체의 결정적 예시다.

팀이 한 클라이언트 작업에서 쓰는 흐름은 거의 정해져 있었다: **IA(정보구조) → 상세 기능명세 → ERD·API → 견적·리스크**. 고객의 요구를 먼저 한 장(IA)으로 펴고, 거기서 명사·동사를 뽑아 표(ERD)·엔드포인트(API)로 번역한 뒤에야 공수가 잡혔다. ERD를 안 그리고 견적을 낸 적은 거의 항상 빗나갔다 — "간단한 기능"이 표 5개·관계 4개로 드러나는 순간 견적이 달라졌기 때문이다.

한 가지 더 — 그 흐름 안에서 **"AI로 자동화를 넣자"는 아이디어가 검토 끝에 '효과 없음'으로 빠진 적**이 있었다. 기술이 무조건 들어가야 하는 건 아니라는 실제 결정. "AI consultant"라는 이름이 붙은 이 코스의 핵심이 여기에 있다 — AI로 초안을 빠르게 내되, **"여기엔 AI가 필요 없다"고 자를 수 있는 판단**이 진짜 상담력이다.

교훈: 상담은 "요구 → 구조(ERD·API) → 판단(리스크·공수)"의 번역이고, 그 끝에 "AI가 도울 곳과 아닌 곳"을 가르는 일이다. 이 코스의 모든 레슨이 이 한 장을 만들기 위한 도구였다.

## 흔한 실패 모드와 처방

- **요구를 구조로 안 풀고 견적부터 낸다.** 숫자만 부르면 근거가 없음. 처방: 먼저 ERD·API 목록(구조)을 그리고, 거기서 공수를 도출.
- **복잡도를 안 드러낸다.** "간단한 예약"이라 하고 표 5·동시성·알림을 놓침. 처방: ERD와 비동기 식별로 숨은 복잡도를 명시적으로.
- **리스크를 숨긴다.** 보안·동시성·비용 위험을 안 알림. 처방: 리스크를 상담 산출물에 명시 — "이 부분 위험, 이렇게 방어".
- **AI 초안을 그대로 믿는다.** 인가/무결성/비용 문제를 놓침. 처방: AI 초안은 검수 대상 — 특히 권한·데이터·비용 쪽.

## 상담에 바로 쓰는 한 줄

고객 요구를 받으면, **"명사→표(ERD), 동사→API, 어디서 느리/위험한가→비동기·리스크"** 로 펼치고, 그 구조에서 공수·위험을 도출하라. 이것이 이 코스 전체의 한 줄 요약이다.

## 개발자가 이 단어 말할 때 (종합 어휘)

- **엔터티 / ERD / CRUD** — 표 / 관계도 / 네 동사 (Phase 1·3).
- **엔드포인트 / 인가(RLS) / idempotency** — API 문 / 권한 / 중복 방지 (Phase 2·4).
- **관리형 DB / 배포 / 환경변수** — 운영 위탁 DB / 올리기 / 세팅값 (Phase 5).
- **비동기 / 큐 / 스케줄러 / 캐시 / 확장** — 뒤로 미루기 / 할 일 줄 / 시간 작업 / 임시 저장 / 늘리기 (Phase 6).
- **AI 초안 / 검수** — AI가 만든 첫 안 / 사람이 위험을 잡는 일.

## ✍️ 산출물 과제 (종합)

본인이 상담했거나 상상하는 서비스 요구 한 문장을 골라, 위 5단계 워크플로를 전부 적용하라: (1) 명사·동사 (2) ERD(표 4~6개, FK 표시) (3) API/화면 목록 (4) 인프라/연동/비동기 식별 (5) 리스크 3가지와 대응. 그리고 "AI가 초안을 냈을 때 내가 검수할 핵심 2곳"을 적어라. 이것이 이 코스의 졸업 과제다.

> 더 보기: Project-Based Learning (직접 만들어보기 프로젝트) · https://github.com/practical-tutorials/project-based-learning
