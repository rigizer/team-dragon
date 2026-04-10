from typing import Optional

from pydantic import BaseModel


class ProjectUploadResponse(BaseModel):
    project_id: Optional[int] = None
    status: Optional[str] = None


class ContributionActionItem(BaseModel):
    action: str


class ContributionResultItem(BaseModel):
    result: str


class ContributionSkillItem(BaseModel):
    skill: str


class ContributionSuggestionItem(BaseModel):
    role: str
    actions: list[ContributionActionItem]
    results: list[ContributionResultItem]
    skills: list[ContributionSkillItem]
    source: str


class ContributionCandidateResponse(BaseModel):
    suggestions: list[ContributionSuggestionItem]


class ContributionSuggestionUpdateItem(BaseModel):
    role: str
    actions: list[ContributionActionItem]
    results: list[ContributionResultItem]
    skills: list[ContributionSkillItem]


class ContributionUpdateRequest(BaseModel):
    suggestions: list[ContributionSuggestionUpdateItem]


class ContributionUpdateResponse(BaseModel):
    status: Optional[str] = None
