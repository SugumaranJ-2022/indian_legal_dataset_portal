import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Legal Dataset Research Portal"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Directories
    BASE_DIR: str = os.getenv(
        "BASE_DIR", 
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ).replace("\\", "/")
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads").replace("\\", "/")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "reports").replace("\\", "/")
    DATABASE_DIR: str = os.path.join(BASE_DIR, "database").replace("\\", "/")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(DATABASE_DIR, 'legal_portal.db')}"
    ).replace("\\", "/")

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.DATABASE_DIR, exist_ok=True)
