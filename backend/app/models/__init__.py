"""
응답 모델 정의
"""
from typing import Any, Dict


class HealthResponse:
    """헬스 체크 응답 모델"""
    
    def __init__(self, message: str, status: str):
        self.message = message
        self.status = status
    
    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "message": self.message,
            "status": self.status
        }
