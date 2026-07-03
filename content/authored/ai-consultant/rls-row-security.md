"관리자만 회원 전체를 보고, 일반 회원은 본인 것만 봐야 해요." — Supabase 같은 BaaS에서 이 요구를 어떻게 구현하느냐에 따라 서비스가 안전해지거나 뚫린다. 핵심은 **RLS(Row Level Security, 행 수준 보안)**: "이 사용자는 이 행(row)만 볼 수 있다"를 DB 자체에서 거는 규칙이다. 이 레슨은 RLS가 왜 BaaS에서 거의 필수인지, 프론트 숨김과 어떻게 다른지를 다룬다. Phase 2에서 본 "인가는 백엔드에서" 원칙이 BaaS에선 RLS로 나타난다.

**RLS — DB가 사용자별로 행을 거른다 (클라이언트 우회도 막음):**

<svg viewBox="0 0 560 160" width="100%" style="max-width:560px;height:auto;display:block;margin:10px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="쿼리가 DB의 RLS 정책을 거쳐 본인 행만 반환하는 흐름">
  <defs><marker id="arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#64748b"/></marker></defs>
  <rect x="10" y="55" width="120" height="50" rx="8" fill="#6366f1"/><text x="70" y="78" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">요청</text><text x="70" y="94" text-anchor="middle" font-size="9" fill="#e0e7ff">select * (전체)</text>
  <rect x="170" y="45" width="140" height="70" rx="8" fill="#f59e0b"/><text x="240" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">DB + RLS 정책</text><text x="240" y="88" text-anchor="middle" font-size="9" fill="#fef3c7">"이 사용자의 행만"</text><text x="240" y="102" text-anchor="middle" font-size="9" fill="#fef3c7">DB가 필터</text>
  <rect x="350" y="55" width="200" height="50" rx="8" fill="#10b981"/><text x="450" y="78" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">결과: 본인 행만</text><text x="450" y="94" text-anchor="middle" font-size="9" fill="#d1fae5">다른 사람 행은 안 보임</text>
  <line x1="130" y1="80" x2="168" y2="80" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/>
  <line x1="310" y1="80" x2="348" y2="80" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/>
  <text x="240" y="140" text-anchor="middle" font-size="10" fill="#64748b">SDK로 직접 쳐도 DB가 막아 — 클라이언트 숨김과 다름</text>
</svg>

## BaaS의 딜레마 — 자동 API가 열려 있다

앞선 레슨에서 Supabase는 표를 만들면 **자동 API**가 열린다고 했다. 편리하지만 위험하다 — "자동"이란 "누구나 규칙만 맞추면 조회/수정할 수 있다"는 뜻이다. RLS 없이 `posts` 표를 열어두면, 누군가 SDK로 `select * from posts`를 쳐서 **모든 사용자의 글을 다 가져갈 수 있다.**

이게 BaaS의 특유 위험이다. 전통 백엔드라면 API 엔드포인트마다 권한 검사(Phase 2 인가)를 코드로 넣어 막았다. 하지만 BaaS는 자동 API라 그 검사를 넣을 엔드포인트 코드가 없다. 그래서 **DB 자체에 권한을 걸어야** 한다. 그 도구가 RLS다.

## RLS — DB가 행마다 "이건 네가 못 봐"라고 거른다

**RLS(Row Level Security)**는 "이 사용자는 이 행만 볼/고칠 수 있다"를 **데이터베이스 수준에서** 정의하는 정책(policy)이다.

예: `posts` 표에 "로그인한 사용자는 `user_id`가 본인인 행만 볼 수 있다"는 정책을 건다. 그러면:
- 사용자 A가 `select * from posts`를 날려도, DB가 **A의 행만** 돌려준다. 다른 사람 행은 존재하지 않는 것처럼 보인다.
- 이건 DB가 거르는 것이지, 프론트가 숨기는 게 아니다. SDK로 직접 쳐도 우회가 안 된다.

핵심 통찰: **권한 판단이 DB에서 일어나므로, 클라이언트 코드를 어떻게 우회하든 뚫리지 않는다.** 이것이 프론트 숨김과 RLS의 결정적 차이다.

## 프론트 숨김 vs RLS — 왜 RLS가 안전한가

| 방식 | 어디서 검사 | 우회 가능? |
|---|---|---|
| 프론트에서 버튼/데이터 숨김 | 사용자 기기(클라이언트) | **가능** (개발자 도구/직접 API 호출) |
| 백엔드 코드에서 권한 검사 | 서버 | 불가 |
| **RLS** | **데이터베이스** | **불가** |

Phase 2에서 "신뢰 판단은 서버에"를 배웠다. BaaS에선 서버 코드(자동 API) 대신 **DB가 그 역할**을 한다. RLS가 곧 BaaS의 인가 계층이다. RLS 없는 BaaS 서비스는 "모든 데이터가 공개된 상태에서 화면만 숨긴 것"과 같다.

## 정책(policy)의 예 — 어떻게 쓰나

Supabase에서 RLS 정책은 SQL 비슷한 표현으로 건다. 직접 쓸 필요는 없지만, 어떤 모양인지 아는 게 도움된다:

