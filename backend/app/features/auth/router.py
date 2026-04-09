from fastapi import APIRouter
from app.features.auth.schemas import LoginRequest, LoginResponse
from app.features.auth.service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    사용자 로그인 API
    
    - 라우터는 요청을 서비스로 전달하고 결과를 응답하는 역할만 수행합니다.
    - 데이터베이스 세션 처리는 서비스 내부에서 수행됩니다.
    """
    return AuthService.login(request)
