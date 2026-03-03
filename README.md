# choice-tournament

결정이 어려운 순간을 빠르게 해결하는 **16강 토너먼트 선택 웹앱**입니다.

사용자가 주제와 후보 16개를 입력하면, 라운드별(16강 → 8강 → 4강 → 결승) 선택을 통해 최종 우승 1개를 도출합니다.

## 문서
- 제품 요구사항: [`docs/prd.md`](docs/prd.md)
- 기술 스펙: [`docs/tech-spec.md`](docs/tech-spec.md)

## MVP 핵심 기능
- 주제 + 후보 16개 입력
- 시드 기반 셔플 및 재현 가능한 대진 생성
- 카드 선택으로 라운드 진행
- Undo(되돌리기)
- localStorage 기반 이어하기
- 공유 링크(설정 공유)

## 배포
- `main` 브랜치에 머지되면 GitHub Actions를 통해 GitHub Pages에 자동 배포하는 것을 목표로 합니다.
- Pages 경로를 위해 Vite `base` 설정이 필요합니다.

## 로컬 개발 (예정 스택 기준)
```bash
npm install
npm run dev
```

## 라이선스
프로젝트 정책에 따라 추후 정의합니다.
