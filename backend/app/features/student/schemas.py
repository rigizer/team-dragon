from typing import List, Optional

from pydantic import BaseModel


class StudentTrackItemResponse(BaseModel):
    track_id: Optional[int] = None
    track_name: Optional[str] = None


class StudentTrackListResponse(BaseModel):
    tracks: List[StudentTrackItemResponse] = []
    message: Optional[str] = None


class ProjectUploadRequest(BaseModel):
    student_id: str
    track_id: Optional[str] = None
    title: str
    project_link: Optional[str] = None
    extra_links: Optional[List[str]] = None


class ProjectUploadResponse(BaseModel):
    project_id: Optional[int] = None
    status: Optional[str] = None


class ContributionActionItem(BaseModel):
    action: Optional[str] = None


class ContributionResultItem(BaseModel):
    result: Optional[str] = None


class ContributionSkillItem(BaseModel):
    skill: Optional[str] = None


class ContributionCandidateResponse(BaseModel):
    role: Optional[str] = None
    actions: List[ContributionActionItem] = []
    results: List[ContributionResultItem] = []
    skills: List[ContributionSkillItem] = []
    source: Optional[str] = None


class ContributionCandidateListResponse(BaseModel):
    suggestions: List[ContributionCandidateResponse] = []


class ContributionUpdateItemRequest(BaseModel):
    role: str
    actions: List[ContributionActionItem] = []
    results: List[ContributionResultItem] = []
    skills: List[ContributionSkillItem] = []


class ContributionUpdateRequest(BaseModel):
    suggestions: List[ContributionUpdateItemRequest] = []


class ContributionUpdateResponse(BaseModel):
    status: Optional[str] = None
