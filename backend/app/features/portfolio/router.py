from fastapi import APIRouter

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

@router.get("")
async def get_portfolios():
    return {"message": "portfolio list"}
