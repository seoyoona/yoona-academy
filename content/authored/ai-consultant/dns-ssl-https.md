사용자가 주소창에 `my-service.com`을 치면 어떻게 우리 서버에 닿을까? 그리고 그 연결이 "도청당해도 안전한" 연결이려면 무엇이 필요할까? 이 두 질문의 답이 **DNS**와 **SSL/HTTPS**다. 도메인을 서버로 연결하고, 그 연결을 암호화하는 것 — 사용자가 신뢰하고 들어오게 만드는 마지막 한 걸음이다. 이 레슨은 DNS와 SSL/TLS(HTTPS)가 각각 무엇인지, 왜 "https가 아닌 주소"가 브라우저 경고를 띄우는지를 다룬다.

**도메인 → 서버, 그리고 암호화(🔒)까지:**

<svg viewBox="0 0 560 140" width="100%" style="max-width:560px;height:auto;display:block;margin:8px auto;font-family:system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="도메인이 DNS를 거쳐 IP로, SSL로 암호화되어 서버에 닿는 흐름">
  <defs><marker id="arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#64748b"/></marker></defs>
  <rect x="5"   y="45" width="115" height="50" rx="8" fill="#0ea5e9"/><text x="62"  y="68" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">도메인</text><text x="62"  y="84" text-anchor="middle" font-size="9" fill="#e0f2fe">my.com</text>
  <rect x="145" y="45" width="100" height="50" rx="8" fill="#8b5cf6"/><text x="195" y="68" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">DNS 조회</text><text x="195" y="84" text-anchor="middle" font-size="9" fill="#ede9fe">이름→IP</text>
  <rect x="270" y="45" width="100" height="50" rx="8" fill="#f59e0b"/><text x="320" y="68" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">IP (서버)</text>
  <rect x="395" y="45" width="75"  height="50" rx="8" fill="#10b981"/><text x="432" y="68" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">SSL 🔒</text><text x="432" y="84" text-anchor="middle" font-size="9" fill="#d1fae5">암호화</text>
  <rect x="495" y="45" width="60"  height="50" rx="8" fill="#6366f1"/><text x="525" y="68" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">HTTPS</text>
  <line x1="120" y1="70" x2="143" y2="70" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <line x1="245" y1="70" x2="268" y2="70" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <line x1="370" y1="70" x2="393" y2="70" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <line x1="470" y1="70" x2="493" y2="70" stroke="#64748b" stroke-width="1.6" marker-end="url(#arr)"/>
  <text x="280" y="120" text-anchor="middle" font-size="10" fill="#64748b">SSL 없으면 브라우저가 "안전하지 않음" 경고 → 사용자 이탈</text>
</svg>

## DNS — '도메인 이름'을 '서버 주소'로 바꾸는 전화번호부

컴퓨터는 숫자 주소(IP, 예: `13.124.x.x`)로 통신한다. 그런데 사람은 `my-service.com`같은 이름을 기억한다. **DNS(Domain Name System)**는 이 둘을 이어주는 **전화번호부**다 — "my-service.com"이라는 이름을 IP 주소로 바꿔준다.

흐름:
1. 사용자가 `my-service.com` 입력.
2. 브라우저가 **DNS 서버**에 "이 도메인의 IP가 뭐야?" 조회.
3. DNS가 IP를 돌려줌.
4. 브라우저가 그 IP로 접속 → 우리 서버.

"DNS 설정"이란 이 **이름→IP 매핑**을 등록하는 일이다. AWS에선 **Route 53**, 다른 곳엔 Cloudflare·가비아 같은 DNS 서비스가 이 역할을 한다. 도메인을 사고, 그 도메인이 우리 서버(EC2·Vercel)를 가리키게 세팅하는 것이 DNS 설정이다.

PM 식 요약: "DNS = 도메인 이름을 서버 주소(IP)로 바꾸는 전화번호부. 도메인 사서 서버 연결이 이것."

## SSL/TLS — 연결을 '암호화'하는 인증서

DNS로 서버를 찾았다. 그런데 사용자와 서버 사이를 오가는 데이터(비밀번호, 결제 정보)가 도청당하면? 이걸 막는 게 **SSL/TLS 인증서**다. 인증서를 적용하면 **HTTPS**(HTTP over SSL/TLS)가 되어, 통신이 암호화된다.

- **HTTPS**: 브라우저와 서버 간 데이터가 암호화돼 도청·위조를 막음. 주소창에 🔒 자물쇠 표시.
- **HTTP**(암호화 없음): 도청 위험. 요즘 브라우저는 "안전하지 않음" 경고를 띄움.

인증서는 "이 서버는 정말 my-service.com의 서버가 맞다"를 보증하는 디지털 문서다. 예전엔 돈 주고 기관에서 발급받았지만, 요즘은 **Let's Encrypt**(무료 자동 발급)나 클라우드(Vercel/AWS)의 자동 인증서 기능이 흔해, 대부분 무료로 HTTPS를 켠다.

PM 식 요약: "SSL 인증서 = 통신 암호화. HTTPS 자물쇠. 요즘은 무료·자동이 기본."

## 왜 HTTPS가 필수인가 — 세 가지 이유

1. **보안**: 비밀번호·결제·개인정보가 도청·위조당하지 않게 암호화.
2. **신뢰**: HTTPS가 아니면 브라우저가 "안전하지 않음" 경고 → 사용자 이탈.
3. **필수 기능**: 최신 웹 기능(앱 설치·푸시·일부 API)이 HTTPS에서만 동작. HTTP에선 아예 안 됨.

