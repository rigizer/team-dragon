from fastapi import APIRouter
from app.features.instructor.schemas import StudentInquiryRequest, StudentListResponse, TrackListResponse
from app.features.instructor.service import InstructorService

router = APIRouter(prefix="/api", tags=["instructor"])

@router.get("/instructor/students", response_model=StudentListResponse)
async def get_instructor_students(request: StudentInquiryRequest):
    """
    강사별 수강생 정보 조회 API
    
    - 요청 바디의 user_id(강사 ID)를 기준으로 매핑된 학생 목록을 반환합니다.
    - 각 학생 정보는 '이름+아이디' 형식으로 가공됩니다.
    """
    return InstructorService.get_students(request)

@router.get("/instructor/{instructor_id}/tracks", response_model=TrackListResponse)
async def get_tracks(instructor_id: str):
    """
    강사별 트랙 목록 조회 API
    
    - 경로 변수 instructor_id를 기준으로 해당 강사가 등록한 트랙 목록을 반환합니다.
    """
    return InstructorService.get_tracks(instructor_id)

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
