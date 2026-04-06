# Node.js 공식 이미지 기반 (Node 24.11.1)
FROM node:24.11.1-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package.json package-lock.json* ./

# 의존성 설치
RUN npm ci --only=production && npm install -D @vitejs/plugin-react typescript vite

# 소스 코드 복사
COPY . .

# 환경 변수 설정 (docker-compose.yml에서 전달됨)
ENV VITE_API_URL=http://dragon-be:8000

# 포트 노출
EXPOSE 3000

# 개발 서버 실행
CMD ["npm", "run", "dev"]
