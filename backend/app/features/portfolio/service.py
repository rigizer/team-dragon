from app.db.database import SessionLocal
from app.db.models import StudentProject, EmploymentPack
from app.features.portfolio.schemas import PortfolioReviewResponse
from fastapi import HTTPException

class PortfolioService:
    """포트폴리오 관련 비즈니스 로직 및 DB 세션 관리"""
    
    @staticmethod
    def review_portfolio(project_id: int) -> PortfolioReviewResponse:
        """
        강사가 시스템이 제작한 포트폴리오를 확인합니다.
        
        Args:
            project_id: 학생 프로젝트 ID
            
        Returns:
            PortfolioReviewResponse: 포트폴리오 URL
            
        Raises:
            HTTPException: 프로젝트나 포트폴리오를 찾을 수 없는 경우
        """
        with SessionLocal() as db:
            # StudentProject 조회
            student_project = db.query(StudentProject).filter(
                StudentProject.id == project_id
            ).first()
            
            if not student_project:
                raise HTTPException(
                    status_code=404,
                    detail=f"프로젝트 {project_id}를 찾을 수 없습니다."
                )
            
            # EmploymentPack 조회 - portfolio_file_url 가져오기
            employment_pack = db.query(EmploymentPack).filter(
                EmploymentPack.student_project_id == project_id
            ).first()
            
            if not employment_pack or not employment_pack.portfolio_file_url:
                raise HTTPException(
                    status_code=404,
                    detail=f"프로젝트 {project_id}에 대한 포트폴리오를 찾을 수 없습니다."
                )
            
            return PortfolioReviewResponse(
                portfolio_url=employment_pack.portfolio_file_url
            )

    @staticmethod
    def approve_portfolio(project_id: int):
        with SessionLocal() as db:
            return {"message": f"portfolio approved for project {project_id} from service"}

    @staticmethod
    def download_employment_pack(project_id: int):
        with SessionLocal() as db:
            return {"message": f"employment pack for project {project_id} from service"}
