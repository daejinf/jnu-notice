# 전남대학교 공지 통합 알림

전남대학교 본부 공지, 단과대 공지, 학과 공지, 기관/사업단 공지를 한곳에서 모아보는 Next.js 기반 서비스입니다.

현재는 다음 기능이 포함되어 있습니다.

- 학교 본부 / 단과대 / 학과 / 기관 공지 통합 조회
- 기관/사업단/취업포털/성장마루 공지 수집
- 읽음 / 북마크 표시
- 상태 배지 표시 (`D-DAY`, `D-3`, `마감`)
- Google 로그인 후에만 공지 로딩
- 로그인한 구글 계정별 설정 / 읽음 / 북마크 분리 저장

---

## 실행 방법

```powershell
cd C:\codex_coding\전대알림
npm install
npm run dev
```

개발 서버:

- `http://localhost:3000`

---

## Google 로그인 적용 방법

이 프로젝트는 `Auth.js (next-auth v5 beta)` 기반으로 Google 로그인을 사용합니다.
로그인하지 않으면 첫 화면에서 공지 목록을 불러오지 않고, 로그인 랜딩 화면만 보입니다.
로그인 후에만 홈 / 설정 / 공지 API가 열립니다.

### 1. Google Cloud Console 설정

Google Cloud Console에서 OAuth 클라이언트를 만들어야 합니다.

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. `API 및 서비스` -> `사용자 인증 정보`
4. `사용자 인증 정보 만들기` -> `OAuth 클라이언트 ID`
5. 애플리케이션 유형: `웹 애플리케이션`
6. 승인된 리디렉션 URI에 아래 주소 추가

```text
http://localhost:3000/api/auth/callback/google
https://jnunotice.xyz/api/auth/callback/google
https://www.jnunotice.xyz/api/auth/callback/google
```

발급 후 아래 두 값을 받게 됩니다.

- Client ID
- Client Secret

### 2. 로컬 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 넣습니다.

```env
AUTH_SECRET=아주긴랜덤문자열
AUTH_GOOGLE_ID=구글클라이언트ID
AUTH_GOOGLE_SECRET=구글클라이언트SECRET
DISCORD_WEBHOOK_URL=
```

`AUTH_SECRET`는 충분히 긴 랜덤 문자열이면 됩니다.

예시:

```text
AUTH_SECRET=2f9f7c8d0f6a4f0d9b67d6e8b2c1a9f4d9d1f6f2c4a7b8e1d2f3a4b5c6d7e8f9
```

### 3. Vercel 환경변수 설정

Vercel 배포를 사용할 경우 아래 환경변수도 프로젝트에 추가해야 합니다.

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

경로:

- `Vercel -> Project -> Settings -> Environment Variables`

추가 후에는 `Redeploy` 한 번 해주는 것이 안전합니다.

---

## 로그인 이후 동작 방식

로그인이 완료되면 다음 페이지가 정상 동작합니다.

- `/`
- `/settings`
- `/api/notices`

로그인하지 않은 상태에서는:

- 홈: 로그인 랜딩 화면 표시
- 설정: 로그인 랜딩 화면 표시
- 공지 API: `401` 반환

즉, 처음 방문했을 때 모든 공지를 미리 긁어오지 않아서 초기 로딩 부담을 줄입니다.

---

## 계정별 설정 저장 방식

이 프로젝트는 로그인한 구글 계정의 이메일을 기준으로 localStorage 키를 분리합니다.

따라서 같은 브라우저에서도:

- `a@gmail.com` 로그인 시 A 설정
- `b@gmail.com` 로그인 시 B 설정

이렇게 서로 다른 설정이 저장됩니다.

계정별로 분리되는 항목:

- 학교 본부 선택
- 단과대 선택
- 학과 선택
- 기관/사업단 선택
- 읽음 상태
- 북마크 상태

주의:

- 이 방식은 **브라우저 로컬 저장**입니다.
- 같은 계정이라도 다른 PC / 다른 브라우저에서는 자동 동기화되지 않습니다.
- 기기 간 동기화까지 하려면 DB 저장 방식으로 확장해야 합니다.

---

## 주요 명령어

```powershell
npm run dev
npm run build
npm run check:notices
npm run collect:departments
npm run discover:department-notices
npm run generate:department-configs
```

### 부서 seed 수집

```powershell
npm run collect:departments
```

### 학과 공지 URL 후보 탐색

```powershell
npm run discover:department-notices
```

결과 파일:

- `data/departments.notice-candidates.json`

### departments.ts 반영 코드 생성

```powershell
npm run generate:department-configs
```

결과 파일:

- `data/departments.generated.ts.txt`

---

## 배포

이 프로젝트는 Vercel 배포를 기준으로 사용 중입니다.

기본 흐름:

1. GitHub에 push
2. Vercel에서 프로젝트 import
3. 도메인 연결
4. Vercel 환경변수 설정
5. Google OAuth Redirect URI 등록

도메인 연결 예시:

- `jnunotice.xyz`
- `www.jnunotice.xyz`

---

## 참고

환경변수 예시 파일:

- [.env.local.example](./.env.local.example)