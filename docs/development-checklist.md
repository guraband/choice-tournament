# Choice Tournament 개발 체크리스트

문서(`docs/prd.md`, `docs/tech-spec.md`)를 기준으로 MVP 구현 순서를 정리했습니다.

## 단계별 계획

- [x] **1단계. 프로젝트 부트스트랩**
  - React 18 + TypeScript + Vite 기반 프로젝트 구조 생성
  - 기본 페이지(Home/Create/Match/Bracket/Result) 라우팅 뼈대 구성
  - 공통 타입(`Tournament`, `Match`, `Item`) 정의
- [x] **2단계. Create 화면 + 입력 검증**
  - 주제/후보 16개·32개 입력 폼 구현
  - 공백/빈 줄/개수(16 또는 32) 검증 및 시작 버튼 활성화 조건 구현
  - 라운드 옵션(16강/32강), 시드/셔플 옵션 UI 제공
  - 후보별 로컬 이미지 첨부(256x256 리사이즈 + base64 저장) 처리 구현
- [ ] **3단계. 토너먼트 도메인 로직 구현**
  - 시드 기반 셔플 및 초기 대진 생성
  - 라운드 진행(32→16→8→4→2 또는 16→8→4→2)과 승자 계산
  - Undo stack 기반 되돌리기 구현
- [ ] **4단계. 진행 화면 및 결과 화면 구현**
  - Match 화면 카드 선택 UX + 키보드 단축키
  - Bracket 화면(라운드별 상태 표시)
  - Result 화면(우승/준우승/4강 + 다시하기 액션)
- [ ] **5단계. 저장/복원 및 공유 링크 구현**
  - localStorage 저장/복구(current/history + 이미지 base64)
  - 공유 링크 인코딩/디코딩(topic/items/seed)
- [ ] **6단계. 배포 및 품질 마무리**
  - GitHub Pages용 `vite.config.ts` base 설정
  - GitHub Actions 배포 워크플로우 추가
  - 빌드/린트/핵심 시나리오 점검

## 현재 진행

- 이번 작업에서는 **2단계(Create 화면 + 입력 검증)**를 구현합니다.
