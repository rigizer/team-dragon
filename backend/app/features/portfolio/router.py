from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.features.portfolio.schemas import PortfolioReviewResponse, ApprovePortfolioRequest, ApprovePortfolioResponse, DownloadEmploymentPackResponse, PortfolioResponse
from app.features.portfolio.service import PortfolioService
from typing import List

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

@router.post("/projects/{project_id}/approve", response_model=ApprovePortfolioResponse)
async def approve_portfolio(project_id: int, request: ApprovePortfolioRequest) -> ApprovePortfolioResponse:
    """
    강사가 포트폴리오를 승인 또는 거절합니다.
    
    Args:
        project_id: 학생 프로젝트 ID
        request: ApprovePortfolioRequest - is_approved 포함
        
    Returns:
        ApprovePortfolioResponse: 상태 (certified 또는 None)
    """
    return PortfolioService.approve_portfolio(project_id, request.is_approved)

@router.get("/projects/{project_id}/employment-pack", response_model=DownloadEmploymentPackResponse)
async def download_employment_pack(project_id: int) -> DownloadEmploymentPackResponse:
    """
    학생이 시스템이 제작한 포트폴리오를 다운로드합니다.
    강사의 승인이 필요합니다.
    
    Args:
        project_id: 학생 프로젝트 ID
        
    Returns:
        DownloadEmploymentPackResponse:
            - 승인됨: file_url (포트폴리오 URL)
            - 미승인: file_url = "denied"
            - 없음: file_url = None
    """
    return PortfolioService.download_employment_pack(project_id)

@router.get("/tracks/{track_id}/portfolio", response_model=List[PortfolioResponse])
async def get_portfolios_by_track(track_id: int):
    """
    트랙에 등록된 학생들의 포트폴리오를 조회합니다.

    Args:
        track_id: 트랙 ID

    Returns:
        List[PortfolioResponse]: 학생 ID, 이름, 포트폴리오 URL 목록
    """
    return PortfolioService.get_portfolios_by_track(track_id)
