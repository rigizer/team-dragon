from app.db.database import SessionLocal
from app.db.models import StudentProject, EmploymentPack
from app.features.portfolio.schemas import PortfolioReviewResponse, ApprovePortfolioResponse, DownloadEmploymentPackResponse
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
    def approve_portfolio(project_id: int, is_approved: bool) -> ApprovePortfolioResponse:
        """
        강사가 포트폴리오를 승인 또는 거절합니다.
        
        Args:
            project_id: 학생 프로젝트 ID
            is_approved: 승인 여부 (True: 승인, False: 거절)
            
        Returns:
            ApprovePortfolioResponse: 상태 (certified 또는 None)
            
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
            
            # EmploymentPack 조회
            employment_pack = db.query(EmploymentPack).filter(
                EmploymentPack.student_project_id == project_id
            ).first()
            
            if not employment_pack:
                raise HTTPException(
                    status_code=404,
                    detail=f"프로젝트 {project_id}에 대한 포트폴리오를 찾을 수 없습니다."
                )
            
            # 승인 여부에 따라 status 업데이트
            if is_approved:
                employment_pack.status = "certified"
            else:
                employment_pack.status = None
            
            db.commit()
            
            return ApprovePortfolioResponse(status=employment_pack.status)

    @staticmethod
    def download_employment_pack(project_id: int) -> DownloadEmploymentPackResponse:
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
        with SessionLocal() as db:
            # EmploymentPack 조회
            employment_pack = db.query(EmploymentPack).filter(
                EmploymentPack.student_project_id == project_id
            ).first()
            
            # 포트폴리오가 없으면 None 반환
            if not employment_pack:
                return DownloadEmploymentPackResponse(file_url=None)
            
            # 강사가 승인한 경우 (status = "certified")
            if employment_pack.status == "certified":
                return DownloadEmploymentPackResponse(
                    file_url=employment_pack.portfolio_file_url
                )
            
            # 승인되지 않은 경우 "denied" 반환
            return DownloadEmploymentPackResponse(file_url="denied")

    @staticmethod
    def get_portfolios_by_track(track_id: int):
        """
        트랙에 등록된 학생들의 포트폴리오를 조회합니다.

        Args:
            track_id: 트랙 ID

        Returns:
            List[PortfolioResponse]: 학생 ID, 이름, 포트폴리오 URL 목록
        """
        with SessionLocal() as db:
            student_projects = db.query(StudentProject).join(EmploymentPack).filter(
                StudentProject.track_id == track_id
            ).all()

            portfolios = []
            for project in student_projects:
                portfolio_url = None
                if project.employment_pack and project.employment_pack.status == "certified":
                    portfolio_url = project.employment_pack.portfolio_file_url

                portfolios.append({
                    "student_id": project.student_id,
                    "student_name": project.student.name,
                    "portfolio_url": portfolio_url
                })

            return portfolios
