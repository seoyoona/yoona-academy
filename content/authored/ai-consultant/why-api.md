"화면에서 버튼 누르면 서버가 데이터를 주는 거 아닌가요? 왜 API가 따로 필요하죠?" 이 질문은 상담에서 자주 나온다. 답부터 말하면, 화면과 서버는 **서로 다른 기계**에서 도는 프로그램이라, 둘이 대화하려면 "어떤 말을 어떤 형식으로 주고받을지"에 대한 **약속**이 필요하다. 그 약속이 API다. 이 레슨은 API가 왜 필요한지, REST와 JSON이 무엇인지, 엔드포인트가 왜 "문"인지를 다룬다. 목표는 개발자가 "API 명세 주세요"라고 할 때 그 말의 뜻을 정확히 아는 것이다.

**API — 요청과 응답의 약속** (화면↔서버가 주고받는 흐름):

<svg viewBox="0 0 560 120" width="100%" style="max-width:560px;height:auto;display:block;margin:10px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="프론트엔드와 API 서버가 요청과 응답을 주고받는 흐름">
  <defs><marker id="arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#64748b"/></marker></defs>
  <rect x="10" y="35" width="130" height="50" rx="8" fill="#0ea5e9"/><text x="75" y="64" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">프론트엔드</text>
  <rect x="215" y="35" width="130" height="50" rx="8" fill="#6366f1"/><text x="280" y="64" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">API (서버)</text>
  <rect x="420" y="35" width="130" height="50" rx="8" fill="#0ea5e9"/><text x="485" y="64" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">프론트엔드</text>
  <line x1="140" y1="50" x2="213" y2="50" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/><text x="176" y="42" text-anchor="middle" font-size="10" fill="#64748b">요청(JSON)</text>
  <line x1="215" y1="75" x2="142" y2="75" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/>
  <line x1="345" y1="60" x2="418" y2="60" stroke="#64748b" stroke-width="1.8" marker-end="url(#arr)"/><text x="381" y="52" text-anchor="middle" font-size="10" fill="#64748b">응답(JSON)</text>
</svg>

## API는 '계약'이다

API(Application Programming Interface)는 **프로그램끼리 대화하기 위해 정한 계약**이다. 사람끼리도 "예약은 이렇게 말해 줘야 알아듣습니다"라는 약속이 없으면 소통이 안 되듯, 프로그램도 마찬가지다.

- 프론트엔드가 "예약 하나 만들어 줘"라고 말하는 방식
- 백엔드가 "성공했어, 예약 번호는 123이야"라고 답하는 방식

이 둘을 미리 정해 둔 것이 API다. **API가 명확하면 누가 화면을 만들든 같은 규칙으로 붙일 수 있다.** 관리자 화면을 나중에 추가해도, 모바일 앱을 추가해도, 외부 파트너가 우리 데이터를 쓰게 해도, 모두 같은 API 문(-door)을 통한다. 그래서 API는 "지금 화면 하나"가 아니라 "앞으로 붙을 모든 화면"을 위한 투자다.

## REST — 문을 '동사+명사'로 정리하는 약속

**REST**는 API를 체계적으로 정리하는 관례다. 핵심은 두 가지다:

1. **자원(명사)을 주소로**: 다루는 대상을 주소로 표현한다. `/reservations`(예약들), `/users`(사용자들).
2. **행동(동사)을 HTTP 메서드로**: `GET`(조회), `POST`(생성), `PUT/PATCH`(수정), `DELETE`(삭제)로 행동을 구분한다.

`GET /reservations`는 "예약 목록을 달라", `POST /reservations`는 "예약을 하나 만들어 달라"가 된다. 같은 주소 `/reservations`를 쓰되 동사(GET/POST/...)로 행동을 구분하는 게 REST의 묘미다. 개발자가 "RESTful하게 짭시다"라 하면 "자원은 명사, 행동은 HTTP 메서드로 정리하자"는 뜻이다.

REST를 반드시 써야 하는 건 아니다. GraphQL·gRPC 같은 다른 약속도 있다. 하지만 REST가 가장 널리 쓰이고 읽기 쉬워, 초기 서비스의 기본 선택이다. PM은 "REST인가요?"를 물어 API 구조의 대략을 짐작할 수 있다.

## JSON — 데이터를 주고받는 '형식'

**JSON**은 API가 데이터를 주고받을 때 쓰는 **글 형식**이다. 중괄호 `{}`와 키-값으로 데이터를 표현한다. 예를 들어 예약 생성 요청은:

```json
{
  "userId": "u_123",
  "date": "2026-07-15",
  "time": "14:00"
}
```

서버 응답도 같은 형식:

```json
{
  "reservationId": "r_456",
  "status": "confirmed"
}
```

왜 JSON인가. 사람과 기계 모두 읽기 쉽고, 거의 모든 언어가 지원한다. 개발자가 "응답은 JSON으로 드릴게요"라 하면, "위처럼 생긴 글자로 데이터를 보낸다"로 들으면 된다. **"API 스펙"이라는 말은 결국 "어떤 JSON을 주고받을지 적은 문서"**다.

