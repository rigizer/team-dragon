from fastapi import APIRouter

router = APIRouter(prefix="/instructor", tags=["instructor"])

@router.get("")
async def get_instructors():
    return {"message": "instructor profile"}
