from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import config

# PostgreSQL 연결 URL
SQLALCHEMY_DATABASE_URL = config.DATABASE_URL

# 엔진 생성
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

# 세션 생성기
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스 생성 (새로운 스타일)
class Base(DeclarativeBase):
    pass

# DB 세션 의존성 주입을 위한 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
