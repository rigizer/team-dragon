# 취업 포트폴리오 관리 프론트엔드

강사와 학생이 함께 사용하는 취업 포트폴리오 관리용 프론트엔드 프로토타입입니다.  
현재는 `Vite + React + React Router` 기반의 단일 페이지 앱으로 구성되어 있으며, 교사/학생 플로우를 화면 중심으로 빠르게 검증할 수 있게 되어 있습니다.

패키지 관리는 `pnpm` 기준으로 진행합니다.

이 프로젝트의 핵심 흐름은 다음 두 가지입니다.

- 강사: 트랙 생성, 강의자료 업로드, AI 기반 평가지표 생성, 학생 포트폴리오 검토
- 학생: 트랙 확인, 발표자료 업로드, AI 역량 후보 선택, 기여도 입력, 승인 상태 확인

## 현재 구현된 화면

### 메인

- `/`
  - 강사 모드 / 학생 모드 진입 화면

### 강사 플로우

- `/teacher/tracks`
  - 트랙 목록 조회
  - 학생 수, 검토 대기 건수 확인
- `/teacher/track/create`
  - 트랙명/설명 입력
  - 강의자료 PDF 업로드
  - AI가 평가지표를 생성하는 흐름 시뮬레이션
- `/teacher/track/:trackId`
  - 트랙 상세 화면
  - 학생 추가/삭제
  - 평가 요소 추가/삭제
  - 학생별 점수 입력
  - 포트폴리오 검토 화면으로 이동
- `/teacher/track/:trackId/review`
  - 학생 제출 포트폴리오 승인/반려

### 학생 플로우

- `/student/tracks`
  - 수강 중인 트랙 목록 조회
  - 제출 필요 / 승인 대기 / 승인 완료 상태 확인
- `/student/track/:trackId/upload`
  - 발표자료 PDF 업로드
- `/student/track/:trackId/competency`
  - AI가 추출한 역량 후보 확인
  - 수행한 역량 선택
- `/student/track/:trackId/contribution`
  - 선택한 역량별 기여도 1~5점 입력
- `/student/track/:trackId/status`
  - 강사 승인 대기 상태 확인
- `/student/track/:trackId/download`
  - 승인 완료 후 인증서 다운로드 흐름 확인

### 호환성용 구형 화면

기존 프로토타입 흐름도 일부 남아 있습니다.

- `/teacher/upload`
- `/teacher/criteria`
- `/student/login`
- `/student/upload`
- `/student/contribution`
- `/student/result`

## 현재 상태 요약

- 대부분의 데이터는 컴포넌트 내부 목업 데이터로 동작합니다.
- 파일 업로드는 브라우저 단에서만 처리되며 실제 서버 전송은 연결되어 있지 않습니다.
- "AI 분석", "평가지표 생성", "인증서 다운로드"는 현재 목업/시뮬레이션 흐름입니다.
- 토스트 메시지와 라우팅을 통해 전체 사용자 흐름을 데모할 수 있는 상태입니다.

## 기술 스택

- React 18
- TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Radix UI 기반 공통 UI 컴포넌트
- Sonner
- Lucide React

## 디렉터리 구조

```text
src/
  app/
    components/
      ui/          # 공통 UI 컴포넌트
    pages/
      teacher/     # 강사 화면
      student/     # 학생 화면
    routes.ts      # 라우트 정의
    App.tsx
  styles/          # 전역 스타일
  main.tsx
```

## 실행 방법

```bash
pnpm install
cp .env.example .env
pnpm dev
```

기본 개발 서버 주소:

```text
http://localhost:5173
```

프로덕션 빌드:

```bash
pnpm build
```

로컬 Playwright 검증:

```bash
pnpm exec playwright install chromium
pnpm verify:precommit
```

E2E만 빠르게 실행하려면:

```bash
pnpm test:e2e
```

## 환경 변수

- `VITE_API_BASE_URL`
  - 예시: `http://localhost:3001`
  - `/api` 접두사는 프론트에서 붙이므로 환경 변수에는 포함하지 않습니다.
  - 비워두면 상대 경로 `/api/...`를 사용합니다.
- `VITE_API_PROXY_TARGET`
  - 개발 서버에서 `/api/...` 요청을 프록시할 대상입니다.
  - 기본값은 `http://localhost:8000`입니다.

## 로컬 E2E 테스트

- Playwright 테스트는 로컬에서만 돌리는 사전 검증용입니다.
- `tests/e2e/teacher-track-create.spec.ts`는 강사 트랙 생성 화면에서 PDF 업로드와 multipart 요청 구조를 목 응답으로 검증합니다.
- 실제 백엔드 없이도 커밋 전에 빠르게 화면 흐름을 확인할 수 있습니다.

## 참고 사항

- 이 프로젝트는 `pnpm` 워크스페이스(`pnpm-workspace.yaml`) 기준으로 관리합니다.
- 현재 `package.json` 기준으로 제공되는 스크립트는 `dev`, `build` 두 가지입니다.
- 테스트, 린트, 백엔드 API 연동 설정은 아직 포함되어 있지 않습니다.
- `index.html` 타이틀 등 일부 초기 템플릿 흔적은 남아 있을 수 있지만, 실제 앱 내용은 취업 포트폴리오 관리 흐름에 맞춰 구성되어 있습니다.
  Run `npm run dev` to start the development server.

  ## Local Mock Login (Optional)

  Local mock files are intentionally git-ignored.
  This means `mock:login` and `ddev` do not affect normal development commands,
  but they can fail at runtime if local-only files are missing.

  - Normal app run: `pnpm dev` (no mock required)
  - Mock server only: `pnpm mock:login`
  - Mock + app together: `pnpm ddev`
  - Show behavior note: `pnpm ddev:info`

  Required local-only files for mock flow:

  - `.local/mock-login-server.mjs`
  - `vite.config.local.ts`
  
