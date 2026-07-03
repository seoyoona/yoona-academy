고객이 "빠르게 MVP 만들어 달라"고 할 때, 백엔드를 직접 짜는 선택은 종종 최선이 아니다. 회원가입, 로그인, DB, 파일 업로드, API까지 매 서비스마다 반복해서 만들어야 하기 때문이다. 이럴 때 "로그인·DB·저장소까지 미리 만들어둔 서비스"를 빌려 쓰면 며칠 만에 띄울 수 있다. 이것이 BaaS(Backend as a Service)다. 이 레슨은 BaaS가 왜 빠른지, 그리고 Firebase·Supabase·직접 백엔드 중 언제 뭘 골라야 하는지를 다룬다. 견적·아키텍처 상담에서 가장 자주 나오는 첫 결정이다.

**직접 백엔드 vs BaaS — 부품을 직접 만들까, 빌릴까:**

<svg viewBox="0 0 560 170" width="100%" style="max-width:560px;height:auto;display:block;margin:10px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="직접 백엔드(부품 직접 제작)와 BaaS(부품 빌림) 비교">
  <rect x="10" y="20" width="255" height="135" rx="10" fill="#ef4444" opacity="0.10" stroke="#ef4444"/>
  <text x="137" y="42" text-anchor="middle" font-size="12" font-weight="700" fill="#991b1b">직접 백엔드 — 부품 직접 제작</text>
  <text x="25" y="66" font-size="11" fill="#0f172a">• 인증 만들기</text>
  <text x="25" y="86" font-size="11" fill="#0f172a">• DB 세팅·운영</text>
  <text x="25" y="106" font-size="11" fill="#0f172a">• API 엔드포인트 코딩</text>
  <text x="25" y="126" font-size="11" fill="#0f172a">• 파일 처리</text>
  <text x="137" y="146" text-anchor="middle" font-size="10" font-weight="700" fill="#991b1b">느리지만 자유도↑</text>
  <rect x="295" y="20" width="255" height="135" rx="10" fill="#10b981" opacity="0.10" stroke="#10b981"/>
  <text x="422" y="42" text-anchor="middle" font-size="12" font-weight="700" fill="#065f46">BaaS — 부품 빌림</text>
  <text x="310" y="66" font-size="11" fill="#0f172a">• Auth (이미 있음)</text>
  <text x="310" y="86" font-size="11" fill="#0f172a">• Postgres (관리형)</text>
  <text x="310" y="106" font-size="11" fill="#0f172a">• 자동 API</text>
  <text x="310" y="126" font-size="11" fill="#0f172a">• Storage</text>
  <text x="422" y="146" text-anchor="middle" font-size="10" font-weight="700" fill="#065f46">빠름, 초기 추천</text>
</svg>

## BaaS는 '뒷단의 자동판매기'

BaaS는 앱에 자주 필요한 뒷단 기능 — 인증(Auth), 데이터베이스, 파일 저장소, 간단한 API, 가끔 함수 실행 — 을 **미리 만들어둔 서비스**다. Supabase, Firebase가 대표적이다.

직접 백엔드를 짠다고 상상해 보자. 회원가입→비밀번호 해싱→로그인 토큰 발급→DB 설계→CRUD API→파일 업로드 라우터→권한 검사… 매번 새로 짜야 하는 부품들의 목록이다. 각각은 어렵지 않지만 합치면 며칠~몇 주다.

BaaS는 이 부품들을 "이미 만들어 뒀어, 설정만 해"로 준다. Supabase를 켜면 Postgres DB가 있고, Auth가 있고, Storage가 있고, 표마다 자동으로 API가 생긴다. **백엔드 서버를 한 줄도 안 짜고 로그인+CRUD가 된다.** 그래서 빠르다.

## 왜 빠른가 — 세 가지 이유

