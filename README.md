# 전남대학교 공지 통합 웹서비스 MVP

전남대학교 대표 공지, 단과대 공지, 학과 공지를 한곳에 모아보고, 사용자가 원하는 출처만 직접 골라서 확인할 수 있도록 만든 웹서비스입니다.

---

## 1. 현재 구현된 기능

- 학교 본부 공지 선택
- 단과대 공지 선택
- 학과 공지 선택
- 학교 본부/단과대/학과 공지를 하나의 목록으로 통합
- 제목 클릭 시 원문 페이지 이동
- 출처별 최대 5페이지 수집
- 새 공지 비교 구조
- 디스코드 알림 준비
- GitHub Actions 자동 실행 준비
- 학과 목록 seed 자동 수집 스크립트
- 학과 공지 URL 후보 자동 탐색 스크립트
- `departments.ts` 반영용 코드 생성 스크립트

---

## 2. 자동 확장 흐름

이제 학과 확장은 아래 흐름으로 갈 수 있습니다.

1. `collect:departments`
   - 단과대 학과 목록 페이지에서 `college / department / siteUrl` 수집
2. `discover:department-notices`
   - 각 학과 사이트에서 `noticeUrl` 후보와 `parserType` 추정
3. `generate:department-configs`
   - 후보 결과를 `createDepartmentConfig(...)` 코드 줄로 생성
4. 생성 결과를 보고 `departments.ts`에 반영

즉, 전부 손으로 다시 쓰지 않아도 되는 구조입니다.

---

## 3. 자주 쓰는 명령어

```powershell
npm run dev
npm run check:notices
npm run collect:departments
npm run discover:department-notices
npm run generate:department-configs
```

### 3-1. 학과 seed 수집

```powershell
npm run collect:departments
```

### 3-2. 공지 URL 후보 찾기

```powershell
npm run discover:department-notices
```

결과 파일:

- `data/departments.notice-candidates.json`

### 3-3. departments.ts 반영용 코드 생성

```powershell
npm run generate:department-configs
```

결과 파일:

- `data/departments.generated.ts.txt`

이 파일에는 아래 같은 줄들이 생성됩니다.

```ts
createDepartmentConfig(
  "공과대학-건축학부",
  "공과대학",
  "건축학부",
  "https://archi.jnu.ac.kr",
  "https://archi.jnu.ac.kr/archi/8023/subview.do?...",
  "subview-bbs",
),
```

---

## 4. 빠른 시작 요약

```powershell
cd C:\codex_coding\전대알림
npm install
npm run dev
npm run collect:departments
npm run discover:department-notices
npm run generate:department-configs
```
