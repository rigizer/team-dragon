from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse
from app.db.database import SessionLocal
from app.db.models import EmploymentPack, StudentProject
from app.features.portfolio.schemas import (
    EmploymentPackResponse,
    PortfolioApproveResponse,
    PortfolioReviewResponse,
)


BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ALLOWED_STORAGE_DIRS = (BASE_DIR / "uploads", BASE_DIR / "seed")


def _normalize_file_path(file_url: str | None) -> Path | None:
    if not file_url:
        return None

    normalized = file_url.strip().lstrip("/")
    if not normalized:
        return None

    candidate = Path(normalized)
    if not candidate.is_absolute():
        candidate = BASE_DIR / candidate

    try:
        resolved = candidate.resolve()
    except OSError:
        return None

    if not any(
        resolved.is_relative_to(storage_dir.resolve())
        for storage_dir in ALLOWED_STORAGE_DIRS
    ):
        return None

    return resolved


def _build_employment_pack_download_url(project_id: int) -> str:
    return f"/api/projects/{project_id}/employment-pack/download"


class PortfolioService:
    """포트폴리오 관련 비즈니스 로직 및 DB 세션 관리"""

    @staticmethod
    def _ensure_project_access(project: StudentProject, student_id: int | None) -> None:
        if student_id is not None and project.student_id != student_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: you do not own this project",
            )

    @staticmethod
    def review_portfolio(
        project_id: int, student_id: int | None = None
    ) -> PortfolioReviewResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            PortfolioService._ensure_project_access(project, student_id)

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
        project_id: int, is_approved: bool, student_id: int | None = None
    ) -> PortfolioApproveResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            PortfolioService._ensure_project_access(project, student_id)

            if not project.project_pdf_url or not project.project_pdf_url.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Project has no uploaded PDF. Cannot approve.",
                )

            if project.employment_pack is None:
                project.employment_pack = EmploymentPack(
                    portfolio_file_url=project.project_pdf_url,
                    status="provisional",
                )

            new_status = "certified" if is_approved else None
            project.employment_pack.status = new_status
            db.commit()

            return PortfolioApproveResponse(status=new_status)

    @staticmethod
    def download_employment_pack(
        project_id: int, student_id: int | None = None
    ) -> EmploymentPackResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            PortfolioService._ensure_project_access(project, student_id)

            pack = project.employment_pack
            if pack is None:
                return EmploymentPackResponse(file_url=None, status=None)

            if pack.status == "certified" and pack.portfolio_file_url:
                file_path = _normalize_file_path(pack.portfolio_file_url)
                if file_path is not None:
                    return EmploymentPackResponse(
                        file_url=_build_employment_pack_download_url(project_id),
                        status="certified",
                    )

            return EmploymentPackResponse(file_url=None, status=pack.status)

    @staticmethod
    def download_employment_pack_file(
        project_id: int, student_id: int | None = None
    ) -> FileResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            PortfolioService._ensure_project_access(project, student_id)

            if (
                project.employment_pack is None
                or not project.employment_pack.portfolio_file_url
            ):
                raise HTTPException(
                    status_code=404,
                    detail="Employment pack file URL is missing",
                )

            if project.employment_pack.status != "certified":
                raise HTTPException(
                    status_code=403, detail="Employment pack is not approved yet"
                )

            file_path = _normalize_file_path(project.employment_pack.portfolio_file_url)
            if file_path is None:
                raise HTTPException(
                    status_code=404,
                    detail="Employment pack file not found",
                )

            return FileResponse(
                path=file_path,
                media_type="application/pdf",
                filename=file_path.name,
            )
