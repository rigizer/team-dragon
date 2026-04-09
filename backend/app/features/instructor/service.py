from app.db.database import SessionLocal
from app.db.models import User, InstructorStudentRelation, CourseTrack
from app.features.instructor.schemas import (
    StudentListResponse, StudentItem,
    TrackListResponse, TrackItem
)

class InstructorService:
    """강사 관련 비즈니스 로직 및 DB 세션 관리"""
    
    @staticmethod
    def get_students(instructor_login_id: str) -> StudentListResponse:
        with SessionLocal() as db:
            # 1. 강사 조회 (login_id 기준)
            instructor = db.query(User).filter(User.login_id == instructor_login_id, User.role == "INSTRUCTOR").first()
            if not instructor:
                return StudentListResponse(students=[StudentItem(student_name=None, student_id=None) for _ in range(3)])
            
            # 2. 강사와 연결된 학생 정보 조회
            results = (
                db.query(User.name, User.login_id)
                .join(InstructorStudentRelation, User.id == InstructorStudentRelation.student_id)
                .filter(InstructorStudentRelation.instructor_id == instructor.id)
                .all()
            )
            
            if not results:
                return StudentListResponse(students=[StudentItem(student_name=None, student_id=None) for _ in range(3)])
            
            # 3. 데이터 가공 (이름, 아이디 분리)
            student_list = [
                StudentItem(student_name=name, student_id=login_id)
                for name, login_id in results
            ]
            
            return StudentListResponse(students=student_list)

    @staticmethod
    def get_tracks(instructor_login_id: str) -> TrackListResponse:
        with SessionLocal() as db:
            # 1. 강사 조회
            instructor = db.query(User).filter(User.login_id == instructor_login_id, User.role == "INSTRUCTOR").first()
            if not instructor:
                return TrackListResponse(tracks=[TrackItem(track_name=None, track_id=None) for _ in range(2)])
            
            # 2. 해당 강사의 트랙 조회
            tracks = db.query(CourseTrack).filter(CourseTrack.instructor_id == instructor.id).all()
            
            if not tracks:
                return TrackListResponse(tracks=[TrackItem(track_name=None, track_id=None) for _ in range(2)])
            
            # 3. 데이터 가공
            track_list = [
                TrackItem(track_name=track.name, track_id=track.id)
                for track in tracks
            ]
            
            return TrackListResponse(tracks=track_list)

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
