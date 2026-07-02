PM이 SQL을 직접 짤 필요는 없다. 하지만 개발자가 "이 쿼리가 느려요", "조인이 많아요", "인덱스를 타야 해요"라고 할 때 그 말이 무엇을 뜻하는지는 알아야 한다. 협업 툴에서 쿼리 로그를 보거나, 간단한 데이터 조회를 직접 해보거나, 개발자의 느림 증상을 이해하는 데 SQL 읽기는 쓸모가 크다. 이 레슨은 읽기 전용으로 SQL의 네 동사(SELECT/JOIN/WHERE/INDEX)를 다룬다. 목표는 "이 쿼리가 뭘 묻고 있는지"를 읽을 수 있는 것이다.

## SELECT — 데이터를 가져오는 기본 동사

`SELECT`는 "이 열들을 줘"라는 조회 명령이다.

```sql
SELECT name, email
FROM users;
```

뜻: "users 표에서 name, email 열을 가져와라." 결과로 모든 회원의 이름·이메일이 나온다. `SELECT *`는 "모든 열"이라는 뜻(편리하지만 필요한 것만 고르는 게 예의다).

## WHERE — 조건으로 거르기

`WHERE`는 "이 조건에 맞는 것만"으로 거른다.

```sql
SELECT name, email
FROM users
WHERE is_admin = true;
```

뜻: "users 표에서 관리자인 사람의 name, email만." WHERE가 없으면 전체를 가져오니, 조회는 거의 항상 WHERE와 짝이다.

PM이 데이터를 "조건별로" 보고 싶을 때(예: "지난달 가입자 수"), 그것은 곧 `WHERE created_at >= '2026-06-01'` 같은 조건 조회다. "이 조건으로 뽑아 달라"를 말로 정확히 할 수 있으면 개발자/분석가의 작업이 빨라진다.

## JOIN — 표와 표를 이어 붙이기

`JOIN`은 여러 표를 **이어 붙여** 함께 본다. (이전 레슨에서 FK로 표를 나눴으니, 다시 합쳐 보려면 JOIN이 필요하다.)

```sql
SELECT users.name, reservations.date
FROM reservations
JOIN users ON reservations.user_id = users.id;
```

뜻: "reservations 표와 users 표를, `reservations.user_id = users.id`인 줄로 이어 붙여서, 예약의 날짜와 그 예약자의 이름을 보여줘." 즉 "누가 언제 예약했나"를 한 표로 보는 것이다.

JOIN이 자주 쓰이는 까닭: 정규화로 데이터를 여러 표에 나눠 두었기 때문에, "결제한 사람의 이름"을 보려면 payments → reservations → users로 두 번 JOIN해야 한다. **"이 쿼리는 조인이 많아요"라는 말은 "여러 표를 건너 건너 합쳐야 해서 복잡/느릴 수 있다"**는 뜻이다.

## ORDER BY / LIMIT — 정렬과 자르기

```sql
SELECT name, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

뜻: "가입일 역순으로 정렬해, 10명만." 최근 가입자 10명을 본다. **대시보드의 "최근 N개"는 거의 다 이 패턴**이다.

## 집계 — COUNT, SUM, AVG

```sql
SELECT COUNT(*) AS total_reservations
FROM reservations
WHERE date = '2026-07-15';
```

뜻: "7월 15일 예약이 몇 건인가." PM이 자주 보고 싶은 숫자(예약 수, 매출 합, 평균)는 `COUNT`, `SUM`, `AVG`로 뽑는다. "이번 달 결제 총액"은 `SELECT SUM(amount) FROM payments WHERE ...`다.

## INDEX — "이 열로 빨리 찾게 해 달라"

`WHERE`로 자주 거르는 열(예: reservations.date, users.email)에 **인덱스**를 두면 검색이 빨라진다. 인덱스는 책의 색인처럼, 전체를 훑지 않고 해당 행으로 바로 뛰어가게 해준다.

- 인덱스가 있으면: `WHERE email = 'hong@…'`가 순식간에 한 행을 찾는다.
- 없으면: users 표 전체를 처음부터 끝까지 훑는다(full table scan) — 회원 100만 명이면 느리다.

**"이 쿼리가 느린데, 인덱스를 타나요?"** — PM이 할 수 있는 가장 가치 있는 질문 중 하나. 자주 검색하는 열에 인덱스가 없다면 그게 느림의 원인일 수 있다. 단, 인덱스도 비용(쓰기 지연·용량)이니 남발은 금물.

## worked example: "오늘 예약 현황 대시보드" 쿼리 읽기

관리자 화면 요구: "오늘 예약 건수, 그 중 '확정' 상태만."

```sql
SELECT
  COUNT(*) AS today_total,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed
FROM reservations
WHERE date = CURRENT_DATE;
```

읽기: "reservations에서 오늘 것만 골라(WHERE), 전체 수(COUNT(*))와 그중 확정 수를 세라." 이 쿼리를 보면, "이 대시보드는 예약 표에서 오늘 것만 세면 된다"는 게 한눈에 들어온다. 만약 여기에 사용자 이름까지 필요하면 JOIN users가 추가되고, reservations.date에 인덱스가 없으면 날짜 조회가 느려진다. 이렇게 쿼리를 읽으면 "왜 느린가 / 공수가 얼마인가"가 보인다.

## 흔한 실패 모드와 처방

- **`SELECT *` 남발.** 필요 없는 열까지 가져와 느려진다. 처방: 필요한 열만 명시.
- **인덱스 없는 열로 대량 조회.** full scan으로 지연. 처방: 자주 거르는 열(WHERE/JOIN 조건)에 인덱스.
- **N+1 쿼리.** 루프 안에서 한 건마다 쿼리를 쏴 수백·수천 건이 나가는 안티패턴. 처방: 한 번의 JOIN/IN으로 묶기. (성능 장애의 흔한 원인)
- **데이터베이스를 계산기로 쓴다.** 복잡한 통계를 DB 쿼리 한 방에 하려다 쿼리가 몇 분 걸린다. 처방: 무거운 집계는 미리 모아둔 표(요약표/OLAP)에서.

## 상담에 바로 쓰는 한 줄

"이 데이터 화면"을 요구할 때, "이 화면은 어느 표에서, 어떤 조건(WHERE)으로, 무엇을 세거나(COUNT/SUM) 보여주는가?"를 말로라도 적어라. 그것이 쿼리의 청사진이다.

## 개발자가 이 단어 말할 때

- **쿼리(query)** — DB에 던지는 질문(SQL 문).
- **조인(JOIN)** — 표를 이어 붙이기.
- **집계(COUNT/SUM/AVG)** — 수를 세거나 합산.
- **풀 스캔** — 표 전체를 훑는 느린 검색(인덱스 없을 때).
- **실행 계획(explain)** — 쿼리가 어떻게 돌지 미리 보는 것. "느린 쿼리 분석"의 도구.

## ✍️ 산출물 과제

본인 서비스에서 "보고 싶은 숫자 하나"(예: 이번 달 예약 수, 오늘 가입자 수)를 정하고, 그것을 "어느 표 / 무슨 조건 / 무슨 집계"로 말로 풀어 써라. 그것을 개발자에게 주면 곧 SQL 한 줄이 된다. 가급적 JOIN이 필요한 숫자 하나를 더 골라, 어떤 표를 이어야 하는지까지 적어 보라.

> 더 보기: PostgreSQL 공식 문서(튜토리얼) · https://www.postgresql.org/docs/
