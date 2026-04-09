from app.db.database import SessionLocal
from app.db.models import User
from app.features.auth.schemas import LoginRequest, LoginResponse

class AuthService:
    """인증 관련 비즈니스 로직 및 DB 세션 관리"""
    
    @staticmethod
    def login(request: LoginRequest) -> LoginResponse:
        # 서비스 내부에서 DB 세션 생성 및 관리
        with SessionLocal() as db:
            user = db.query(User).filter(User.login_id == request.login_id).first()
            
            if not user:
                return LoginResponse(
                    isSuccess=False,
                    user_id=None,
                    name=None,
                    role=None
                )
            
            return LoginResponse(
                isSuccess=True,
                user_id=user.login_id,
                name=user.name,
                role=user.role
            )
