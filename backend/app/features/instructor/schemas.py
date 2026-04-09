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
