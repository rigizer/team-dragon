from fastapi import APIRouter
from app.features.instructor.service import InstructorService

router = APIRouter(prefix="/api", tags=["instructor"])

@router.get("/instructor/students")
async def get_instructor_students():
    return InstructorService.get_students()

@router.get("/tracks")
async def get_tracks():
    return InstructorService.get_tracks()

@router.post("/tracks")
async def create_track():
    return InstructorService.create_track()

@router.get("/tracks/{track_id}/portfolio")
async def get_track_portfolios(track_id: int):
    return InstructorService.get_track_portfolios(track_id)

@router.get("/tracks/{track_id}/criteria/candidates")
async def get_criteria_candidates(track_id: int):
    return InstructorService.get_criteria_candidates(track_id)

@router.post("/tracks/{track_id}/criteria/approve")
async def approve_criteria(track_id: int):
    return InstructorService.approve_criteria(track_id)

@router.post("/projects/{track_id}/evaluations")
async def evaluate_projects(track_id: int):
    return InstructorService.evaluate_projects(track_id)
