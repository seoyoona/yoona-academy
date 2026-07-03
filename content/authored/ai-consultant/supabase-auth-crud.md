"로그인 있고, 게시글 올리고, 사진 첨부하는 서비스 만들어 주세요." — 이 요구를 받았을 때 백엔드 서버 한 줄도 안 짜고 며칠 만에 띄울 수 있다면? Supabase가 바로 그것이다. 이 레슨은 Supabase 하나로 인증(Auth) + 데이터베이스(Postgres) + 파일 저장(Storage)을 어떻게 한 세트로 쓰는지, 그리고 자동 API까지 어떻게 붙는지를 다룬다. Phase 4의 실전 레슨 — BaaS로 CRUD 전체를 빠르게 만드는 법이다.

## Supabase는 'Postgres가 중심'

Supabase를 한 줄로 요약하면 **"Postgres 데이터베이스를 중심으로 로그인·API·파일·실시간을 빠르게 붙일 수 있게 해주는 BaaS"**다. 핵심은 중심에 **PostgreSQL**(관계형 DB, Phase 3 참고)이 있다는 점이다.

이게 왜 중요한가. Firebase는 자체 DB(Firestore, 문서형)를 써서 관계형 모델링이 제한적인 반면, Supabase는 **표준 Postgres**를 그대로 쓴다. 즉 Phase 3에서 배운 table·PK·FK·조인·SQL·트랜잭션이 그대로 통한다. 나중에 BaaS를 벗어나 직접 백엔드로 옮겨도 DB 구조를 그대로 가져갈 수 있다(벤더 종속이 적다).

## 세 가지 부품: Auth · Database · Storage

Supabase 프로젝트 하나에 세 부품이 기본으로 딸려 나온다.

- **Auth(인증)**: 회원가입·로그인·소셜 로그인(구글·카카오 등)·비밀번호 재설정까지 미리 만들어져 있다. 세션·토큰도 Supabase가 관리(Phase 2 인증·인가 참고).
- **Database(Postgres)**: 표를 만들고 데이터를 넣고 뺀다. Phase 3의 ERD·정규화가 그대로 적용된다.
- **Storage(파일)**: 이미지·문서 파일을 올리고 URL로 받는다. 프로필 사진·첨부파일용(Phase 2 파일 업로드 참고).

이 셋이 **하나의 사용자 체계로 묶여 있다**는 것이 핵심이다. Auth로 로그인한 사용자의 id가 Database의 행·Storage의 파일과 자연스럽게 연결된다. "이 사진은 이 사용자의 것이다"를 구현하기 쉽다.

## 자동 API — 표를 만들면 문이 생긴다

Supabase는 표(table)를 만들면 그 표에 대한 **자동 API**를 만들어준다. `/rest/v1/posts` 같은 엔드포인트가 표 생성과 함께 생기는 식이다. 즉 Phase 2에서 배운 "CRUD 엔드포인트 5개"를 직접 코딩하지 않아도 된다 — 표만 설계하면 조회·생성·수정·삭제가 자동으로 열린다.

프론트엔드 코드에서는 Supabase SDK로 바로 이 표를 다룬다:

```ts
// 게시글 목록 조회 (자동 API를 SDK로 호출)
const { data, error } = await supabase.from("posts").select("*");

// 게시글 생성
await supabase.from("posts").insert({ title, content, user_id: user.id });

// 파일 업로드
await supabase.storage.from("photos").upload(path, file);
```

백엔드 서버 코드(Express 라우트 등)를 안 짜도 CRUD와 파일 업로드가 동작한다. 이게 "며칠 만에 MVP"가 가능한 이유다.

## worked example: "사진 첨부 게시판" 만들기

고객 요구: "회원이 로그인해서 글을 쓰고 사진을 첨부하고, 본인 글만 고칠 수 있게."

Supabase로의 흐름:
1. **Auth**: 회원가입·로그인을 Supabase Auth에 맡긴다. 이메일/비번 또는 구글 로그인 설정만으로 끝.
2. **Database**: `posts` 표를 만든다 — `id`(PK), `user_id`(FK→auth.users), `title`, `content`, `photo_url`, `created_at`.
3. **자동 API**: `posts` 표가 생기면서 CRUD 엔드포인트가 자동 생성된다.
4. **Storage**: 사진은 `photos` 버킷에 올리고, 얻은 URL을 `posts.photo_url`에 저장.
5. **권한**: "본인 글만 수정·삭제"는 RLS 정책으로 건다(다음 레슨).

이 전체가 백엔드 서버 없이, 프론트 + Supabase 설정만으로 동작한다. "게시판 하나"가 서버 코드 한 줄 없이 완성되는 것이다. Phase 1~3의 모든 개념(Auth, CRUD, FK, Storage)이 한 흐름에 실려 있다.

## 한계 — BaaS의 달콤함 뒤

빠르지만 한계도 분명하다(Phase 4 마지막 레슨에서 더 다룸):

- **복잡한 로직은 Edge Function으로 우회**해야 한다. "엑셀 업로드 → 파싱 → 대량 발송" 같은 복잡 흐름은 자동 API만으론 안 되고, 작은 서버 코드(Edge Function)를 넣어야 한다.
- **권한은 RLS로 꼭**. 자동 API가 열려 있으니, 누구나 어떤 데이터든 볼 수 있게 될 위험이 있다. RLS 없으면 보안 구멍(다음 레슨).
- **사용량 과금**. 읽기·대역폭이 많아지면 비용이 튄다.

## 흔한 실패 모드와 처방

- **RLS 없이 자동 API를 믿는다.** 누구나 모든 행을 조회/수정할 수 있다. 처방: 모든 표에 RLS를 켜고 정책을 건다(다음 레슨).
- **클라이언트에서 서비스 롤 키를 쓴다.** `service_role` 키는 모든 권한을 갖는 마스터 키 — 이걸 프론트에 박으면 보안 사고. 처방: 프론트는 익명(`anon`) 키만, 관리자 작업은 Edge Function에서 service_role 사용.
- **표 구조(스키마) 설계를 건너뛴다.** "빠르다고" 정규화 없이 시작하면 나중이 지옥. 처방: Phase 3 ERD를 그대로 적용 — Supabase도 결국 Postgres다.

## 상담에 바로 쓰는 한 줄

"로그인 + CRUD + 파일"이 핵심인 MVP라면, "Supabase 하나로 며칠 만에 가능하다"고 답할 수 있어야 한다. 단, "권한은 RLS로"를 빠뜨리지 말 것.

## 개발자가 이 단어 말할 때

- **프로젝트 / 스키마 / 표(table)** — Supabase 안의 데이터 구조. Postgres 그대로.
- **anon 키 / service_role 키** — 프론트용(제한) / 관리자용(전권) 접근 키.
- **RLS 정책(policy)** — "어떤 행을 누가 볼/고칠 수 있나"를 DB 수준에서 정의(다음 레슨).
- **Edge Function** — Supabase에서 도는 작은 서버 코드(직접 백엔드가 필요한 부분용).
- **버킷(bucket)** — Storage의 파일 묶음 단위.

## ✍️ 산출물 과제

본인 MVP의 핵심 표 하나(예: posts, reservations)를 설계하라. 열(column) 4~5개와 PK·FK를 적고, 그 표에 들어갈 데이터를 "누가" 쓸 수 있는지(RLS 관점)를 한 줄로 적어라. 그리고 파일 첨부가 필요한지, 필요하다면 어느 버킷에 올릴지 정하라.

> 더 보기: Supabase 시작하기 · https://supabase.com/docs/guides/getting-started
