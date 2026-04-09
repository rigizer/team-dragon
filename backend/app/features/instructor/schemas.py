from pydantic import BaseModel
from typing import List, Optional

class StudentItem(BaseModel):
    student_name: Optional[str] = None
    student_id: Optional[str] = None

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

class CandidateItem(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    source_refs: Optional[str] = None
    flags: Optional[str] = None

class CandidateListResponse(BaseModel):
    candidates: List[CandidateItem]
