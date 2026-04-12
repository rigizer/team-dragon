import json
import os
import shutil
import uuid
import base64
from collections import defaultdict
import requests
import openai
import fitz  # PyMuPDF
from PyPDF2 import PdfReader
from openai import OpenAI
from fastapi import HTTPException, UploadFile
from app.db.database import SessionLocal
from app.db.models import (
    User,
    InstructorStudentRelation,
    CourseTrack,
    CourseMaterial,
    EvaluationCriterion,
    InstructorEvaluation,
    StudentProject,
)
from app.features.instructor.schemas import (
    StudentListResponse,
    StudentItem,
    TrackListResponse,
    TrackItem,
    TrackCreateResponse,
    CandidateListResponse,
    CandidateItem,
    ApproveCriteriaRequest,
    ApproveCriteriaResponse,
    ApprovedCriterionItem,
    SaveScoresRequest,
    ScoreSaveResponse,
    CriterionDetailItem,
    TrackDetailItem,
    StudentDetailItem,
    ScoreDetailItem,
    EvaluationMatrixResponse,
)

UPLOAD_DIR = "uploads"


class InstructorService:
    """강사 관련 비즈니스 로직 및 DB 세션 관리"""

    @staticmethod
    def get_students(instructor_login_id: str) -> StudentListResponse:
        with SessionLocal() as db:
            # 1. 강사 조회 (login_id 기준)
            instructor = (
                db.query(User)
                .filter(User.login_id == instructor_login_id, User.role == "INSTRUCTOR")
                .first()
            )
            if not instructor:
                return StudentListResponse(
                    students=[
                        StudentItem(student_name=None, student_id=None)
                        for _ in range(3)
                    ]
                )

            # 2. 강사와 연결된 학생 정보 조회
            results = (
                db.query(User.name, User.login_id)
                .join(
                    InstructorStudentRelation,
                    User.id == InstructorStudentRelation.student_id,
                )
                .filter(InstructorStudentRelation.instructor_id == instructor.id)
                .all()
            )

            if not results:
                return StudentListResponse(
                    students=[
                        StudentItem(student_name=None, student_id=None)
                        for _ in range(3)
                    ]
                )

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
            instructor = (
                db.query(User)
                .filter(User.login_id == instructor_login_id, User.role == "INSTRUCTOR")
                .first()
            )
            if not instructor:
                return TrackListResponse(
                    tracks=[TrackItem(track_name=None, track_id=None) for _ in range(2)]
                )

            # 2. 해당 강사의 트랙 조회
            tracks = (
                db.query(CourseTrack)
                .filter(CourseTrack.instructor_id == instructor.id)
                .all()
            )

            if not tracks:
                return TrackListResponse(
                    tracks=[TrackItem(track_name=None, track_id=None) for _ in range(2)]
                )

            # 3. 데이터 가공
            track_list = [
                TrackItem(track_name=track.name, track_id=track.id) for track in tracks
            ]

            return TrackListResponse(tracks=track_list)

    @staticmethod
    def create_track(
        instructor_login_id: str,
        name: str,
        domain_type: str,
        material_file: UploadFile,
        rubric_file: UploadFile,
    ) -> TrackCreateResponse:
        with SessionLocal() as db:
            # 1. 강사 조회
            instructor = (
                db.query(User)
                .filter(User.login_id == instructor_login_id, User.role == "INSTRUCTOR")
                .first()
            )
            if not instructor:
                # 강사가 없는 경우 처리 (명세서에 구체적인 에러 처리는 없지만 간단히 0으로 반환하거나 예외 발생 가능)
                # 여기서는 명세서의 오류 응답 형식을 따르기 위해 가짜 데이터 반환 혹은 예외
                raise Exception("Instructor not found")

            # 2. 트랙 생성
            new_track = CourseTrack(
                instructor_id=instructor.id, name=name, domain_type=domain_type
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

            db.add(
                CourseMaterial(
                    track_id=new_track.id,
                    material_type="강의자료",
                    file_url=material_path,
                    status="uploaded",
                )
            )

            # 5. 파일 저장 및 DB 등록 (루브릭)
            rubric_ext = os.path.splitext(rubric_file.filename)[1]
            rubric_filename = f"{uuid.uuid4()}{rubric_ext}"
            rubric_path = os.path.join(track_upload_dir, rubric_filename)

            with open(rubric_path, "wb") as buffer:
                shutil.copyfileobj(rubric_file.file, buffer)

            db.add(
                CourseMaterial(
                    track_id=new_track.id,
                    material_type="루브릭",
                    file_url=rubric_path,
                    status="uploaded",
                )
            )

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
                raise HTTPException(
                    status_code=404, detail="요청한 트랙을 찾을 수 없습니다."
                )

            # 이미 지표가 생성되어 있는지 확인 (기획에 따라 갱신할지 결정 가능)
            existing_criteria = (
                db.query(EvaluationCriterion)
                .filter(EvaluationCriterion.track_id == track_id)
                .all()
            )
            if existing_criteria:
                return CandidateListResponse(
                    candidates=[
                        CandidateItem(
                            title=c.title,
                            description=c.description,
                            priority=c.priority,
                            source_refs=c.source_refs,
                            flags=c.flags,
                        )
                        for c in existing_criteria
                    ]
                )

            materials = (
                db.query(CourseMaterial)
                .filter(CourseMaterial.track_id == track_id)
                .all()
            )

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

            if not lecture_text and not rubric_text:
                raise HTTPException(
                    status_code=422,
                    detail="트랙의 강의자료/루브릭에서 추출 가능한 텍스트가 없습니다.",
                )

            # 2. 프롬프트 준비 및 데이터 주입
            prompt_template = InstructorService._load_prompt("criteria_generation.md")
            prompt = prompt_template.replace(
                "{{course_name}}", track.domain_type or "N/A"
            )
            prompt = prompt.replace("{{track_name}}", track.name)
            prompt = prompt.replace(
                "{{lecture_text}}", lecture_text[:4000]
            )  # 토큰 제한 고려
            prompt = prompt.replace("{{rubric_text}}", rubric_text[:2000])

            # 3. GPT 호출
            api_key = InstructorService._load_openai_api_key()
            client = OpenAI(api_key=api_key)

            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful assistant that outputs JSON format data for educational evaluation criteria.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                )
            except Exception as exc:
                raise InstructorService._to_openai_http_exception(exc)

            raw_content = (
                response.choices[0].message.content if response.choices else None
            )
            if not isinstance(raw_content, str) or not raw_content.strip():
                raise HTTPException(
                    status_code=502,
                    detail="평가지표 생성 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.",
                )

            try:
                raw_result = json.loads(raw_content)
            except json.JSONDecodeError as exc:
                raise HTTPException(
                    status_code=502,
                    detail="평가지표 생성 응답을 해석할 수 없습니다. 잠시 후 다시 시도해 주세요.",
                ) from exc

            if not isinstance(raw_result, dict):
                raise HTTPException(
                    status_code=502,
                    detail="평가지표 생성 응답 형식이 올바르지 않습니다.",
                )

            candidates_data = raw_result.get("candidates", [])
            if not isinstance(candidates_data, list):
                raise HTTPException(
                    status_code=502,
                    detail="평가지표 생성 응답 형식이 올바르지 않습니다.",
                )

            # 4. DB 저장 및 반환
            results = []
            for item in candidates_data:
                if not isinstance(item, dict):
                    raise HTTPException(
                        status_code=502,
                        detail="평가지표 생성 응답 형식이 올바르지 않습니다.",
                    )

                criterion = EvaluationCriterion(
                    track_id=track_id,
                    title=item.get("title"),
                    description=item.get("description"),
                    priority=item.get("priority"),
                    source_refs=item.get("source_refs"),
                    flags=item.get("flags"),
                    status="draft",
                )
                db.add(criterion)
                results.append(
                    CandidateItem(
                        title=criterion.title,
                        description=criterion.description,
                        priority=criterion.priority,
                        source_refs=criterion.source_refs,
                        flags=criterion.flags,
                    )
                )

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
                            "features": [{"type": "TEXT_DETECTION"}],
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
    def _load_openai_api_key() -> str:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if (
            not api_key
            or api_key == "YOUR_API_KEY"
            or api_key.upper() == "YOUR_API_KEY"
        ):
            raise HTTPException(
                status_code=500,
                detail="OpenAI API 키가 설정되지 않았습니다. BACKEND 환경변수를 확인해 주세요.",
            )
        return api_key

    @staticmethod
    def _to_openai_http_exception(exc: Exception) -> HTTPException:
        exc_name = type(exc).__name__.lower()
        error_name = type(exc).__name__

        def _is_openai_error(error_class_name: str) -> bool:
            error_class = getattr(openai, error_class_name, None)
            return bool(error_class) and isinstance(exc, error_class)

        if _is_openai_error("AuthenticationError"):
            return HTTPException(
                status_code=502,
                detail="OpenAI 인증에 실패했습니다. API 키를 확인해 주세요.",
            )

        if _is_openai_error("RateLimitError"):
            return HTTPException(
                status_code=502,
                detail="OpenAI 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
            )

        if _is_openai_error("APIConnectionError"):
            return HTTPException(
                status_code=502,
                detail="OpenAI 연결에 실패했습니다. 네트워크 상태를 확인해 주세요.",
            )

        if _is_openai_error("APIStatusError"):
            return HTTPException(
                status_code=502,
                detail=f"OpenAI 서비스 오류가 발생했습니다. ({exc_name})",
            )

        if "authentication" in error_name.lower():
            return HTTPException(
                status_code=502,
                detail="OpenAI 인증에 실패했습니다. API 키를 확인해 주세요.",
            )

        return HTTPException(
            status_code=502, detail=f"평가지표 생성에 실패했습니다. ({error_name})"
        )

    @staticmethod
    def _load_prompt(filename: str) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        # app/core/prompts/{filename}
        prompt_path = os.path.join(base_dir, "core", "prompts", filename)
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=500, detail="평가지표 생성 템플릿 파일을 찾지 못했습니다."
            ) from exc

    @staticmethod
    def approve_criteria(
        track_id: int, request: ApproveCriteriaRequest
    ) -> ApproveCriteriaResponse:
        with SessionLocal() as db:
            track = db.query(CourseTrack).filter(CourseTrack.id == track_id).first()
            if not track:
                raise HTTPException(
                    status_code=404,
                    detail="요청한 트랙을 찾을 수 없습니다.",
                )

            criterion_ids = request.criterion_ids or []
            query = db.query(EvaluationCriterion).filter(
                EvaluationCriterion.track_id == track_id,
                EvaluationCriterion.status != "approved",
            )

            if criterion_ids:
                query = query.filter(EvaluationCriterion.id.in_(criterion_ids))

            targets = query.all()

            for criterion in targets:
                criterion.status = "approved"

            if targets:
                db.commit()

            approved_items = [
                ApprovedCriterionItem(
                    id=criterion.id,
                    title=criterion.title,
                    status=criterion.status,
                )
                for criterion in targets
            ]

            return ApproveCriteriaResponse(
                approved_count=len(targets),
                criteria=approved_items,
            )

    @staticmethod
    def evaluate_projects(
        track_id: int,
        request: SaveScoresRequest,
    ) -> ScoreSaveResponse:
        with SessionLocal() as db:
            track = db.query(CourseTrack).filter(CourseTrack.id == track_id).first()
            if not track:
                raise HTTPException(
                    status_code=404,
                    detail="요청한 트랙을 찾을 수 없습니다.",
                )

            requested_scores = request.scores or []
            if not requested_scores:
                return ScoreSaveResponse(
                    saved_count=0,
                    updated_count=0,
                    message="저장할 점수 데이터가 없습니다.",
                )

            input_pairs = {}
            criterion_ids = set()
            student_ids = set()

            for score_input in requested_scores:
                key = (score_input.student_id, score_input.criterion_id)
                input_pairs[key] = score_input
                criterion_ids.add(score_input.criterion_id)
                student_ids.add(score_input.student_id)

            criteria = (
                db.query(EvaluationCriterion)
                .filter(
                    EvaluationCriterion.track_id == track_id,
                    EvaluationCriterion.id.in_(criterion_ids),
                )
                .all()
            )
            valid_criterion_ids = {criterion.id: criterion for criterion in criteria}

            missing_criterion_ids = set(criterion_ids) - set(valid_criterion_ids.keys())
            if missing_criterion_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"요청한 일부 평가요소가 현재 트랙에 없습니다: {sorted(missing_criterion_ids)}",
                )

            enrolled_student_ids = {
                row.student_id
                for row in (
                    db.query(StudentProject.student_id)
                    .filter(
                        StudentProject.track_id == track_id,
                        StudentProject.student_id.in_(student_ids),
                    )
                    .all()
                )
            }

            missing_student_ids = set(student_ids) - set(enrolled_student_ids)
            if missing_student_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"요청한 일부 학생이 현재 트랙에 없습니다: {sorted(missing_student_ids)}",
                )

            existing_records = {
                (evaluation.student_id, evaluation.criterion_id): evaluation
                for evaluation in db.query(InstructorEvaluation)
                .filter(
                    InstructorEvaluation.criterion_id.in_(criterion_ids),
                    InstructorEvaluation.student_id.in_(student_ids),
                )
                .all()
            }

            saved_count = 0
            updated_count = 0

            for (student_id, criterion_id), score_input in input_pairs.items():
                criterion = valid_criterion_ids.get(criterion_id)
                if criterion and score_input.score is not None:
                    if criterion.score_scale is not None and score_input.score < 0:
                        raise HTTPException(
                            status_code=400,
                            detail=f"점수는 0 이상이어야 합니다: criterion_id={criterion_id}",
                        )
                    if (
                        criterion.score_scale is not None
                        and score_input.score > criterion.score_scale
                    ):
                        raise HTTPException(
                            status_code=400,
                            detail=(
                                f"점수는 최대 {criterion.score_scale}까지 입력할 수 있습니다: "
                                f"criterion_id={criterion_id}"
                            ),
                        )

                key = (student_id, criterion_id)
                existing = existing_records.get(key)
                if existing:
                    existing.score = score_input.score
                    existing.comment = score_input.comment
                    existing.status = "scored"
                    updated_count += 1
                else:
                    db.add(
                        InstructorEvaluation(
                            student_id=student_id,
                            criterion_id=criterion_id,
                            score=score_input.score,
                            comment=score_input.comment,
                            status="scored",
                        )
                    )
                    saved_count += 1

            db.commit()

            return ScoreSaveResponse(
                saved_count=saved_count,
                updated_count=updated_count,
                message="점수 저장이 완료되었습니다.",
            )

    @staticmethod
    def get_evaluation_matrix(track_id: int) -> EvaluationMatrixResponse:
        with SessionLocal() as db:
            track = db.query(CourseTrack).filter(CourseTrack.id == track_id).first()
            if not track:
                raise HTTPException(
                    status_code=404,
                    detail="요청한 트랙을 찾을 수 없습니다.",
                )

            criteria = (
                db.query(EvaluationCriterion)
                .filter(
                    EvaluationCriterion.track_id == track_id,
                    EvaluationCriterion.status == "approved",
                )
                .order_by(EvaluationCriterion.priority.asc().nulls_last())
                .all()
            )

            criterion_ids = [criterion.id for criterion in criteria]

            criterion_payload = [
                CriterionDetailItem(
                    id=criterion.id,
                    title=criterion.title,
                    description=criterion.description,
                    priority=criterion.priority,
                    score_scale=criterion.score_scale or 5,
                    status=criterion.status,
                )
                for criterion in criteria
            ]

            student_rows = (
                db.query(User.id, User.name, User.login_id)
                .join(StudentProject, StudentProject.student_id == User.id)
                .filter(StudentProject.track_id == track_id)
                .distinct()
                .all()
            )

            scores = (
                db.query(InstructorEvaluation)
                .join(
                    EvaluationCriterion,
                    InstructorEvaluation.criterion_id == EvaluationCriterion.id,
                )
                .filter(
                    EvaluationCriterion.track_id == track_id,
                    EvaluationCriterion.status == "approved",
                )
                .all()
            )

            student_scores = [
                ScoreDetailItem(
                    student_id=score.student_id,
                    criterion_id=score.criterion_id,
                    score=score.score,
                    comment=score.comment,
                    status=score.status,
                )
                for score in scores
            ]

            completed_map: dict[int, set[int]] = defaultdict(set)
            for score in scores:
                if score.score is not None:
                    completed_map[score.student_id].add(score.criterion_id)

            students_payload = []
            for student_id, student_name, login_id in student_rows:
                completed_count = len(completed_map.get(student_id, set()))
                if criterion_ids:
                    if completed_count >= len(criterion_ids):
                        evaluation_status = "승인완료"
                    else:
                        evaluation_status = "검토대기"
                else:
                    evaluation_status = None

                students_payload.append(
                    StudentDetailItem(
                        student_id=student_id,
                        student_name=student_name,
                        login_id=login_id,
                        evaluation_status=evaluation_status,
                    )
                )

            return EvaluationMatrixResponse(
                track=TrackDetailItem(
                    track_id=track.id,
                    track_name=track.name,
                    domain_type=track.domain_type,
                ),
                criteria=criterion_payload,
                students=students_payload,
                scores=student_scores,
            )
