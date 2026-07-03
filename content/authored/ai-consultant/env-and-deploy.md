코드를 다 짰다고 서비스가 끝이 아니다. 그 코드를 실제 환경에 올리고, 그 환경에서 **비밀값(DB 비밀번호·API 키·시크릿)**을 안전하게 넣어주고, 갱신될 때마다 자동으로 다시 올리는 일까지가 "배포"다. "로컬에선 되는데 배포하면 안 된다"는 말의 원인은 거의 항상 여기(환경 변수)에 있다. 이 레슨은 환경변수와 배포 방식을 정리하고, PM이 들어야 할 세팅값 표를 채운다. Phase 5의 마지막이자 "코드 → 실서비스"의 마지막 관문이다.

**환경변수 — 코드 밖에 둔 설정값이 배포로 흘러가는 흐름:**

<svg viewBox="0 0 560 130" width="100%" style="max-width:560px;height:auto;display:block;margin:10px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="환경변수 설정이 배포 환경으로 흘러가 앱에 주입되는 흐름">
  <defs><marker id="arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#64748b"/></marker></defs>
  <rect x="10"  y="40" width="120" height="50" rx="8" fill="#0ea5e9"/><text x="70"  y="62" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">.env</text><text x="70"  y="78" text-anchor="middle" font-size="9" fill="#e0f2fe">코드에 안 씀</text>
  <rect x="160" y="40" width="130" height="50" rx="8" fill="#8b5cf6"/><text x="225" y="62" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">배포 환경 설정</text><text x="225" y="78" text-anchor="middle" font-size="9" fill="#ede9fe">prod/staging 분리</text>
  <rect x="320" y="40" width="110" height="50" rx="8" fill="#f59e0b"/><text x="375" y="62" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">CI/CD</text><text x="375" y="78" text-anchor="middle" font-size="9" fill="#fef3c7">자동 빌드·배포</text>
  <rect x="460" y="40" width="95"  height="50" rx="8" fill="#10b981"/><text x="507" y="62" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">실행 중인 앱</text><text x="507" y="78" text-anchor="middle" font-size="9" fill="#d1fae5">값 주입</text>
  <line x1="130" y1="65" x2="158" y2="65" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/>
  <line x1="290" y1="65" x2="318" y2="65" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/>
  <line x1="430" y1="65" x2="458" y2="65" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/>
  <text x="280" y="112" text-anchor="middle" font-size="10" fill="#64748b">"로컬에선 되는데 실서버에선" = 십중팔구 이 흐름 어딘가 누락</text>
</svg>

## 환경변수(env) — 서비스의 '설정 다이얼'

**환경변수**는 코드 밖에 두는 설정값이다. Phase 2(백엔드 단어장)·Phase 1(Git)에서 봐서 익숙할 것이다. 핵심은 비밀값과 환경별 설정을 **코드에 직접 박지 않고** `.env`나 클라우드 환경설정에 둔다는 것.

왜 밖으로 빼는가, 세 가지 이유를 다시 정리:

1. **보안**: 비밀번호·키가 코드/Git에 올라가면 유출 = 사고. `.env`는 `.gitignore`로 커밋에서 뺀다(Phase 1 참고).
2. **환경 분리**: 개발(local)·검증(staging)·실서버(production)에서 **같은 코드**를 쓰되 **다른 값**(다른 DB, 다른 API 키)을 쓴다. 환경 변수만 바꾸면 같은 코드가 각 환경에서 다르게 동작.
3. **변경 용이**: 값이 바뀌어도 코드 수정·재배포 없이 환경 변수만 바꾼다.

"로컬에선 되는데 실서버에선 안 된다"는 **십중팔구 환경변수 문제**다 — 실서버 환경 변수가 빠졌거나 달라서. 그래서 환경변수 목록(아래 표)을 산출물로 관리하는 것이 필수다.

## 세팅값 표 — PM이 가져야 할 환경변수 사전

