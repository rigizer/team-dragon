from fastapi import HTTPException
from app.db.database import SessionLocal
from app.db.models import StudentProject
from app.features.portfolio.schemas import (
    EmploymentPackResponse,
    PortfolioApproveResponse,
    PortfolioReviewResponse,
)


class PortfolioService:
    """포트폴리오 관련 비즈니스 로직 및 DB 세션 관리"""

    @staticmethod
    def review_portfolio(project_id: int) -> PortfolioReviewResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            portfolio_url: str | None = None
            if project.employment_pack and project.employment_pack.portfolio_file_url:
                portfolio_url = project.employment_pack.portfolio_file_url
            elif project.project_pdf_url:
                portfolio_url = project.project_pdf_url

            if portfolio_url is None:
                raise HTTPException(
                    status_code=404,
                    detail="No portfolio URL available for this project",
                )

            return PortfolioReviewResponse(portfolio_url=portfolio_url)

    @staticmethod
    def approve_portfolio(
        project_id: int, is_approved: bool
    ) -> PortfolioApproveResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            if project.employment_pack is None:
                raise HTTPException(
                    status_code=404,
                    detail="Employment pack not found for this project",
                )

            new_status = "approved" if is_approved else "denied"
            project.employment_pack.status = new_status
            db.commit()

            return PortfolioApproveResponse(status=new_status)

    @staticmethod
    def download_employment_pack(project_id: int) -> EmploymentPackResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            pack = project.employment_pack
            if pack is None:
                return EmploymentPackResponse(file_url=None, status=None)

            file_url: str | None = pack.portfolio_file_url or pack.md_file_url or None
            return EmploymentPackResponse(file_url=file_url, status=pack.status)
