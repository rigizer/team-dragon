from typing import Optional

from pydantic import BaseModel


class ProjectUploadResponse(BaseModel):
    project_id: Optional[int] = None
    status: Optional[str] = None
