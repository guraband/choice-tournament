# Choice Tournament Tech Spec (MVP)

## 1) 기술 스택
- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS (선택)
- **State**: React state + localStorage 영속화
- **Routing**: SPA 단일 경로 또는 react-router-dom(선택)
- **Deploy**: GitHub Actions + GitHub Pages

> 서버 없이 동작하는 정적 웹앱을 기준으로 설계합니다.

## 2) 화면 스펙

### A. Home
- 앱 제목/설명
- `새 토너먼트 만들기` 버튼
- 최근 기록(localStorage) 표시
- 진행 중 데이터가 있으면 `이어하기` 노출

### B. Create
- 입력: `topic`(필수), `items` 16개(필수, 1줄 1후보)
- 검증:
  - 공백/빈 줄 제거
  - 16개 미만/초과 시 에러
  - 중복 후보는 경고(또는 suffix로 유니크 처리)
- 옵션:
  - 셔플(기본 ON)
  - 시드 고정(기본 ON 권장)
- `시작하기` 버튼은 검증 통과 시 활성화

### C. Match
- 헤더: 주제, 라운드(16강/8강/4강/결승), 진행률
- 후보 카드 2개 표시
- 조작:
  - 카드 클릭/탭으로 승자 선택
  - 단축키: `1`/`2`, `←`/`→`
  - 되돌리기: 버튼 또는 `Backspace`
- 라운드 종료 시 승자 목록으로 다음 라운드 자동 생성

### D. Bracket
- 라운드별 매치/승자 시각화
- 미결정 매치는 placeholder 표시
- MVP에서는 개별 매치 재선택 기능 제외 가능(Undo로 대체)

### E. Result
- Champion 강조
- Runner-up, Semifinalists 표시
- 액션:
  - 공유 링크 복사
  - 셔플해서 다시
  - 같은 시드로 다시
  - 후보 수정

## 3) 도메인 로직

### 3.1 토너먼트 규칙
- 후보 수는 항상 16
- 라운드 구성: 16강(8매치) → 8강(4매치) → 4강(2매치) → 결승(1매치)
- 결승 승자가 Champion

### 3.2 매치 생성
- 초기 후보를 `seed` 기반으로 셔플(재현 가능)
- 페어링: `(0,1)`, `(2,3)`, ... `(14,15)`
- 다음 라운드는 직전 라운드 승자 배열을 동일 규칙으로 페어링

### 3.3 Undo
- 선택 기록을 stack으로 관리
- Undo 시 마지막 선택 제거
- 해당 선택 이후 파생된 라운드 상태를 무효화
- 자연스럽게 이전 매치로 복귀

## 4) 데이터 모델

### 4.1 권장 타입
```ts
type Item = {
  id: string;
  name: string;
};

type Match = {
  id: string;
  round: 16 | 8 | 4 | 2;
  leftItemId: string;
  rightItemId: string;
  winnerItemId?: string;
  decidedAt?: number;
};

type Tournament = {
  id: string;
  topic: string;
  seed: number;
  createdAt: number;
  updatedAt: number;
  items: Item[]; // length 16
  rounds: Record<"r16" | "r8" | "r4" | "r2", Match[]>;
  cursor: {
    round: 16 | 8 | 4 | 2;
    matchIndex: number;
  };
  history: Array<{
    round: 16 | 8 | 4 | 2;
    matchId: string;
    winnerItemId: string;
  }>;
};
```

### 4.2 localStorage
- `choice-tournament:current`: 진행 중 토너먼트 1개
- `choice-tournament:history`: 최근 결과(최대 20개)
- 저장 시점:
  - 생성 직후
  - 매 선택 확정 시
  - Undo 시

## 5) 공유 링크 스펙
- 목적: 서버 없이 URL만으로 설정 재현
- 방식:
  - payload(JSON): `topic`, `items[16]`, `seed`
  - 인코딩: `JSON.stringify -> lz-string 압축 -> base64url`
- 진입 UX:
  - 바로 시작 상태 진입 또는
  - Create 화면에 미리 채워진 상태로 진입
- MVP 범위: **진행 상태 공유 제외**, **설정 공유만 지원**

## 6) 디렉토리 구조 (예시)
```text
choice-tournament/
  src/
    app/
    routes/
    components/
      ItemCard.tsx
      ProgressBar.tsx
    domain/
      tournament.ts
    types.ts
    storage/
      localStorage.ts
    share/
      encode.ts
      decode.ts
    pages/
      Home.tsx
      Create.tsx
      Match.tsx
      Bracket.tsx
      Result.tsx
    main.tsx
  public/
    index.html
  vite.config.ts
```

## 7) GitHub Pages 배포 스펙

### 7.1 저장소 설정
1. GitHub Settings → Pages
2. Build and deployment: `GitHub Actions`
3. 기본 브랜치: `main`

### 7.2 Vite base 설정
GitHub Pages 경로를 위해 `vite.config.ts`에 아래처럼 `base` 설정:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/choice-tournament/",
});
```

### 7.3 Workflow 파일
- 경로: `.github/workflows/deploy-pages.yml`
- 트리거: `main` push, 수동 실행(workflow_dispatch)
- 작업:
  - Node 20 세팅
  - `npm ci`
  - `npm run build`
  - `dist` 업로드
  - Pages 배포

```yml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 7.4 package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```
