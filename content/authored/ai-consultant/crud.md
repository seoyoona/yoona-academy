대부분의 서비스 기능은 네 가지 동사로 줄인다: **만들고(Create), 읽고(Read), 고치고(Update), 지운다(Delete)**. 이 네 글자를 따서 CRUD라 부른다. "게시판", "예약", "주문", "회원가입" — 겉보기엔 다 달라 보이지만 뜯어보면 전부 CRUD의 조합이다. PM이 이 사실을 알면, 고객의 요구를 듣자마자 "이건 C인가 R인가"로 분류하고, 어느 정도의 작업인지 바로 가늠할 수 있다. 이 레슨은 CRUD를 API와 데이터베이스에 연결해 본다.

**CRUD 한 자원 = 보통 엔드포인트 5개** (네 동사가 다섯 문으로 펴진다):

<svg viewBox="0 0 560 120" width="100%" style="max-width:560px;height:auto;display:block;margin:8px auto;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CRUD 네 동사가 다섯개 엔드포인트로 대응되는 관계">
  <rect x="10"  y="40" width="120" height="46" rx="8" fill="#10b981"/><text x="70"  y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Create (POST)</text>
  <rect x="150" y="40" width="120" height="46" rx="8" fill="#0ea5e9"/><text x="210" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Read (GET)</text>
  <rect x="290" y="40" width="120" height="46" rx="8" fill="#f59e0b"/><text x="350" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Update (PATCH)</text>
  <rect x="430" y="40" width="120" height="46" rx="8" fill="#ef4444"/><text x="490" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">Delete (DELETE)</text>
  <text x="280" y="110" text-anchor="middle" font-size="11" fill="#64748b">→ 실제 엔드포인트: 목록조회 + 단건조회 + 생성 + 수정 + 삭제 = 5개</text>
</svg>

## CRUD의 네 동사와 API의 대응

CRUD는 곧장 API의 HTTP 메서드로 이어진다.

| CRUD | 뜻 | HTTP 메서드 | 예(게시글) |
|---|---|---|---|
| **C**reate | 새로 만든다 | POST | 글 쓰기 |
| **R**ead | 읽는다 | GET | 글 목록 보기 / 글 하나 보기 |
| **U**pdate | 고친다 | PUT/PATCH | 글 수정 |
| **D**elete | 지운다 | DELETE | 글 삭제 |

한 가지 눈치챌 점: Read는 보통 **두 가지**로 나뉜다. "목록(여러 개) 보기"와 "한 개 보기"다. `GET /posts`(목록)와 `GET /posts/123`(한 개). 그래서 한 '자원'에 대해 API는 보통 5개 문(목록조회, 단건조회, 생성, 수정, 삭제)을 갖는다. "게시판 하나 만들어주세요"가 사실은 엔드포인트 5개짜리 작업이라는 뜻이다.

## CRUD가 데이터베이스에서 하는 일

API가 CRUD의 '문'이라면, **데이터베이스가 CRUD가 실제로 일어나는 곳**이다.

- **Create** → DB에 새 행(row)을 **삽입(INSERT)**.
- **Read** → DB에서 행을 **조회(SELECT)**.
- **Update** → DB의 행을 **수정(UPDATE)**.
- **Delete** → DB의 행을 **삭제(DELETE)**.

이 네 동사가 곧 SQL(데이터베이스 언어)의 기본이기도 하다. 그래서 "API에서 C/R/U/D를 만든다"는 말은 곧 "DB에서 INSERT/SELECT/UPDATE/DELETE가 일어나게 한다"는 뜻이다. **API는 손님이 주문을 받는 카운터, DB는 주문을 실제로 요리하는 주방**이라고 생각하면 된다.

## worked example: "관리자가 공지사항을 관리한다"를 CRUD로 쪼개기

고객 요구: "관리자가 공지사항을 올리고, 사람들은 보고, 관리자가 고치거나 지울 수 있게."

| 행동 | CRUD | API | DB |
|---|---|---|---|
| 공지 쓰기 | Create | `POST /notices` | INSERT |
| 공지 목록 보기(사용자) | Read | `GET /notices` | SELECT |
| 공지 한 개 보기 | Read | `GET /notices/{id}` | SELECT |
| 공지 수정(관리자) | Update | `PATCH /notices/{id}` | UPDATE |
| 공지 삭제(관리자) | Delete | `DELETE /notices/{id}` | DELETE |

한눈에 보인다: 엔드포인트 5개, 그중 2개(Create/Update/Delete)는 "관리자만" 쓸 수 있어야 한다 — 여기서 **권한(인가)**이 필요해진다(다음 레슨). 즉 "공지사항 기능"이라는 한 문장이 (1) 5개 API (2) 5종 DB 조작 (3) 관리자 권한 검사, 세 덩이로 쪼개진다. 이렇게 쪼개야 공수·리스크가 잡힌다.

## Create의 세부: 입력값 검증

Create에서 자주 깨지는 지점은 **입력값 검증**이다. "제목 없이 공지를 등록"하거나 "날짜에 글자를 넣는" 것을 막아야 한다. 검증은 두 단계에서 일어난다:

