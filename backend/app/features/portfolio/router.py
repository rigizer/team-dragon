from fastapi import APIRouter
from app.features.portfolio.service import PortfolioService
from app.features.portfolio.schemas import PortfolioReviewResponse

router = APIRouter(prefix="/api", tags=["portfolio"])

@router.get("/projects/{project_id}/review", response_model=PortfolioReviewResponse)
async def review_portfolio(project_id: int) -> PortfolioReviewResponse:
    """
    강사가 시스템이 제작한 포트폴리오를 확인합니다.
    
    Args:
        project_id: 학생 프로젝트 ID
        
    Returns:
        PortfolioReviewResponse: 포트폴리오 URL
    """
    return PortfolioService.review_portfolio(project_id)

@router.post("/projects/{project_id}/approve")
async def approve_portfolio(project_id: int):
    return PortfolioService.approve_portfolio(project_id)

@router.get("/projects/{project_id}/employment-pack")
async def download_employment_pack(project_id: int):
    return PortfolioService.download_employment_pack(project_id)
