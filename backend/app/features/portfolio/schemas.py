from pydantic import BaseModel


class PortfolioReviewResponse(BaseModel):
    portfolio_url: str


class PortfolioApproveRequest(BaseModel):
    is_approved: bool


class PortfolioApproveResponse(BaseModel):
    status: str | None = None


class EmploymentPackResponse(BaseModel):
    file_url: str | None = None
    status: str | None = None
