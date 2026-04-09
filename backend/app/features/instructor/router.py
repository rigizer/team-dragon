from fastapi import APIRouter, File, UploadFile, Form
from app.features.instructor.schemas import (
    StudentListResponse, TrackListResponse, TrackCreateResponse, 
    CandidateListResponse, ApproveCriteriaRequest, ApproveCriteriaResponse
)
from app.features.instructor.service import InstructorService

router = APIRouter(prefix="/api", tags=["instructor"])

@router.get("/instructor/{instructor_id}/students", response_model=StudentListResponse)
async def get_instructor_students(instructor_id: str):
    """
    강사별 수강생 정보 조회 API
    
    - 경로 변수 instructor_id(강사 ID)를 기준으로 매핑된 학생 목록을 반환합니다.
    - 각 학생 정보는 '이름+아이디' 형식으로 가공됩니다.
    """
    return InstructorService.get_students(instructor_id)

@router.get("/instructor/{instructor_id}/tracks", response_model=TrackListResponse)
async def get_tracks(instructor_id: str):
    """
    강사별 트랙 목록 조회 API
    
    - 경로 변수 instructor_id를 기준으로 해당 강사가 등록한 트랙 목록을 반환합니다.
    """
    return InstructorService.get_tracks(instructor_id)

@router.post("/instructor/{instructor_id}/tracks", response_model=TrackCreateResponse)
async def create_track(
    instructor_id: str,
    name: str = Form(...),
    domain_type: str = Form(...),
    material_file: UploadFile = File(...),
    rubric_file: UploadFile = File(...)
):
    """
    트랙 등록 및 자료 업로드 API
    
    - Multipart/Form-Data 형식으로 트랙 정보와 PDF 파일을 수신합니다.
    - 파일은 서버에 저장되고 DB에 트랙과 자료 정보가 등록됩니다.
    """
    return InstructorService.create_track(
        instructor_id, name, domain_type, material_file, rubric_file
    )

@router.get("/tracks/{track_id}/portfolio")
async def get_track_portfolios(track_id: int):
    return InstructorService.get_track_portfolios(track_id)

@router.get("/tracks/{track_id}/criteria/candidates", response_model=CandidateListResponse)
async def get_criteria_candidates(track_id: int):
    """
    평가지표 후보 조회 API
    
    - 시스템이 생성한 평가지표 후보 3개를 반환합니다.
    - 처음 호출 시 GPT를 통해 생성하며, 이후에는 저장된 지표를 반환합니다.
    """
    return InstructorService.get_criteria_candidates(track_id)

@router.post("/tracks/{track_id}/criteria/approve", response_model=ApproveCriteriaResponse)
async def approve_criteria(track_id: int, request: ApproveCriteriaRequest):
    """
    평가지표 수정 및 확정 API
    
    - 강사가 수정한 평가지표 목록(최대 5개)을 받아 DB에 저장합니다.
    - 기존에 생성된 임시(draft) 지표들은 삭제하고 전달받은 지표로 교체합니다.
    """
    return InstructorService.approve_criteria(track_id, request)

@router.post("/projects/{track_id}/evaluations")
async def evaluate_projects(track_id: int):
    return InstructorService.evaluate_projects(track_id)
