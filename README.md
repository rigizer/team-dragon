# Dragon Manager 🐉
IT 교육생을 위한 지능형 취업 매칭 플랫폼

## 📌 프로젝트 개요
**Dragon Manager**는 IT학원에 다니는 교육생들의 성공적인 취업을 돕기 위해 개발된 플랫폼입니다. 
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
- Docker & Docker Compose

### 설치 및 실행
```bash
# 저장소 클론
git clone <repository-url>
cd team-dragon

# Docker Compose로 전체 애플리케이션 실행
docker-compose up -d
```

## 📝 라이선스
[LICENSE](LICENSE) 참고

---

**Dragon Manager** - 교육생의 꿈을 현실로 만드는 취업 매칭 플랫폼