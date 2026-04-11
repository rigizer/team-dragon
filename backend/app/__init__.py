"""
Team Dragon Backend Application
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.status import HTTP_413_REQUEST_ENTITY_TOO_LARGE
from app.config import config
from app.features.health.router import router as health_router
from app.features.instructor.router import router as instructor_router
from app.features.student.router import router as student_router
from app.features.portfolio.router import router as portfolio_router
from app.features.auth.router import router as auth_router


class DragonApp:
    """Team Dragon FastAPI 애플리케이션"""
    
    def __init__(self):
        self.app = FastAPI(
            title=config.APP_NAME,
            version=config.APP_VERSION,
            debug=config.DEBUG
        )
        self._setup_middlewares()
        self._setup_routes()

    def _setup_middlewares(self):
        """미들웨어 설정"""
        
        # CORS 미들웨어 설정
        cors_origins = ["*"] if config.CORS_ALLOW_ALL else config.CORS_ORIGINS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # 업로드 용량 제한 미들웨어 (100MB)
        @self.app.middleware("http")
        async def limit_upload_size(request: Request, call_next):
            if request.method == "POST":
                content_length = request.headers.get("Content-Length")
                if content_length:
                    if int(content_length) > 100 * 1024 * 1024:  # 100MB
                        return Response(
                            content="File too large (Max 100MB)",
                            status_code=HTTP_413_REQUEST_ENTITY_TOO_LARGE
                        )
            return await call_next(request)
    
    def _setup_routes(self):
        """라우트 설정"""
        # 기능별 라우터 등록
        self.app.include_router(health_router)
        self.app.include_router(instructor_router)
        self.app.include_router(student_router)
        self.app.include_router(portfolio_router)
        self.app.include_router(auth_router)
    
    def get_app(self) -> FastAPI:
        """FastAPI 앱 인스턴스 반환"""
        return self.app


def create_app() -> FastAPI:
    """애플리케이션 팩토리"""
    dragon_app = DragonApp()
    return dragon_app.get_app()