서비스에 필요한 대표 환경변수를 정리한다. 견적·운영 상담에서 이 표가 있으면 "어떤 연동 값이 필요한가"가 보인다:

| 변수 | 의미 | 언제 필요 |
|---|---|---|
| `DATABASE_URL` | DB 접속 주소(계정/비번/호스트 포함) | DB 쓸 때(RDS/Supabase) |
| `JWT_SECRET` / `AUTH_SECRET` | 로그인 토큰 서명용 비밀값 | 인증 있을 때 |
| `STRIPE_SECRET_KEY` / `TOSS_SECRET` | 결제사 비밀 키 | 결제 연동 |
| `AWS_ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` | AWS 접근용 프로그램 키 | S3 등 AWS 자원 쓸 때(보통 역할로 대체) |
| `AWS_REGION` | 클라우드 지역(예: 서울 `ap-northeast-2`) | AWS 사용 |
| `S3_BUCKET` | 파일 저장 버킷 이름 | 파일 업로드 |
| `FCM_SERVER_KEY` / Firebase 서비스 계정 | 푸시 발송 권한 | 앱 푸시(Phase 4) |
| `RESEND_API_KEY` / `SMTP` | 이메일 발송 키 | 이메일 발송 |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | AI 모델 호출 키 | AI 기능 |
| `NEXT_PUBLIC_API_URL` | 프론트가 부를 API 주소 (클라이언트에 노출돼도 되는 값) | 항상 |

마지막 줄이 중요하다 — `NEXT_PUBLIC_` 같은 접두어가 붙은 값만 클라이언트(브라우저/앱)에 노출된다. **비밀값은 절대 이 접두어로 붙이지 않는다**는 규칙을 팀에 달아둘 것.

## 비밀값 관리 — 환경마다 다르게, 코드엔 절대

- **로컬**: `.env.local`(gitignore)에 둔다. 절대 커밋 금지.
- **배포 환경**: Vercel/AWS의 **환경 변수 설정**(대시보드 또는 Secret Manager)에 등록. 코드에는 담기지 않는다.
- **환경 분리**: production 값과 staging 값은 다르게 — staging은 가짜 결제 키·작은 DB로.
- **갱신/회전**: 키가 의심되면 회전(rotate) — 새 키 발급 후 예전 키 무효화.

## 배포 방식 — PaaS vs 직접

코드를 올리는 방식은 크게 두 가지(Phase 5 첫 글 참고):

