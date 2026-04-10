import json
import re
import shutil
import uuid
from pathlib import Path
from typing import Iterable

from fastapi import HTTPException, UploadFile

from app.db.database import SessionLocal
from app.db.models import ContributionFrom, ContributionSkill, CourseTrack, EvaluationCriterion, StudentProject, User
from app.features.instructor.service import InstructorService
from app.features.student.schemas import (
    ContributionActionItem,
    ContributionCandidateResponse,
    ContributionResultItem,
    ContributionSkillItem,
    ContributionSuggestionItem,
    ContributionUpdateRequest,
    ContributionUpdateResponse,
    ProjectUploadResponse,
)

BASE_DIR = Path(__file__).resolve().parents[3]
PROJECT_UPLOAD_DIR = BASE_DIR / "uploads" / "projects"


class StudentService:
    """학생 관련 비즈니스 로직 및 DB 세션 관리"""
    
    @staticmethod
    def get_student_tracks(student_id: int):
        with SessionLocal() as db:
            return {"message": f"tracks for student {student_id} from service"}

    @staticmethod
    def upload_project(
        student_login_id: str,
        track_id: str | int | None,
        title: str,
        project_pdfs: list[UploadFile],
        project_link: str | None,
        extra_links: str | None,
    ) -> ProjectUploadResponse:
        with SessionLocal() as db:
            try:
                student = (
                    db.query(User)
                    .filter(User.login_id == student_login_id, User.role == "STUDENT")
                    .first()
                )
                resolved_track_id = StudentService._resolve_track_id(db, track_id)
                if not student or not project_pdfs or resolved_track_id is None:
                    return ProjectUploadResponse(project_id=None, status=None)

                project = StudentProject(
                    student_id=student.id,
                    track_id=resolved_track_id,
                    title=title,
                    project_pdf_url="[]",
                    status="uploaded",
                )
                db.add(project)
                db.flush()

                project_dir = PROJECT_UPLOAD_DIR / str(project.id)
                project_dir.mkdir(parents=True, exist_ok=True)

                saved_paths = StudentService._save_project_files(project_dir, project_pdfs)
                extracted_text, ocr_text = StudentService._extract_project_text(saved_paths)
                contribution_payload = StudentService._parse_contribution_text(
                    ocr_text or extracted_text
                )

                project.project_pdf_url = json.dumps(saved_paths, ensure_ascii=False)
                project.extracted_text = extracted_text or None
                project.ocr_text = ocr_text or None
                project.status = "extracted" if (extracted_text or ocr_text) else "uploaded"

                db.add(
                    ContributionFrom(
                        student_project_id=project.id,
                        student_role=contribution_payload["student_role"],
                        student_action=contribution_payload["student_action"],
                        student_result=contribution_payload["student_result"],
                        scope_type="individual",
                        status="submitted" if contribution_payload["student_action"] else "draft",
                    )
                )

                db.commit()
                return ProjectUploadResponse(project_id=project.id, status=project.status)
            except Exception:
                db.rollback()
                return ProjectUploadResponse(project_id=None, status=None)

    @staticmethod
    def get_contribution_candidates(project_id: int):
        with SessionLocal() as db:
            project = db.query(StudentProject).filter(StudentProject.id == project_id).first()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")

            contributions = (
                db.query(ContributionFrom)
                .filter(ContributionFrom.student_project_id == project_id)
                .order_by(ContributionFrom.created_at.asc(), ContributionFrom.id.asc())
                .limit(5)
                .all()
            )

            criteria = (
                db.query(EvaluationCriterion)
                .filter(
                    EvaluationCriterion.track_id == project.track_id,
                    EvaluationCriterion.status == "approved",
                )
                .order_by(EvaluationCriterion.priority.asc(), EvaluationCriterion.id.asc())
                .all()
            )
            if not criteria:
                criteria = (
                    db.query(EvaluationCriterion)
                    .filter(EvaluationCriterion.track_id == project.track_id)
                    .order_by(EvaluationCriterion.priority.asc(), EvaluationCriterion.id.asc())
                    .all()
                )

            suggestions: list[ContributionSuggestionItem] = []
            for index, contribution in enumerate(contributions):
                mapped_criterion = criteria[index] if index < len(criteria) else None
                actions = StudentService._split_items(contribution.student_action)
                results = StudentService._split_items(contribution.student_result)
                skills = StudentService._extract_skills(
                    contribution.student_role,
                    contribution.student_action,
                    contribution.student_result,
                )
                if contribution.skills:
                    skills = StudentService._get_saved_skills(contribution.skills)

                suggestions.append(
                    ContributionSuggestionItem(
                        role=contribution.student_role or "역할 미추출",
                        actions=[
                            ContributionActionItem(action=item)
                            for item in actions
                        ],
                        results=[
                            ContributionResultItem(result=item)
                            for item in results
                        ],
                        skills=[
                            ContributionSkillItem(skill=item)
                            for item in skills
                        ],
                        source=(
                            mapped_criterion.source_refs
                            if mapped_criterion and mapped_criterion.source_refs
                            else "source unavailable"
                        ),
                    )
                )

            return ContributionCandidateResponse(suggestions=suggestions)

    @staticmethod
    def update_contributions(
        project_id: int,
        request: ContributionUpdateRequest,
    ) -> ContributionUpdateResponse:
        with SessionLocal() as db:
            try:
                project = db.query(StudentProject).filter(StudentProject.id == project_id).first()
                if not project or not request.suggestions:
                    return ContributionUpdateResponse(status=None)

                db.query(ContributionFrom).filter(
                    ContributionFrom.student_project_id == project_id
                ).delete()

                for suggestion in request.suggestions:
                    contribution = ContributionFrom(
                        student_project_id=project_id,
                        student_role=suggestion.role,
                        student_action=StudentService._join_actions(suggestion.actions),
                        student_result=StudentService._join_results(suggestion.results),
                        scope_type="individual",
                        status="submitted",
                    )
                    db.add(contribution)
                    db.flush()

                    for skill_name in StudentService._normalize_skill_names(suggestion.skills):
                        db.add(
                            ContributionSkill(
                                contribution_id=contribution.id,
                                skill_name=skill_name,
                            )
                        )

                db.commit()
                return ContributionUpdateResponse(status="submitted")
            except Exception:
                db.rollback()
                return ContributionUpdateResponse(status=None)

    @staticmethod
    def _resolve_track_id(db, track_id: str | int | None) -> int | None:
        if track_id is None:
            return None

        if isinstance(track_id, str):
            normalized = track_id.strip()
            if not normalized or normalized.lower() == "none":
                return None
            if not normalized.isdigit():
                return None
            track_id = int(normalized)

        track = db.query(CourseTrack.id).filter(CourseTrack.id == track_id).first()
        return track.id if track else None

    @staticmethod
    def _save_project_files(project_dir: Path, project_pdfs: Iterable[UploadFile]) -> list[str]:
        saved_paths: list[str] = []

        for upload in project_pdfs:
            original_name = upload.filename or "project.pdf"
            extension = Path(original_name).suffix.lower() or ".pdf"
            if extension != ".pdf":
                raise ValueError("Only PDF files are supported.")

            saved_name = f"{uuid.uuid4()}{extension}"
            target_path = project_dir / saved_name

            with target_path.open("wb") as buffer:
                shutil.copyfileobj(upload.file, buffer)

            saved_paths.append(str(target_path.resolve()))

        return saved_paths

    @staticmethod
    def _extract_project_text(file_paths: Iterable[str]) -> tuple[str, str]:
        extracted_chunks: list[str] = []
        ocr_chunks: list[str] = []

        for file_path in file_paths:
            extracted = InstructorService._extract_text_from_pdf(file_path).strip()
            if extracted:
                extracted_chunks.append(extracted)
                continue

            ocr_text = InstructorService._perform_ocr(file_path).strip()
            if ocr_text:
                ocr_chunks.append(ocr_text)

        return "\n\n".join(extracted_chunks), "\n\n".join(ocr_chunks)

    @staticmethod
    def _parse_contribution_text(source_text: str) -> dict[str, str | None]:
        cleaned = re.sub(r"\r\n?", "\n", source_text or "").strip()
        if not cleaned:
            return {
                "student_role": None,
                "student_action": None,
                "student_result": None,
            }

        role = StudentService._extract_section(
            cleaned,
            ("\uc5ed\ud560", "\ub2f4\ub2f9 \uc5ed\ud560", "role"),
            fallback_first_line=True,
        )
        action = StudentService._extract_section(
            cleaned,
            ("\uae30\uc5ec", "\ub2f4\ub2f9 \uc5c5\ubb34", "\uc8fc\uc694 \uc791\uc5c5", "action", "responsibility"),
        )
        result = StudentService._extract_section(
            cleaned,
            ("\uc131\uacfc", "\uacb0\uacfc", "result", "achievement"),
        )

        if not action:
            action = cleaned

        return {
            "student_role": role,
            "student_action": action,
            "student_result": result,
        }

    @staticmethod
    def _extract_section(
        text: str,
        labels: tuple[str, ...],
        fallback_first_line: bool = False,
    ) -> str | None:
        for label in labels:
            pattern = rf"(?im)^\s*{re.escape(label)}\s*[:\\-]?\s*(.+)$"
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip() or None

        if fallback_first_line:
            first_line = text.splitlines()[0].strip()
            return first_line[:255] if first_line else None

        return None

    @staticmethod
    def _split_items(text: str | None) -> list[str]:
        if not text:
            return []

        normalized = re.sub(r"\r\n?", "\n", text)
        parts = re.split(r"\n+|[•·▪■]|;\s*|,\s*(?=[A-Z가-힣0-9])", normalized)

        items: list[str] = []
        seen: set[str] = set()
        for part in parts:
            cleaned = re.sub(r"^\s*[-*]\s*", "", part).strip(" \t\n\r-")
            if not cleaned or cleaned in seen:
                continue
            seen.add(cleaned)
            items.append(cleaned)

        return items[:5]

    @staticmethod
    def _join_actions(actions: list[ContributionActionItem]) -> str | None:
        joined = "\n".join(item.action.strip() for item in actions if item.action.strip())
        return joined or None

    @staticmethod
    def _join_results(results: list[ContributionResultItem]) -> str | None:
        joined = "\n".join(item.result.strip() for item in results if item.result.strip())
        return joined or None

    @staticmethod
    def _normalize_skill_names(skills: list[ContributionSkillItem]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()

        for item in skills:
            skill_name = item.skill.strip()
            if not skill_name:
                continue

            lowered = skill_name.lower()
            if lowered in seen:
                continue

            seen.add(lowered)
            normalized.append(skill_name)

        return normalized[:5]

    @staticmethod
    def _get_saved_skills(skills: list[ContributionSkill]) -> list[str]:
        ordered = sorted(skills, key=lambda skill: (skill.created_at, skill.id))
        return [skill.skill_name for skill in ordered if skill.skill_name][:5]

    @staticmethod
    def _extract_skills(*texts: str | None) -> list[str]:
        combined = " ".join(text for text in texts if text)
        if not combined.strip():
            return []

        pattern = (
            r"\b(?:FastAPI|Django|Flask|Spring Boot|Spring|Java|Python|JavaScript|TypeScript|"
            r"React|Next\.js|Vue|Node\.js|Express|PostgreSQL|MySQL|Redis|MongoDB|SQLAlchemy|"
            r"Docker|Kubernetes|GitHub Actions|AWS|EC2|S3|JWT|REST(?:ful)? API|gRPC|GraphQL)\b"
        )
        matches = re.findall(pattern, combined, flags=re.IGNORECASE)

        skills: list[str] = []
        seen: set[str] = set()
        for match in matches:
            normalized = match.strip()
            lowered = normalized.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            skills.append(normalized)

        return skills[:5]
