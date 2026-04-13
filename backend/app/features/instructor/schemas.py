from pydantic import BaseModel
from typing import List, Optional


class StudentItem(BaseModel):
    student_name: Optional[str] = None
    student_id: Optional[int | str] = None
    login_id: Optional[str] = None


class StudentListResponse(BaseModel):
    students: List[StudentItem]


class TrackItem(BaseModel):
    track_name: Optional[str] = None
    track_id: Optional[int] = None


class TrackListResponse(BaseModel):
    tracks: List[TrackItem]


class TrackCreateResponse(BaseModel):
    track_id: int
    status: str


class TrackStudentAddRequest(BaseModel):
    student_login_id: Optional[str] = None
    student_id: Optional[int] = None


class TrackStudentAddResponse(BaseModel):
    track_id: int
    student_id: int
    student_login_id: str
    student_name: str
    status: str
    message: str


class TrackStudentRemoveResponse(BaseModel):
    track_id: int
    student_id: int
    removed_score_count: int
    status: str
    message: str


class TrackCriterionAddRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[int] = None
    score_scale: Optional[int] = 5


class TrackCriterionAddResponse(BaseModel):
    criterion_id: int
    title: str
    status: str
    score_scale: int
    message: str


class TrackCriterionRemoveResponse(BaseModel):
    criterion_id: int
    track_id: int
    removed_score_count: int
    status: str
    message: str


class CandidateItem(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    source_refs: Optional[str] = None
    flags: Optional[str] = None


class CandidateListResponse(BaseModel):
    candidates: List[CandidateItem]


class ApproveCriteriaRequest(BaseModel):
    criterion_ids: Optional[List[int]] = None


class ApprovedCriterionItem(BaseModel):
    id: int
    title: str
    status: str


class ApproveCriteriaResponse(BaseModel):
    approved_count: int
    criteria: List[ApprovedCriterionItem]


class ScoreItem(BaseModel):
    student_id: int
    criterion_id: int
    score: int
    comment: Optional[str] = None


class SaveScoresRequest(BaseModel):
    scores: List[ScoreItem]


class ScoreSaveResponse(BaseModel):
    saved_count: int
    updated_count: int
    message: str


class CriterionDetailItem(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    priority: Optional[int] = None
    score_scale: int
    status: str


class TrackDetailItem(BaseModel):
    track_id: int
    track_name: str
    domain_type: str


class StudentDetailItem(BaseModel):
    student_id: int
    student_name: str
    login_id: str
    evaluation_status: Optional[str] = None


class ScoreDetailItem(BaseModel):
    student_id: int
    criterion_id: int
    score: Optional[int] = None
    comment: Optional[str] = None
    status: Optional[str] = None


class EvaluationMatrixResponse(BaseModel):
    track: TrackDetailItem
    criteria: List[CriterionDetailItem]
    students: List[StudentDetailItem]
    scores: List[ScoreDetailItem]
