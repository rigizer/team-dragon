from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["student"])

@router.get("/{student_id}/tracks")
async def get_student_tracks(student_id: int):
    return {"message": f"tracks for student {student_id}"}

@router.post("/projects")
async def upload_project():
    return {"message": "project uploaded"}

@router.get("/projects/{project_id}/contributions/candidates")
async def get_contribution_candidates(project_id: int):
    return {"message": "contribution candidates"}

@router.patch("/projects/{project_id}/contributions")
async def update_contributions(project_id: int):
    return {"message": "contributions updated"}
