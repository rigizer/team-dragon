from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    login_id: str

class LoginResponse(BaseModel):
    isSuccess: bool
    user_id: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
