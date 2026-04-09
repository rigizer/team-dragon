from fastapi import APIRouter
from app.features.portfolio.service import PortfolioService

router = APIRouter(prefix="/api", tags=["portfolio"])

@router.get("/projects/{project_id}/review")
async def review_portfolio(project_id: int):
    return PortfolioService.review_portfolio(project_id)

@router.post("/projects/{project_id}/approve")
async def approve_portfolio(project_id: int):
    return PortfolioService.approve_portfolio(project_id)

@router.get("/projects/{project_id}/employment-pack")
async def download_employment_pack(project_id: int):
    return PortfolioService.download_employment_pack(project_id)