그래서 "HTTPS 켜기"는 선택이 아니라 기본이다. Vercel/Render 같은 PaaS는 배포하면 자동으로 HTTPS를 켜주고, 직접 EC2를 쓰면 인증서를 설정(Let's Encrypt + 자동갱신)해야 한다. "배포 = 도메인+SSL까지 포함"인지가 PaaS의 큰 장점이다.

## DNS + SSL의 흐름 — 한 그림

```
사용자가 https://my-service.com 입력
  → DNS 조회: my-service.com 의 IP 획득
  → 그 IP(우리 서버)에 HTTPS 연결
  → SSL 인증서로 암호화 연결 성립 (자물쇠 🔒)
  → 암호화된 통신으로 데이터 오고감
```

이 흐름이 매 방문마다 일어난다. "도메인을 샀다"고 끝이 아니라 — 그 도메인을 서버로 연결(DNS)하고 암호화(SSL)까지 켜야 사용자가 안전하게 들어온다.

## worked example: "커스텀 도메인 연결" 상담

고객: "우리 도메인 `brand.com`을 이 서비스에 연결해 주세요."

단계:
1. **도메인 확보**: `brand.com`을 등록사(가비아·Cloudflare 등)에서 사거나 이미 소유.
2. **DNS 설정**: 도메인의 DNS 레코드가 우리 서버를 가리키게 — Vercel/AWS가 "이 IP/CNAME을 등록하세요" 안내. 등록사에서 세팅.
3. **SSL 적용**: Vercel/AWS는 도메인 연결 시 자동으로 인증서 발급·HTTPS 활성화. 직접 EC2면 Let's Encrypt 자동 발급 세팅.
4. **전파 대기**: DNS 변경이 전 세계에 퍼지는 데 수 분~최대 48시간(TTL).
5. **확인**: `https://brand.com`으로 들어가 자물쇠 뜨는지.

"도메인 연결"이 도메인 구매 → DNS 세팅 → SSL 자동적용 → 전파의 흐름이다. PaaS(Vercel)는 2~3을 자동화해 몇 분 만에 끝내고, 직접 EC2는 DNS+SSL을 손수 해야 한다.

## 실 사례(익명화) — 커스텀 도메인 연결의 실제 흐름

> 실제 프로젝트 패턴을 익명화해 온다.

한 서비스에 **커스텀 도메인**을 연결할 때의 흐름은 정해져 있었다: 도메인 확보 → **DNS 세팅**(도메인이 서버를 가리키게) → **SSL 인증서 자동 발급**(HTTPS 활성화) → 전파 대기(수 분~48시간) → `https://`로 자물쇠 뜨는지 확인. 직접 서버(EC2)를 쓸 땐 **인증서 자동갱신**까지 세팅했다 — 만료되면 브라우저가 "위험" 경고로 접속을 막기 때문.

교훈: "도메인 연결해 주세요"는 한 일이 아니라 — **DNS 세팅 + SSL(자동) + 전파 + (직접 서버면) 자동갱신**의 흐름이다. PaaS(Vercel)는 대부분 자동이지만, 직접 서버에선 인증서 만료 관리까지 감당해야 한다. 상담에서 "HTTPS 켜져 있나?"를 기본 질문으로 달아라 — 안 켜져 있으면 이탈 + 보안 위험이다.

## 흔한 실패 모드와 처방

- **HTTPS를 안 켠다.** 브라우저 경고 → 이탈 + 보안 위험. 처방: 배포 시 무조건 HTTPS(Vercel 자동 또는 Let's Encrypt).
- **인증서 만료를 방치한다.** 만료되면 브라우저가 "위험" 경고로 접속 차단. 처방: 자동 갱신 세팅(Let's Encrypt 자동화, 클라우드 관리형).
- **DNS를 잘못 가리킨다.** 도메인이 엉뚱한 곳으로 연결돼 서비스 안 됨. 처방: DNS 레코드 변경 후 전파·검증까지 확인.
- **www/비www 둘 다 안 잡는다.** 한쪽으로만 들어오거나 경고. 처방: www ↔ root 리다이렉트 설정.

## 상담에 바로 쓰는 한 줄

"도메인 연결해 주세요"를 받으면, "DNS 세팅 + SSL(HTTPS) 자동 적용 + 전파 대기" 세 단계로 답하라. 그리고 "직접 서버면 인증서 자동갱신까지 챙긴다"를 덧붙여라.

## 개발자가 이 단어 말할 때

- **DNS / 레코드(A, CNAME)** — 이름→IP 전화번호부 / 매핑 항목 종류.
- **도메인 / 등록사(registrar)** — 인터넷 이름 / 파는 곳.
- **SSL / TLS / 인증서** — 연결 암호화 기술 / 증명서.
- **HTTPS / 자물쇠** — 암호화된 연결 / 브라우저 표시.
- **Let's Encrypt** — 무료 자동 인증서 발급 서비스.
- **Route 53 / Cloudflare** — DNS 호스팅 서비스.

## ✍️ 산출물 과제

본인 서비스의 도메인(상상이어도 됨)을 정하고, 그것을 서비스에 연결하는 단계를 (1) 도메인 확보 (2) DNS 세팅 (3) SSL/HTTPS (4) 전파·검증 순으로 한 줄씩 적어라. "직접 서버(EC2)인 경우, 자동갱신은 어떻게 챙길지"도 한 줄로 적어라.

## 한 걸음 더

한 가지 실수: 인증서는 "발급"으로 끝이 아니라 "자동 갱신"까지 세팅해야 한다. 만료 1일 전에 갱신이 안 돼 있으면 사용자가 "이 사이트 위험" 경고를 보고 이탈한다. Vercel/AWS 관리형은 알아서 하지만, 직접 서버에선 Let's Encrypt 자동갱신(cron)이 필수다.

> 더 보기: AWS Route 53 개발자 가이드 · https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/welcome.html
