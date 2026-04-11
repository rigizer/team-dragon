from pydantic import BaseModel

class PortfolioReviewResponse(BaseModel):
    portfolio_url: str

    class Config:
        from_attributes = True
