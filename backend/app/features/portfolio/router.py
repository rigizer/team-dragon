from fastapi import APIRouter, Query
from app.features.portfolio.service import PortfolioService
from app.features.portfolio.schemas import (
    EmploymentPackResponse,
    PortfolioApproveRequest,
    PortfolioApproveResponse,
    PortfolioReviewResponse,
)

router = APIRouter(prefix="/api", tags=["portfolio"])


@router.get("/projects/{project_id}/review", response_model=PortfolioReviewResponse)
async def review_portfolio(
    project_id: int, student_id: int | None = Query(default=None)
):
    return PortfolioService.review_portfolio(project_id, student_id)


@router.post("/projects/{project_id}/approve", response_model=PortfolioApproveResponse)
async def approve_portfolio(
    project_id: int,
    body: PortfolioApproveRequest,
    student_id: int | None = Query(default=None),
):
    return PortfolioService.approve_portfolio(project_id, body.is_approved, student_id)


@router.get(
    "/projects/{project_id}/employment-pack", response_model=EmploymentPackResponse
)
async def download_employment_pack(
    project_id: int, student_id: int | None = Query(default=None)
):
    return PortfolioService.download_employment_pack(project_id, student_id)


@router.get("/projects/{project_id}/employment-pack/download")
def download_employment_pack_file(
    project_id: int, student_id: int | None = Query(default=None)
):
    return PortfolioService.download_employment_pack_file(project_id, student_id)
