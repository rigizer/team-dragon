from typing import List, Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.features.student.schemas import (
    ContributionCandidateListResponse,
    ContributionUpdateRequest,
    ContributionUpdateResponse,
    ProjectUploadResponse,
    StudentTrackListResponse,
)
from app.features.student.service import StudentService

router = APIRouter(prefix="/api", tags=["student"])


@router.get("/{student_id}/tracks", response_model=StudentTrackListResponse)
async def get_student_tracks(student_id: int):
    return StudentService.get_student_tracks(student_id)


@router.post("/projects", response_model=ProjectUploadResponse)
async def upload_project(
    student_id: str = Form(...),
    title: str = Form(...),
    track_id: Optional[str] = Form(None),
    project_link: Optional[str] = Form(None),
    extra_links: Optional[str] = Form(None),
    project_pdf: List[UploadFile] = File(...),
):
    return await StudentService.upload_project(
        student_id,
        title,
        track_id,
        project_link,
        extra_links,
        project_pdf[0],
    )


@router.get(
    "/projects/{project_id}/contributions/candidates",
    response_model=ContributionCandidateListResponse,
)
async def get_contribution_candidates(project_id: int):
    return StudentService.get_contribution_candidates(project_id)


@router.patch(
    "/projects/{project_id}/contributions", response_model=ContributionUpdateResponse
)
async def update_contributions(project_id: int, body: ContributionUpdateRequest):
    return StudentService.update_contributions(project_id, body)
