import json
import os
import shutil
import uuid
import base64
import requests
import fitz  # PyMuPDF
from PyPDF2 import PdfReader
from openai import OpenAI
from fastapi import UploadFile
from app.db.database import SessionLocal
from app.db.models import User, InstructorStudentRelation, CourseTrack, CourseMaterial, EvaluationCriterion
from app.features.instructor.schemas import (
    StudentListResponse, StudentItem,
    TrackListResponse, TrackItem,
    TrackCreateResponse, CandidateListResponse, CandidateItem,
    ApproveCriteriaRequest, ApproveCriteriaResponse
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
    def get_criteria_candidates(track_id: int) -> CandidateListResponse:
        with SessionLocal() as db:
            # 1. 트랙 및 자료 정보 조회
            track = db.query(CourseTrack).filter(CourseTrack.id == track_id).first()
            if not track:
                raise Exception("Track not found")

            # 이미 지표가 생성되어 있는지 확인 (기획에 따라 갱신할지 결정 가능)
            existing_criteria = db.query(EvaluationCriterion).filter(EvaluationCriterion.track_id == track_id).all()
            if existing_criteria:
                return CandidateListResponse(candidates=[
                    CandidateItem(
                        title=c.title,
                        description=c.description,
                        priority=c.priority,
                        source_refs=c.source_refs,
                        flags=c.flags
                    ) for c in existing_criteria
                ])

            materials = db.query(CourseMaterial).filter(CourseMaterial.track_id == track_id).all()
            
            lecture_text = ""
            rubric_text = ""
            
            for m in materials:
                text = ""
                # 1.5 텍스트 추출/재사용 로직 (status 활용)
                if m.status == "extracted":
                    # 일반 추출물 또는 OCR 결과물 중 있는 것을 사용
                    text = m.extracted_text if m.extracted_text else m.ocr_text
                else:
                    # 새로 추출 시도 (status == "uploaded" 또는 "failed"인 경우 다시 시도)
                    try:
                        raw_text = InstructorService._extract_text_from_pdf(m.file_url)
                        
                        # 임계치(200자) 미만인 경우 OCR 수행
                        if len(raw_text.strip()) < 200:
                            text = InstructorService._perform_ocr(m.file_url)
                            if text:
                                m.ocr_text = text
                                m.status = "extracted"
                            else:
                                m.status = "failed"
                        else:
                            text = raw_text
                            m.extracted_text = text
                            m.status = "extracted"
                    except Exception:
                        m.status = "failed"
                    
                    db.add(m)
                    db.commit()

                if m.material_type == "강의자료":
                    lecture_text += text
                else:
                    rubric_text += text

            # 2. 프롬프트 준비 및 데이터 주입
            prompt_template = InstructorService._load_prompt("criteria_generation.md")
            prompt = prompt_template.replace("{{course_name}}", track.domain_type or "N/A")
            prompt = prompt.replace("{{track_name}}", track.name)
            prompt = prompt.replace("{{lecture_text}}", lecture_text[:4000]) # 토큰 제한 고려
            prompt = prompt.replace("{{rubric_text}}", rubric_text[:2000])

            # 3. GPT 호출
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that outputs JSON format data for educational evaluation criteria."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )

            raw_result = json.loads(response.choices[0].message.content)
            candidates_data = raw_result.get("candidates", [])

            # 4. DB 저장 및 반환
            results = []
            for item in candidates_data:
                criterion = EvaluationCriterion(
                    track_id=track_id,
                    title=item.get("title"),
                    description=item.get("description"),
                    priority=item.get("priority"),
                    source_refs=item.get("source_refs"),
                    flags=item.get("flags"),
                    status="draft"
                )
                db.add(criterion)
                results.append(CandidateItem(
                    title=criterion.title,
                    description=criterion.description,
                    priority=criterion.priority,
                    source_refs=criterion.source_refs,
                    flags=criterion.flags
                ))
            
            db.commit()
            return CandidateListResponse(candidates=results)

    @staticmethod
    def _perform_ocr(file_path: str) -> str:
        """Google Vision API를 사용하여 PDF에서 텍스트를 추출 (이미지 기반)"""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return ""

        url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
        combined_text = ""

        try:
            doc = fitz.open(file_path)
            # 페이지만큼 반복 (너무 많으면 처음 몇 페이지만 수행하도록 제한 가능)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                img_bytes = pix.tobytes("png")
                
                # Base64 인코딩
                content = base64.b64encode(img_bytes).decode("utf-8")
                
                # 요청 본문 구성
                request_body = {
                    "requests": [
                        {
                            "image": {"content": content},
                            "features": [{"type": "TEXT_DETECTION"}]
                        }
                    ]
                }
                
                response = requests.post(url, json=request_body)
                if response.status_code == 200:
                    res_data = response.json()
                    annotations = res_data["responses"][0].get("fullTextAnnotation", {})
                    combined_text += annotations.get("text", "") + "\n"
            
            doc.close()
            return combined_text
        except Exception as e:
            print(f"[OCR Error] {e}")
            return ""

    @staticmethod
    def _extract_text_from_pdf(file_path: str) -> str:
        if not os.path.exists(file_path):
            return ""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        except Exception:
            return ""

    @staticmethod
    def _load_prompt(filename: str) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        # app/core/prompts/{filename}
        prompt_path = os.path.join(base_dir, "core", "prompts", filename)
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def approve_criteria(track_id: int, data: ApproveCriteriaRequest) -> ApproveCriteriaResponse:
        with SessionLocal() as db:
            # 1. 기존 평가지표 삭제
            db.query(EvaluationCriterion).filter(EvaluationCriterion.track_id == track_id).delete()
            
            # 2. 새로운 평가지표 등록
            for item in data.criterias:
                if item.title:  # title이 있는 경우만 저장
                    new_criterion = EvaluationCriterion(
                        track_id=track_id,
                        title=item.title,
                        description=item.description,
                        priority=item.priority,
                        source_refs=item.source_refs,
                        flags=item.flags,
                        status="approved" # 확정 상태로 저장
                    )
                    db.add(new_criterion)
            
            db.commit()
            return ApproveCriteriaResponse(status="approved")

    @staticmethod
    def evaluate_projects(track_id: int):
        with SessionLocal() as db:
            return {"message": "evaluations recorded from service"}
