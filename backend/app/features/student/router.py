from fastapi import APIRouter

router = APIRouter(prefix="/student", tags=["student"])

@router.get("")
async def get_students():
    return {"message": "student profile"}
