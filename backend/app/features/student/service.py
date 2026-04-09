from app.db.database import SessionLocal

class StudentService:
    """학생 관련 비즈니스 로직 및 DB 세션 관리"""
    
    @staticmethod
    def get_student_tracks(student_id: int):
        with SessionLocal() as db:
            return {"message": f"tracks for student {student_id} from service"}

    @staticmethod
    def upload_project():
        with SessionLocal() as db:
            return {"message": "project uploaded from service"}

    @staticmethod
    def get_contribution_candidates(project_id: int):
        with SessionLocal() as db:
            return {"message": f"contribution candidates for project {project_id} from service"}

    @staticmethod
    def update_contributions(project_id: int):
        with SessionLocal() as db:
            return {"message": f"contributions for project {project_id} updated from service"}
