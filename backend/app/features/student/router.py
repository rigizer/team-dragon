from typing import List

from fastapi import APIRouter, File, Form, UploadFile

from app.features.student.schemas import ContributionCandidateResponse, ProjectUploadResponse
from app.features.student.service import StudentService

router = APIRouter(prefix="/api", tags=["student"])

@router.get("/{student_id}/tracks")
async def get_student_tracks(student_id: int):
    return StudentService.get_student_tracks(student_id)

@router.post("/projects", response_model=ProjectUploadResponse)
async def upload_project(
    student_id: str = Form(...),
    track_id: str | None = Form(None),
    title: str = Form(...),
    project_pdf: List[UploadFile] = File(...),
    project_link: str | None = Form(None),
    extra_links: str | None = Form(None),
):
    return StudentService.upload_project(
        student_login_id=student_id,
        track_id=track_id,
        title=title,
        project_pdfs=project_pdf,
        project_link=project_link,
        extra_links=extra_links,
    )

@router.get("/projects/{project_id}/contributions/candidates", response_model=ContributionCandidateResponse)
async def get_contribution_candidates(project_id: int):
    return StudentService.get_contribution_candidates(project_id)

@router.patch("/projects/{project_id}/contributions")
async def update_contributions(project_id: int):
    return StudentService.update_contributions(project_id)
