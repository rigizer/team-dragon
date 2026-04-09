from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db

router = APIRouter(prefix="/healthcheck", tags=["health"])

@router.get("")
async def health_check(db: Session = Depends(get_db)):
    try:
        # DB 연결 확인
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status
    }
