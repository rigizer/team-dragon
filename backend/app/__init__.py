"""
Team Dragon Backend Application
"""
from fastapi import FastAPI
from app.config import config
from app.api.routes import get_health_router


class DragonApp:
    """Team Dragon FastAPI 애플리케이션"""
    
    def __init__(self):
        self.app = FastAPI(
            title=config.APP_NAME,
            version=config.APP_VERSION,
            debug=config.DEBUG
        )
        self._setup_routes()
    
    def _setup_routes(self):
        """라우트 설정"""
        # 헬스 체크 라우터 등록
        health_router = get_health_router()
        self.app.include_router(health_router)
    
    def get_app(self) -> FastAPI:
        """FastAPI 앱 인스턴스 반환"""
        return self.app


def create_app() -> FastAPI:
    """애플리케이션 팩토리"""
    dragon_app = DragonApp()
    return dragon_app.get_app()
