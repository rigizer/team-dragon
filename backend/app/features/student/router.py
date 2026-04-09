from fastapi import APIRouter
from app.features.student.service import StudentService

router = APIRouter(prefix="/api", tags=["student"])

@router.get("/{student_id}/tracks")
async def get_student_tracks(student_id: int):
    return StudentService.get_student_tracks(student_id)

@router.post("/projects")
async def upload_project():
    return StudentService.upload_project()

@router.get("/projects/{project_id}/contributions/candidates")
async def get_contribution_candidates(project_id: int):
    return StudentService.get_contribution_candidates(project_id)

@router.patch("/projects/{project_id}/contributions")
async def update_contributions(project_id: int):
    return StudentService.update_contributions(project_id)
