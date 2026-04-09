from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["instructor"])

@router.get("/instructor/students")
async def get_instructor_students():
    return {"message": "instructor students list"}

@router.get("/tracks")
async def get_tracks():
    return {"message": "track list"}

@router.post("/tracks")
async def create_track():
    return {"message": "track created"}

@router.get("/tracks/{track_id}/portfolio")
async def get_track_portfolios(track_id: int):
    return {"message": f"portfolios for track {track_id}"}

@router.get("/tracks/{track_id}/criteria/candidates")
async def get_criteria_candidates(track_id: int):
    return {"message": "criteria candidates"}

@router.post("/tracks/{track_id}/criteria/approve")
async def approve_criteria(track_id: int):
    return {"message": "criteria approved"}

@router.post("/projects/{track_id}/evaluations")
async def evaluate_projects(track_id: int):
    return {"message": "evaluations recorded"}
