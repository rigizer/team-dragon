import os
import shutil
import uuid
from fastapi import UploadFile
from app.db.database import SessionLocal
from app.db.models import User, InstructorStudentRelation, CourseTrack, CourseMaterial
from app.features.instructor.schemas import (
    StudentListResponse, StudentItem,
    TrackListResponse, TrackItem,
    TrackCreateResponse
)

UPLOAD_DIR = "uploads"

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
    def create_track(
        instructor_login_id: str,
        name: str,
        domain_type: str,
        material_file: UploadFile,
        rubric_file: UploadFile
    ) -> TrackCreateResponse:
        with SessionLocal() as db:
            # 1. 강사 조회
            instructor = db.query(User).filter(User.login_id == instructor_login_id, User.role == "INSTRUCTOR").first()
            if not instructor:
                # 강사가 없는 경우 처리 (명세서에 구체적인 에러 처리는 없지만 간단히 0으로 반환하거나 예외 발생 가능)
                # 여기서는 명세서의 오류 응답 형식을 따르기 위해 가짜 데이터 반환 혹은 예외
                raise Exception("Instructor not found")

            # 2. 트랙 생성
            new_track = CourseTrack(
                instructor_id=instructor.id,
                name=name,
                domain_type=domain_type
            )
            db.add(new_track)
            db.commit()
            db.refresh(new_track)

            # 3. 파일 저장 설정
            track_upload_dir = os.path.join(UPLOAD_DIR, str(new_track.id))
            os.makedirs(track_upload_dir, exist_ok=True)

            # 4. 파일 저장 및 DB 등록 (강의자료)
            material_ext = os.path.splitext(material_file.filename)[1]
            material_filename = f"{uuid.uuid4()}{material_ext}"
            material_path = os.path.join(track_upload_dir, material_filename)
            
            with open(material_path, "wb") as buffer:
                shutil.copyfileobj(material_file.file, buffer)
            
            db.add(CourseMaterial(
                track_id=new_track.id,
                material_type="강의자료",
                file_url=material_path,
                status="uploaded"
            ))

            # 5. 파일 저장 및 DB 등록 (루브릭)
            rubric_ext = os.path.splitext(rubric_file.filename)[1]
            rubric_filename = f"{uuid.uuid4()}{rubric_ext}"
            rubric_path = os.path.join(track_upload_dir, rubric_filename)
            
            with open(rubric_path, "wb") as buffer:
                shutil.copyfileobj(rubric_file.file, buffer)
            
            db.add(CourseMaterial(
                track_id=new_track.id,
                material_type="루브릭",
                file_url=rubric_path,
                status="uploaded"
            ))

            db.commit()

            return TrackCreateResponse(track_id=new_track.id, status="extracted")

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
