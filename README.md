# ProjectHub 🐉
IT 교육생을 위한 지능형 취업 매칭 플랫폼

## 📌 프로젝트 개요
**ProjectHub**는 IT학원에 다니는 교육생들의 성공적인 취업을 돕기 위해 개발된 플랫폼입니다. 
교육생의 포트폴리오를 자동으로 생성하고, 취업 시장 데이터를 분석하여 개인에게 최적화된 기업을 추천합니다.

## 🎯 주요 기능

### 1️⃣ 자동 포트폴리오 생성
- GitHub 링크와 기존 교육내용을 기반으로 포트폴리오 자동 생성
- 웹 페이지 및 PDF 형식으로 제공
- 전문적인 이력서 및 포트폴리오 작성 시간 단축

### 2️⃣ 기업 정보 수집 및 벡터 데이터베이싱
- 웹 크롤링을 통한 기업 공고 및 정보 수집
- Vector 데이터베이스에 저장하여 의미론적 검색 가능
- 실시간 취업 시장 데이터 업데이트

### 3️⃣ 지능형 기업 매칭 및 추천
- 교육생의 역량과 기업의 요구사항 분석
- AI 기반 적합도 판단으로 취업률 향상
- 개인화된 기업 추천 제공

## 🛠️ 기술 스택

### Frontend
- **Framework**: React.js
- **Language**: TypeScript
- **Node.js**: v24.11.1

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.14.2

### Infrastructure
- **Containerization**: Docker
- **Supported Architectures**: AMD64, ARM64

## 📦 프로젝트 구조
```
team-dragon/
├── frontend/           # React.js 프론트엔드
├── backend/            # FastAPI 백엔드
├── docker-compose.yml  # Docker 서비스 구성
└── README.md          # 프로젝트 문서
```

## 🚀 시작하기

### 요구사항
- Node.js 24.11.1 이상
- Python 3.14.2 이상
- Docker & Docker Compose (Docker 실행 시)

### 1️⃣ 로컬 개발 환경 실행

#### Backend (FastAPI) 실행
```bash
# Backend 디렉토리로 이동
cd backend

# 가상 환경 활성화 (Windows)
.\.venv\Scripts\Activate.ps1

# 의존성 설치 (최초 1회)
pip install -r requirements.txt

# 서버 실행
python main.py
```
✅ **Backend**: http://localhost:8000

#### Frontend (React/Vite) 실행
```bash
# Frontend 디렉토리로 이동 (새 터미널)
cd frontend

# 의존성 설치 (최초 1회)
pnpm install

# 개발 서버 실행
pnpm dev
```
✅ **Frontend**: http://localhost:5173  
✅ **API 연결**: `/api/...` 요청은 기본적으로 Vite proxy를 통해 `http://localhost:8000`으로 전달

### 2️⃣ Docker Compose 실행

#### Backend + DB 실행
```bash
# 프로젝트 루트 디렉토리에서
docker-compose up -d dragon-db dragon-be
```

#### 서비스 확인
```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

✅ **Backend**: http://localhost:8000  
✅ **DB**: http://localhost:5432  
✅ **Frontend**: 로컬 Vite dev server (`pnpm dev`) 사용

### 🔧 환경 설정

#### 로컬 개발
- Backend: 루트 `.env` 파일에서 `API_HOST=http://localhost:8000`
- Frontend: `frontend/.env` 파일에서 아래 값을 선택적으로 설정
  - `VITE_API_BASE_URL=` → 비워두면 상대 경로 `/api/...` 사용
  - `VITE_API_PROXY_TARGET=http://localhost:8000` → Vite dev proxy 대상

#### Docker 환경
- `dragon-be`, `dragon-db`만 Docker Compose로 실행
- 프론트엔드는 로컬 Vite dev server에서 `/api` 프록시를 통해 백엔드와 통신

### 📊 헬스 체크
```bash
# Backend 헬스 체크
curl http://localhost:8000/healthcheck

# 응답 예시
{
  "message": "Service is healthy",
  "status": "ok"
}
```

## 📝 라이선스
[LICENSE](LICENSE) 참고

---

**ProjectHub** - 교육생의 꿈을 현실로 만드는 취업 매칭 플랫폼