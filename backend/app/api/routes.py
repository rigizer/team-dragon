"""
API 라우터 - 헬스 체크 및 기본 엔드포인트
"""
from fastapi import APIRouter
from app.models import HealthResponse


class HealthCheckRouter:
    """헬스 체크 라우터 클래스"""
    
    def __init__(self):
        self.router = APIRouter(tags=["health"])
        self._register_routes()
    
    def _register_routes(self):
        """라우트 등록"""
        @self.router.get("/")
        async def root():
            """루트 경로 - Hello, World! JSON 반환"""
            response = HealthResponse(
                message="Hello, World!",
                status="ok"
            )
            return response.to_dict()
        
        @self.router.get("/health")
        async def health_check():
            """헬스 체크 엔드포인트"""
            response = HealthResponse(
                message="Service is healthy",
                status="ok"
            )
            return response.to_dict()


def get_health_router() -> APIRouter:
    """헬스 체크 라우터 반환"""
    return HealthCheckRouter().router
