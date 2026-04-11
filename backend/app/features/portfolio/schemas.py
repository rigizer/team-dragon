from pydantic import BaseModel
from typing import Optional

class PortfolioReviewResponse(BaseModel):
    portfolio_url: str

    class Config:
        from_attributes = True


class ApprovePortfolioRequest(BaseModel):
    is_approved: bool

    class Config:
        from_attributes = True


class ApprovePortfolioResponse(BaseModel):
    status: Optional[str]

    class Config:
        from_attributes = True


class DownloadEmploymentPackResponse(BaseModel):
    file_url: Optional[str]

    class Config:
        from_attributes = True


class PortfolioResponse(BaseModel):
    student_id: int
    student_name: str
    portfolio_url: Optional[str]

    class Config:
        from_attributes = True
