import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import HTTPException, UploadFile

from app.db.database import SessionLocal
from app.db.models import ContributionFrom, CourseTrack, StudentProject, User
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

            project = StudentProject(
                student_id=student_id_int,
                track_id=track_id_int,
                title=title,
                project_pdf_url=f"uploads/{filename}",
                status="uploaded",
            )
            db.add(project)
            db.commit()
            db.refresh(project)

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

            suggestions = [
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
                    # Skills are not persisted on this path yet; keep the response explicit.
                    skills=[
                        ContributionSkillItem(skill=s) for s in _split_text_field(None)
                    ],
                    source=None,
                )
                for c in contributions
            ]

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
                db.add(
                    ContributionFrom(
                        student_project_id=project_id,
                        student_role=suggestion.role,
                        student_action=student_action or None,
                        student_result=student_result or None,
                        scope_type="individual",
                        status="draft",
                    )
                )

            db.commit()

            return ContributionUpdateResponse(status="saved")