- **PaaS(Vercel/Render)**: 코드 push → 자동 빌드·배포·HTTPS. 환경변수는 대시보드에 등록. **초기 추천** — 운영 거의 제로.
- **직접(EC2 + 매니지드)**: 서버에 코드 올리고, 프로세스 매니저(pm2 등)로 돌리고, Nginx로 라우팅하고, 인증서(Let's Encrypt) 갱신 자동화. 환경 변수는 서버/Secret Manager에서. **자유도↑, 운영 부담↑.**

PM 식 결론: "초기엔 PaaS로 환경변수만 등록하면 끝. 복잡해지면 직접 EC2로 — 단, 환경변수/인증서/프로세스 관리까지 감당할 때."

## CI/CD — 자동 배포 파이프라인

**CI/CD**는 "코드를 push하면 자동으로 검사(CI)하고 배포(CD)하는 파이프라인"이다. GitHub Actions이 대표적:

1. push → 자동으로 테스트·빌드(CI).
2. 통과하면 자동 배포(CD) — PaaS는 자체 CD, 직접 환경은 GitHub Actions로 EC2에 배포.
3. 실패하면 배포 중단 → 실서버 보호.

이게 있으면 "수동으로 파일 올리고 서버 재시작" 하는 일이 없어진다. PaaS는 CI/CD가 기본 내장이라 초기엔 그걸로 충분하다.

## worked example: "로컬에선 되는데 실서버에선 결제가 안 돼요"

증상: 개발 중 결제 잘 되던 게 배포 후론 결제 실패.

원인 탐색(환경변수 관점):
1. 실서버 환경변수에 `STRIPE_SECRET_KEY`가 빠졌나? → 가장 흔한 원인.
2. 실서버 키가 staging/test 키(가짜)여서 진짜 결제가 안 서나?
3. `NEXT_PUBLIC_API_URL`이 로컬(`localhost`)로 돼 있어, 프론트가 실서버 API를 안 치나?
4. 결제 웹훹 URL이 실서버 도메인으로 안 등록돼서, 결제사가 우리 서버에 알림을 못 주나?

→ 거의 항상 1번(환경변수 누락/오배정)이었다. 환경변수 목록(세팅값 표)을 실서버 대시보드와 대조해 빠진 걸 채우면 해결. 이것이 "환경변수를 산출물로 관리해야 하는 이유"의 현실이다.

## 실 사례(익명화) — 환경변수 목록을 산출물로 둔 이유

> 실제 프로젝트 패턴을 익명화해 온다.

한 프로젝트에선 환경변수(DB 주소·결제·푸시·AI 키)를 코드와 완전 분리하고, **prod/staging을 다르게** 뒀다. 실서버 장애의 상당수가 "환경변수 누락·오배정"이었기 때문이다 — 개발엔 있던 값이 실서버 세팅에 빠져 "로컬에선 되는데 실서버에선 안 된다"가 반복됐다. 그래서 **환경변수 목록(세팅값 표)을 산출물로 관리**했고, 배포는 **자동화(CI/CD)**해 수동 실수를 없앴다.

교훈: "배포"는 코드 올리기로 끝이 아니라 — 환경변수 관리(prod/staging 분리 + 목록화)와 자동 배포가 함께 와야 한다. 상담에서 "환경변수 목록이 있나요? prod/staging이 나뉘어 있나요?"를 묻는 것이, 이 사례가 보여준 실무 교훈이다.

## 흔한 실패 모드와 처방

- **환경변수 목록이 없다.** 누가 빼먹으면 실서버 장애. 처방: 세팅값 표를 산출물로 유지·동기화.
- **비밀값을 코드/Git에 박는다.** 유출 = 사고. 처방: `.gitignore`에 `.env`, 비밀값은 클라우드 설정/Secret Manager.
- **환경을 안 나눈다.** 실서버에서 staging 가짜 키 쓰거나, 한 환경만 있어서 검증 못 함. 처방: prod/staging/dev 분리.
- **배포를 수동으로.** 실수·누락 잦음. 처방: PaaS 자동배포 또는 CI/CD 파이프라인.

## 상담에 바로 쓰는 한 줄

"배포"를 이야기할 때, "환경변수(세팅값) 목록 + 배포 자동화(PaaS/CI-CD) + 비밀값 안전 관리" 세 가지를 항상 함께 언급하라. 환경변수를 빼놓으면 배포 상담이 반쪽이다.

## 개발자가 이 단어 말할 때

- **env / `.env`** — 환경변수 창고.
- **`.gitignore`** — 커밋에서 제외할 파일 목록(`.env` 필수).
- **Secret Manager / 환경 변수 설정** — 클라우드에서 비밀값을 두는 곳.
- **staging / production** — 검증 환경 / 실서버 환경.
- **CI/CD / GitHub Actions** — 자동 검사·배포 파이프라인.
- **프로세스 매니저(pm2) / Nginx** — 직접 서버 운영 시 프로세스·라우팅 관리 도구.

## ✍️ 산출물 과제

본인 서비스에 필요한 환경변수를 위 세팅값 표에서 골라 목록을 만들어라. 각 변수에 대해 (1) 어디 값인가(목적) (2) prod/staging이 다른 값인가 (3) 클라이언트 노출 여부(`PUBLIC`)를 표시하라. 그리고 배포를 PaaS로 할지 직접으로 할지, 이유를 한 줄로 정하라.

> 더 보기: AWS 사용자 가이드 · https://docs.aws.amazon.com/