```sql
-- posts 표: '로그인한 사용자는 본인 글만 조회'
create policy "내 글만 보기"
on posts for select
using (auth.uid() = user_id);

-- '본인 글만 수정/삭제'
create policy "내 글만 고치기"
on posts for update
using (auth.uid() = user_id);

-- '관리자는 전부 조회'
create policy "관리자 전체 조회"
on posts for select
using (auth.uid() in (select id from users where role = 'admin'));
```

`auth.uid()`는 "지금 요청한 사용자의 id"다. 이 정책이 있으면, 같은 `select * from posts`라도 일반 회원에겐 본인 것만, 관리자에겐 전체가 돌아간다 — DB가 알아서 거른다.

## worked example: "관리자/사용자 게시판" 보안 설계

고객 요구: "일반 회원은 본인 글만, 관리자는 전체 글을 본다. 관리자는 글을 지울 수 있다."

틀린 구현(프론트 숨김만): 관리자 화면에만 "전체 글" 목록을 보여주고 일반 화면에선 숨김. → 누구나 SDK로 `select *`를 쳐서 전체 글 탈취 가능. **뚫림.**

맞는 구현(RLS):
1. `posts` 표에 RLS 켬.
2. 정책: `select` — `user_id = 본인` 또는 `본인.role = admin`. → 일반은 본인 것만, 관리자는 전체 (DB가 필터).
3. 정책: `delete` — `본인.role = admin`만. → 관리자만 삭제 (DB가 거부).
4. 프론트는 그 위에서 자연스럽게 UI(관리자 화면엔 전체가 보이니까).

이제 SDK로 직접 쳐도 DB가 막는다. **"권한은 RLS로"**가 BaaS의 철칙이다.

## 실 사례(익명화) — 관리자/일반의 "데이터 가시성"을 DB에서 가른 결정

> 실제 프로젝트 사례를 익명화해 옮겼다.

한 서비스에선 관리자는 전체 데이터를, 일반 사용자는 자기 것만 봐야 했다. 자동 API가 열린 BaaS 환경이라, **RLS가 없으면 누구나 SDK로 전체 데이터를 가져갈 수 있었다.** 팀은 "이 행은 본인 것만(또는 관리자만)"을 **DB 수준의 RLS 정책**으로 걸었다 — 화면(클라이언트)에서 숨기는 게 아니라 DB 자체가 거르게. 그래야 API를 직접 쳐도 안 뚫린다.

교훈: BaaS에선 "권한"이 곧 **RLS**다. "관리자만 본다"를 프론트 숨김으로 하면 우회당하고, RLS로 하면 DB가 막는다. 상담에서 "이 데이터는 누가 볼 수 있나?"를 물으면, 그 답이 "RLS 정책으로" 이어져야 한다.

## 흔한 실패 모드와 처방

- **RLS를 안 켠다.** 표를 만들고 자동 API만 믿으면 전체 데이터 노출. 처방: 모든 표에 RLS를 켜고 정책을 걸 것(기본값).
- **service_role 키를 프론트에 쓴다.** 이 키는 RLS를 무시하는 마스터 키 — 프론트에 박으면 RLS가 무의미. 처방: 프론트는 `anon` 키만, 관리자 작업은 서버/Edge Function에서 service_role 사용.
- **정책을 안 테스트한다.** "관리자만" 정책이 빠져 있어도 겉보기엔 동작. 처방: 일반 계정으로 다른 사람 데이터 조회를 시도해 보는 보안 테스트.
- **"나중에 RLS"로 미룬다.** 데이터 노출은 첫날부터 일어난다. 처방: MVP 단계부터 RLS 기본 켜기.

## 상담에 바로 쓰는 한 줄

BaaS를 쓴다면, "모든 표에 RLS가 켜져 있나?"를 기본 질문으로 가져라. "아직 안 켰다"면 보안 구멍이다.

## 개발자가 이 단어 말할 때

- **RLS / policy** — 행 수준 보안 / 그 규칙.
- **anon 키 / service_role 키** — RLS 적용받는 키 / RLS 무시 마스터 키.
- **auth.uid()** — 현재 요청 사용자 id (정책 안에서 쓰는 함수).
- **public 표** — RLS를 안 건 표(=누구나 접근). 주의 대상.
- **우회(bypass)** — 클라이언트에서 권한 검사를 무시하는 것 (RLS는 이걸 막음).

## ✍️ 산출물 과제

본인 서비스의 표 하나를 골라, 그 표의 행을 "누가 볼 수 있고, 누가 고칠 수 있는가"를 두 개의 정책으로 적어보라. (예: "조회: 본인 것만 또는 관리자", "삭제: 관리자만".) 그리고 "이걸 프론트 숨김으로만 하면 어떤 일이 생기나"를 한 줄로 적어라.

## 한 걸음 더

RLS는 강력하지만, 정책이 많아지면 "왜 이 데이터가 안 보이지?"를 디버깅하기 어려워진다. 정책은 최소한으로, 의도를 이름에 남기고("내 글만 보기"), 일반 계정으로 직접 조회 테스트를 돌려 확인하는 습관이 RLS의 실전 운용법이다.

> 더 보기: Supabase RLS 공식 문서 · https://supabase.com/docs/guides/database/postgres/row-level-security