1. **부품이 이미 있다.** 인증·DB·파일·API를 직접 만들지 않는다. 설정과 호출만 한다.
2. **인프라를 안 굴린다.** 서버 설치·백업·스케일을 BaaS가 알아서 한다(관리형). 운영 노동을 빌리는 효과(RDS와 같은 맥락, Phase 3 참고).
3. **SDK로 바로 붙인다.** 프론트엔드 코드에서 BaaS 라이브러리를 불러 바로 데이터를 넣고 뺀다. API 엔드포인트를 매번 만들 필요가 없다.

이 세 가지가 합쳐 "기획 다음 날 동작하는 MVP"를 가능하게 한다.

## 직접 백엔드 vs BaaS — 비교

| 항목 | 직접 백엔드(Node/Express, FastAPI) | BaaS(Supabase/Firebase) |
|---|---|---|
| 초기 속도 | 느림(부품 직접 제작) | 빠름(부품 빌림) |
| 유연성 | 높음(원하는 대로) | 제약(제공하는 범위 안) |
| 복잡한 로직 | 잘 어울림 | 한계(함수로 우회) |
| 운영 부담 | 우리가 다 | BaaS가 대부분 |
| 비용(초기) | 낮음 | 낮음 |
| 비용(대규모) | 통제 가능 | 사용량 과금 폭발 위험 |

## 언제 BaaS, 언제 직접 백엔드?

**BaaS가 좋을 때:**
- MVP. 시장 검증이 먼저.
- 로그인 + DB + 파일 업로드 + CRUD 정도가 핵심.
- 복잡한 비즈니스 로직이 적다.
- 모바일 앱(푸시·인증에 BaaS가 강함).
- AI에서 벡터 검색/RAG까지 붙일 가능성(Supabase는 pgvector 지원).

**직접 백엔드가 좋을 때:**
- 복잡한 규칙·대량 처리(배치·큐·스케줄러)가 많다.
- 외부 연동(PG, ERP, 사내망, 파트너 API)이 많다.
- 강한 보안·감사·커스텀 권한 요구.
- 고객사 인프라 규정(특정 클라우드·자체망)이 있다.
- 트래픽/비용이 BaaS 한계에 닿았다.

## worked example: "관리자·사용자 예약 MVP" 선택

고객: "사용자 예약 + 관리자 화면 + 결제. 초기라 빠르게, 비용 적게."

추천:
1. **Supabase로 시작** — Auth(로그인) + Postgres(예약·사용자 표) + Storage(프로필 사진). 백엔드 서버 없이 며칠 안에 동작.
2. **권한은 RLS로** — "관리자만 예약 전체 조회"를 DB 수준에서(Phase 4 RLS 레슨).
3. **결제는 결제사 웹훹** — 결제 금액·상태 동기화는 신뢰가 필요해 서버사이드에서. 이 부분만 작은 서버(또는 Supabase Edge Function)로.
4. **확장 시 이관** — 트래픽·복잡도가 커지면 결제·배치를 자체 백엔드로 옮기되, DB는 Postgres 그대로(구조 이전 불필요).

이 상담 한 장에 Phase 1~5 개념이 다 녹아 있다. "MVP"라는 한마디가 BaaS+RLS+웹훹+이관 계획으로 번역되는 것이 PM 상담력이다.

## 실 사례(익명화) — "빠르게 검증"이 목표라 BaaS로 간 선택

> 실제 프로젝트 패턴을 익명화해 옮겼다.

한 초기 클라이언트는 **"빠르게 시장에 검증"**이 최우선이라, 백엔드를 직접 짜지 않고 BaaS로 갔다 — 로그인·CRUD·파일 업로드를 며칠 만에 띄웠다. 핵심은 "BaaS가 정답이라서"가 아니라 **"지금 단계(검증)에 맞는 선택"**이었다는 점. 트래픽·복잡도가 커지면 일부를 자체 백엔드로 옮길 계획까지 세워둔 상태였다.

