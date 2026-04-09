from app.db.database import SessionLocal

class PortfolioService:
    """포트폴리오 관련 비즈니스 로직 및 DB 세션 관리"""
    
    @staticmethod
    def review_portfolio(project_id: int):
        with SessionLocal() as db:
            return {"message": f"portfolio review for project {project_id} from service"}

    @staticmethod
    def approve_portfolio(project_id: int):
        with SessionLocal() as db:
            return {"message": f"portfolio approved for project {project_id} from service"}

    @staticmethod
    def download_employment_pack(project_id: int):
        with SessionLocal() as db:
            return {"message": f"employment pack for project {project_id} from service"}
