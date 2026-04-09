from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["portfolio"])

@router.get("/projects/{project_id}/review")
async def review_portfolio(project_id: int):
    return {"message": "portfolio review content"}

@router.post("/projects/{project_id}/approve")
async def approve_portfolio(project_id: int):
    return {"message": "portfolio approved"}

@router.get("/projects/{project_id}/employment-pack")
async def download_employment_pack(project_id: int):
    return {"message": "employment pack download link"}
