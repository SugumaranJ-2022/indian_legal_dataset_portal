from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import Token, UserResponse

router = APIRouter()

class LoginJSONRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=Token)
def login(
    request_data: LoginJSONRequest,
    db: Session = Depends(get_db)
):
    """
    JSON login endpoint.
    """
    user = db.query(User).filter(User.email == request_data.email).first()
    if not user or not verify_password(request_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        user.email, role=user.role, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "email": user.email
    }

@router.post("/refresh", response_model=Token)
def refresh(current_user: User = Depends(get_current_user)):
    """
    Refresh access token.
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        current_user.email, role=current_user.role, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": current_user.role,
        "name": current_user.name,
        "email": current_user.email
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user details.
    """
    return current_user
