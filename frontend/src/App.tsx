import React from 'react'
import './App.css'

function App() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  return (
    <div className="container">
      <header className="header">
        <h1>🐉 Team Dragon</h1>
        <p className="subtitle">교육생을 위한 지능형 취업 매칭 플랫폼</p>
      </header>

      <main className="main">
        <section className="welcome">
          <h2>환영합니다!</h2>
          <p>Team Dragon은 IT 학원의 교육생들을 위한 취업 지원 플랫폼입니다.</p>
        </section>

        <section className="features">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>자동 포트폴리오 생성</h3>
              <p>GitHub 링크와 교육 이력을 바탕으로 전문적인 포트폴리오 자동 생성</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>기업 정보 수집</h3>
              <p>실시간 채용공고와 기업 정보를 벡터 데이터베이스에 저장</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>지능형 매칭</h3>
              <p>AI 기반 알고리즘으로 당신에게 최적의 기업 추천</p>
            </div>
          </div>
        </section>

        <section className="api-status">
          <h3>서비스 상태</h3>
          <p>API 주소: <code>{apiUrl}</code></p>
          <p className="status-text">✅ 프론트엔드가 정상적으로 로드되었습니다.</p>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Team Dragon. 교육생의 꿈을 현실로 만드는 플랫폼</p>
      </footer>
    </div>
  )
}

export default App
