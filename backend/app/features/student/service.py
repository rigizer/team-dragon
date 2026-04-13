import base64
import os
import uuid
from pathlib import Path
from typing import List, Optional

import fitz  # PyMuPDF
import requests
from PyPDF2 import PdfReader
from fastapi import HTTPException, UploadFile

from app.db.database import SessionLocal
from app.db.models import (
    ContributionFrom,
    ContributionSkill,
    CourseTrack,
    EmploymentPack,
    EvaluationCriterion,
    StudentProject,
    User,
)
from app.features.student.schemas import (
    ContributionActionItem,
    ContributionCandidateListResponse,
    ContributionCandidateResponse,
    ContributionResultItem,
    ContributionSkillItem,
    ContributionUpdateRequest,
    ContributionUpdateResponse,
    ProjectUploadResponse,
    StudentTrackItemResponse,
    StudentTrackListResponse,
)

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"


def _split_text_field(text: Optional[str]) -> List[str]:
    if not text:
        return []
    return [line.strip() for line in text.split("\n") if line.strip()]


class StudentService:
    """학생 관련 비즈니스 로직 및 DB 세션 관리"""

    @staticmethod
    def get_student_tracks(student_id: int) -> StudentTrackListResponse:
        with SessionLocal() as db:
            student = (
                db.query(User)
                .filter(User.id == student_id, User.role == "STUDENT")
                .first()
            )
            if student is None:
                raise HTTPException(status_code=404, detail="Student not found")

            tracks = (
                db.query(CourseTrack)
                .join(StudentProject, StudentProject.track_id == CourseTrack.id)
                .filter(StudentProject.student_id == student_id)
                .distinct()
                .all()
            )

            track_items = [
                StudentTrackItemResponse(track_id=t.id, track_name=t.name)
                for t in tracks
            ]

            return StudentTrackListResponse(tracks=track_items, message=None)

    @staticmethod
    async def upload_project(
        student_id: str,
        title: str,
        track_id: Optional[str],
        project_link: Optional[str],
        extra_links: Optional[str],
        project_pdf: UploadFile,
    ) -> ProjectUploadResponse:
        try:
            student_id_int = int(student_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="student_id must be an integer")

        if not track_id:
            raise HTTPException(status_code=422, detail="track_id is required")
        try:
            track_id_int = int(track_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="track_id must be an integer")

        content_type = project_pdf.content_type or ""
        if content_type and "pdf" not in content_type.lower():
            raise HTTPException(status_code=400, detail="Uploaded file must be a PDF")

        file_bytes = await project_pdf.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file: not a valid PDF format",
            )

        with SessionLocal() as db:
            student = (
                db.query(User)
                .filter(User.id == student_id_int, User.role == "STUDENT")
                .first()
            )
            if student is None:
                raise HTTPException(status_code=404, detail="Student not found")

            track = db.query(CourseTrack).filter(CourseTrack.id == track_id_int).first()
            if track is None:
                raise HTTPException(status_code=404, detail="Track not found")

            UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
            filename = f"{student_id_int}_{track_id_int}_{uuid.uuid4().hex}.pdf"
            file_path = UPLOADS_DIR / filename
            file_path.write_bytes(file_bytes)

            pdf_url = f"uploads/{filename}"

            existing_project = (
                db.query(StudentProject)
                .filter(
                    StudentProject.student_id == student_id_int,
                    StudentProject.track_id == track_id_int,
                )
                .order_by(StudentProject.id.desc())
                .first()
            )

            if existing_project is None:
                project = StudentProject(
                    student_id=student_id_int,
                    track_id=track_id_int,
                    title=title,
                    project_pdf_url=pdf_url,
                    status="uploaded",
                )
                project.employment_pack = EmploymentPack(
                    portfolio_file_url=pdf_url,
                    status="provisional",
                )
                db.add(project)
            else:
                existing_project.title = title
                existing_project.project_pdf_url = pdf_url
                existing_project.status = "uploaded"

                if existing_project.employment_pack is None:
                    existing_project.employment_pack = EmploymentPack(
                        portfolio_file_url=pdf_url,
                        status="provisional",
                    )
                else:
                    existing_project.employment_pack.portfolio_file_url = pdf_url
                project = existing_project

            extracted_text = StudentService._extract_text_from_pdf(str(file_path))
            ocr_text = ""
            if len(extracted_text.strip()) < 200:
                ocr_text = StudentService._perform_ocr(str(file_path))

            project.extracted_text = extracted_text or None
            project.ocr_text = ocr_text or None
            if extracted_text.strip() or ocr_text.strip():
                project.status = "extracted"

            try:
                db.commit()
                db.refresh(project)
            except Exception:
                try:
                    file_path.unlink(missing_ok=True)
                except OSError:
                    pass
                raise

            return ProjectUploadResponse(project_id=project.id, status=project.status)

    @staticmethod
    def get_contribution_candidates(
        project_id: int,
    ) -> ContributionCandidateListResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            contributions = (
                db.query(ContributionFrom)
                .filter(ContributionFrom.student_project_id == project_id)
                .all()
            )

            criteria = (
                db.query(EvaluationCriterion)
                .filter(
                    EvaluationCriterion.track_id == project.track_id,
                    EvaluationCriterion.status == "approved",
                )
                .order_by(
                    EvaluationCriterion.priority.asc(),
                    EvaluationCriterion.id.asc(),
                )
                .all()
            )
            if not criteria:
                criteria = (
                    db.query(EvaluationCriterion)
                    .filter(EvaluationCriterion.track_id == project.track_id)
                    .order_by(
                        EvaluationCriterion.priority.asc(),
                        EvaluationCriterion.id.asc(),
                    )
                    .all()
                )

            suggestions = []
            for index, c in enumerate(contributions):
                mapped_criterion = criteria[index] if index < len(criteria) else None

                if c.skills:
                    skill_items = [
                        ContributionSkillItem(skill=s.skill_name)
                        for s in sorted(c.skills, key=lambda sk: (sk.created_at, sk.id))
                        if s.skill_name
                    ][:5]
                else:
                    skill_items = [
                        ContributionSkillItem(skill=s) for s in _split_text_field(None)
                    ]

                suggestions.append(
                    ContributionCandidateResponse(
                        role=c.student_role,
                        actions=[
                            ContributionActionItem(action=a)
                            for a in _split_text_field(c.student_action)
                        ],
                        results=[
                            ContributionResultItem(result=r)
                            for r in _split_text_field(c.student_result)
                        ],
                        skills=skill_items,
                        source=(
                            mapped_criterion.source_refs
                            if mapped_criterion and mapped_criterion.source_refs
                            else None
                        ),
                    )
                )

            return ContributionCandidateListResponse(suggestions=suggestions)

    @staticmethod
    def update_contributions(
        project_id: int,
        body: ContributionUpdateRequest,
    ) -> ContributionUpdateResponse:
        with SessionLocal() as db:
            project = (
                db.query(StudentProject).filter(StudentProject.id == project_id).first()
            )
            if project is None:
                raise HTTPException(status_code=404, detail="Project not found")

            db.query(ContributionFrom).filter(
                ContributionFrom.student_project_id == project_id
            ).delete(synchronize_session=False)

            for suggestion in body.suggestions:
                student_action = "\n".join(
                    item.action for item in suggestion.actions if item.action
                )
                student_result = "\n".join(
                    item.result for item in suggestion.results if item.result
                )
                contribution = ContributionFrom(
                    student_project_id=project_id,
                    student_role=suggestion.role,
                    student_action=student_action or None,
                    student_result=student_result or None,
                    scope_type="individual",
                    status="draft",
                )
                db.add(contribution)
                db.flush()

                seen_skills: set[str] = set()
                for skill_item in suggestion.skills:
                    skill_name = (skill_item.skill or "").strip()
                    if not skill_name:
                        continue
                    lowered = skill_name.lower()
                    if lowered in seen_skills:
                        continue
                    seen_skills.add(lowered)
                    db.add(
                        ContributionSkill(
                            contribution_id=contribution.id,
                            skill_name=skill_name,
                        )
                    )

            db.commit()

            return ContributionUpdateResponse(status="saved")

    @staticmethod
    def _extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF using PyPDF2 PdfReader."""
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
    def _perform_ocr(file_path: str) -> str:
        """Google Vision API를 사용하여 PDF에서 텍스트를 추출 (이미지 기반)"""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return ""

        url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
        combined_text = ""

        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                img_bytes = pix.tobytes("png")

                content = base64.b64encode(img_bytes).decode("utf-8")

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
