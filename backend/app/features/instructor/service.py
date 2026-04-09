from app.db.database import SessionLocal

class InstructorService:
    """강사 관련 비즈니스 로직 및 DB 세션 관리"""
    
    @staticmethod
    def get_students():
        with SessionLocal() as db:
            return {"message": "instructor students list from service"}

    @staticmethod
    def get_tracks():
        with SessionLocal() as db:
            return {"message": "track list from service"}

    @staticmethod
    def create_track():
        with SessionLocal() as db:
            return {"message": "track created from service"}

    @staticmethod
    def get_track_portfolios(track_id: int):
        with SessionLocal() as db:
            return {"message": f"portfolios for track {track_id} from service"}

    @staticmethod
    def get_criteria_candidates(track_id: int):
        with SessionLocal() as db:
            return {"message": "criteria candidates from service"}

    @staticmethod
    def approve_criteria(track_id: int):
        with SessionLocal() as db:
            return {"message": "criteria approved from service"}

    @staticmethod
    def evaluate_projects(track_id: int):
        with SessionLocal() as db:
            return {"message": "evaluations recorded from service"}