교훈: 기술 선택은 "뭘 쓰느냐"보다 **"지금 우리 단계에 맞느냐"**다. 초기엔 빠른 BaaS, 복잡해지면 직접 백엔드 — 그리고 이탈 비용을 낮추도록(표준 Postgres로) 쓰는 것이 시니어의 판단이다.

## 흔한 실패 모드와 처방

- **초기부터 직접 백엔드로 over-engineering.** 운영 노동만 커지고 MVP가 늦어진다. 처방: 보통 BaaS로 시작, 필요해지면 이관.
- **BaaS를 "보안 다 됐다"로 믿는다.** RLS 없으면 클라이언트 우회에 뚫린다. 처방: 행 단위 권한은 RLS로.
- **비용을 안 본다.** BaaS는 사용량(읽기·대역폭) 과금이라 트래픽 폭발 시 비용이 튄다. 처방: 초기엔 싸지만, 사용량 임계점에서 자체 백엔드 이관을 미리 고려.
- **벤더 종속을 무시한다.** BaaS 기능 깊게 쓸수록 다른 곳으로 옮기기 어렵다. 처방: 핵심 데이터는 표준(Postgres)에 두면 이관 부담이 줄어든다(Supabase는 Postgres 그대로라 유리).

## 상담에 바로 쓰는 한 줄

"MVP"라는 말이 나오면, "직접 백엔드 vs BaaS, 지금 단계엔 어느 쪽이 빠를까"를 첫 질문로 깔아라. 보통 초기엔 BaaS, 복잡해지면 직접 백엔드다.

## 개발자가 이 단어 말할 때

- **BaaS / Firebase / Supabase** — 뒷단 전체를 빌리는 서비스.
- **SDK / 클라이언트 라이브러리** — 프론트에서 BaaS 기능을 직접 부르는 도구.
- **관리형(managed)** — 운영을 서비스 측이 대신함.
- **벤더 종속(vendor lock-in)** — 특정 BaaS에 깊이 의존해 이관이 어려운 상태.
- **Edge Function / Cloud Function** — BaaS에서 돌아가는 작은 서버 코드(직접 백엔드가 필요한 부분만 부분적으로 넣는 용도).

## ✍️ 산출물 과제

본인(또는 상담 중인) 서비스를 두고, "BaaS로 시작할지 직접 백엔드로 할지"를 3문장으로 결정하고 그 이유를 적어라. 반드시 (1) 초기 속도 (2) 권한(RLS/백엔드) (3) 비용 폭발 시 이관 계획 세 항에 대해 한 줄씩 적어라.

## 한 걸음 더 — BaaS vs CMS, 그리고 '프로토타입↔프로덕션' 경계

헷갈리기 쉬운 두 가지를 짚고 가자. 첫째, BaaS(Supabase/Firebase)는 **CMS**(워드프레스·스트래피 등 콘텐츠 관리 도구)와 다르다. CMS는 "콘텐츠를 관리·표시"에 특화된 반면, BaaS는 "앱의 뒷단(인증·DB·API)" 범용 부품이다. 블로그/소개 사이트엔 CMS가, 맞춤형 앱엔 BaaS가 맞다. 둘째, "BaaS로 빠르게 프로토타입"과 "그것을 그대로 프로덕션(실서비스)으로"은 다르다. 프로토타입 단계에선 RLS·백업·비용 한계를 건너뛰기 쉽지만, 진짜 사용자가 붙으면 그것들이 필수가 된다. "BaaS로 검증 → 보안/운영을 채우고 프로덕션화"라는 두 단계로 생각하면, "빠르다"와 "안전하다"를 둘 다 챙길 수 있다. 이 구분을 상담에 올리면 "MVP 다 됐어요"가 "실서비스도 됐어요"로 넘어가는 시점을 놓치지 않는다.

> 더 보기: Supabase 공식 문서 · https://supabase.com/docs