## 엔드포인트 — API의 '문 주소'

**엔드포인트**는 API의 각 문 주소다. `POST /reservations` 하나가 하나의 엔드포인트다. 서비스가 커질수록 문이 많아진다: `GET /reservations`, `POST /payments`, `GET /notifications`.... API 명세서는 이 문들의 목록이다 — "어떤 주소로, 어떤 JSON을 보내면, 어떤 JSON이 돌아오는지"를 적은 표.

PM이 API 명세를 읽을 수 있으면(쓸 필요는 없다), 개발자에게 "이 기능은 엔드포인트 몇 개가 드나요?"라고 물어 공수를 가늠할 수 있다. "사용자 화면 + 관리자 화면"이 같은 엔드포인트를 재활용하면 싸고, 매번 새 엔드포인트가 생기면 비싸다.

## worked example: "문의 폼"의 API 설계

고객 요구: "사용자가 문의를 남기면 사장님이 본다."

1. **자원 식별**: 다루는 대상은 '문의(inquiry)'다. 주소는 `/inquiries`.
2. **필요한 행동**:
   - 사용자가 문의를 **생성**: `POST /inquiries` (본문: 이름, 연락처, 메시지)
   - 사장님이 문의 목록을 **조회**: `GET /inquiries` (응답: 문의들의 JSON 배열)
   - 사장님이 문의를 **처리 완료** 표시: `PATCH /inquiries/{id}` (상태를 "done"으로)
3. **한 문으로 정리**: 문의 기능 = 엔드포인트 3개.

이 정도면 공수과 리스크가 보인다. "문의 하나 만들어주세요"가 사실은 3개의 API 문과 그에 맞는 화면·권한(사장님만 조회)이라는 구체적 작업으로 쪼개진다.

## 실 사례(익명화) — 명세서의 동사가 곧 API 목록이 된 케이스

> 실제 프로젝트 사례를 익명화해 옮겼다.

한 클라이언트 서비스에서 기능을 정의할 때, 팀은 **IA(정보구조)와 기능명세를 먼저 쓰고**, 그걸 "엔드포인트 몇 개"로 번역하는 작업부터 했다. 방법은 단순했다 — 명세 안의 **동사**를 전부 뽑아 내는 것. "사용자가 예약하고, 관리자가 조회하고, 결제를 확인한다"면 동사가 곧 `예약 생성 / 예약 조회 / 결제 확인`이고, 이게 API 목록이 됐다.

교훈: 고객의 "기능 하나"가 동사로 안 쪼개지면 API가 안 보인다. 반대로 동사를 세면 엔드포인트 수가 보이고, 그게 공수의 첫 근거가 된다. 상담에서 요구를 듣자마자 "이 안에 동사가 몇 개야?"로 세어 보는 습관 — 이 사례가 그 실무 가치를 보여준다.

## 흔한 실패 모드와 처방

- **API 없이 화면과 서버를 구겨 넣는다.** 처음엔 빠르지만 두 번째 화면(관리자)을 붙일 때 처음부터 다시 짠다. 처방: 화면이 하나뿐이어도 API 계약을 먼저 정의하라.
- **자원을 동사로 짓는다.** `/createReservation`처럼 주소에 행동을 넣으면 REST가 깨지고 문이 불어난다. 처방: 주소는 명사(`/reservations`), 행동은 HTTP 메서드로.
- **명세를 안 써 둔다.** 코드로만 API가 정의되면, 나중에 누가 어떤 문을 쓸 수 있는지 아무도 모른다. 처방: API 명세를 산출물로 관리하라 (Swagger/Postman 등).

## 상담에 바로 쓰는 한 줄

새 기능 요구가 들어오면 "이 기능은 데이터를 새로 만드는가, 조회만 하는가, 고치는가?"로 동사(GET/POST/PATCH/DELETE)를 먼저 붙여 보라. 그러면 엔드포인트 수가 보이고 공수가 잡힌다.

## 개발자가 이 단어 말할 때

- **"엔드포인트"**: API의 문 주소.
- **"페이로드(payload)"**: 요청/응답에 실려 가는 데이터 본문(JSON).
- **"상태 코드"**: 응답의 결과. `200` 성공, `400` 잘못된 요청, `401` 인증 안 됨, `404` 없음, `500` 서버 오류. (Phase 1 MDN 레슨 참고)
- **"CRUD"**: Create/Read/Update/Delete — API의 네 가지 기본 행동 (다음 레슨).

## ✍️ 산출물 과제

본인이 기획하는 기능 하나를 골라, 그것에 필요한 API 엔드포인트를 `동사 /명사` 형태로 2~4개 적어 보라. 각 엔드포인트마다 "보내는 JSON"과 "받는 JSON"의 키를 2~3개씩만 적어라. 이것이 API 명세의 뼈다.

> 더 보기: MDN — Server-side 첫걸음 · https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/First_website
