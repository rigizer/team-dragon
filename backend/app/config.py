"""
설정 관리
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """애플리케이션 설정"""
    
    DEBUG = os.getenv("DEBUG", "True") == "True"
    APP_NAME = "Team Dragon Backend"
    APP_VERSION = "1.0.0"
    API_PREFIX = "/api"
    API_HOST = os.getenv("API_HOST", "http://localhost:8000")
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    
    # CORS 설정
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    if CORS_ORIGINS == ["*"]:
        # 개발 환경: 모든 origin 허용
        CORS_ALLOW_ALL = True
    else:
        # 프로덕션 환경: 특정 origins만 허용
        CORS_ALLOW_ALL = False
        CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS]


config = Config()