1. **프론트엔드**: 빈 칸 확인 등 가벼운 검증. 사용자 친화적 but 사용자가 조작 가능.
2. **백엔드**: 신뢰의 마지노선. 프론트를 믿지 않고 다시 검증한다.

PM이 알아야 할 것: **"검증은 백엔드에 있어야 안전하다"**는 원칙. 프론트 검증은 편의용이지 보안용이 아니다. 잘못된 데이터가 DB에 들어가면 나중에 큰 버그가 되니, Create의 검증 공수를 절대 "나중에"로 미루면 안 된다.

## Update의 함정: 부분 수정 vs 전체 수정

Update에도 두 가지가 있다:

- **PUT**: 자원 전체를 바꾼다. (안 보낸 필드는 사라질 수 있음)
- **PATCH**: 보낸 필드만 고친다. (안 보낸 건 그대로)

예: `PATCH /notices/1`에 `{"title": "새 제목"}`만 보내면 내용은 그대로 두고 제목만 바뀐다. PM 입장에선 "수정"이라 하나지만, 개발자에겐 PUT과 PATCH는 다른 작업이다. 대개 **PATCH가 안전**하다(실수로 데이터를 날릴 위험이 적어서). 회의에서 "수정은 PATCH로"라고 정해 두면 좋다.

## Delete의 두 얼굴: 진짜 지움 vs 숨김

"삭제"에는 두 가지 구현이 있다:

- **하드 삭제(Hard Delete)**: DB에서 행을 진짜로 지운다. 되돌릴 수 없다.
- **소프트 삭제(Soft Delete)**: `deleted_at` 같은 표시만 하고 행은 남겨둔다. "휴지통".

둘 중 뭘 쓸지는 비즈니스 결정이다. "탈퇴한 회원의 주문 내역은 법적으로 보관해야 한다"면 소프트 삭제가 강제된다. "5분 뒤 복구 가능한 휴지통"을 원하면 소프트 삭제. PM은 "삭제는 진짜 지우는 건가요, 숨기는 건가요?"를 기본 질문으로 가져야 한다 — 이 대답이 DB 설계와 법적 리스크를 갈라놓는다.

## 실 사례(익명화) — "상품 화면 하나"가 숨긴 CRUD 복잡도

> 실제 프로젝트 사례를 익명화해 옮겼다.

한 클라이언트의 관리자 화면에서 **상품을 관리(CRUD)** 하는 기능이 있었다. 처음 요구는 "상품 화면 하나 추가해 주세요"라 단순해 보였다. 하지만 CRUD로 쪼개자 숨은 복잡도가 드러났다 — 상품 **생성·조회(목록+단건)·수정·삭제** 각각에, 관리자 **권한 검사**까지 붙었고, 상품 편집 컴포넌트는 기능이 붙을 때마다 점점 확장됐다.

교훈: "화면 하나"를 CRUD로 안 세면 이 복잡도가 전부 숨는다 — 견적이 빗나가는 첫 지점이다. CRUD로 세는 순간 "생성/조회/수정/삭제 + 권한 1곳"으로 공수가 잡히고, 관리자 화면의 편집 컴포넌트가 커질수록 공수가 어떻게 가는지까지 보인다.

## 흔한 실패 모드와 처방

- **CRUD를 '화면' 단위로만 생각한다.** "수정 화면 추가해 주세요"라고 해놓고 Update API·DB UPDATE가 빠지면 화면만 있고 기능은 안 된다. 처방: 기능을 받으면 항상 C/R/U/D 중 몇 개가 도는지 세어라.
- **검증을 프론트에만 둔다.** 백엔드 검증이 없으면 악의적 요청으로 쓰레기 데이터가 DB에 쌓인다. 처방: Create/Update는 항상 백엔드 재검증.
- **삭제를 진짜 삭제로만 생각한다.** 복구 요구가 들어왔을 때 대응 못 한다. 처방: 삭제 정책(하드/소프트)을 기획 단계에서 정해 두라.

## 상담에 바로 쓰는 한 줄

요구를 들으면 "이 기능이 데이터를 만드나, 읽나, 고치나, 지우나?"를 먼저 묻라. CRUD로 안 나뉘는 요구는 아직 모호한 것이다.

## 개발자가 이 단어 말할 때

- **"리소스/자원"**: CRUD의 대상(notices, posts, users).
- **"단건/목록 조회"**: Read의 두 가지 (GET /x/{} vs GET /x).
- **"idempotent"**: 같은 요청을 여러 번 해도 결과가 같은 성질. DELETE·PUT은 그렇다. (결제 등에서 중요)
- **"마이그레이션"**: DB 구조를 바꾸는 일. CRUD 대상이 바뀌면 필요 (Phase 3).

## ✍️ 산출물 과제

본인 서비스의 한 기능을 골라, 그 기능의 CRUD를 표로 만들어라(행동/CRUD/API/DB 4열). 반드시 "삭제는 하드인가 소프트인가"를 한 줄로 결정하고 그 이유를 적어라.

> 더 보기: The Odin Project — Full Stack 경로 (CRUD·백엔드 실습) · https://www.theodinproject.com/paths/full-stack-ruby-on-rails/courses/ruby-on-rails
