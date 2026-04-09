from fastapi import APIRouter

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
async def login():
    return {"message": "login success"}
