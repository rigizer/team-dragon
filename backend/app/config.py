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


config = Config()
