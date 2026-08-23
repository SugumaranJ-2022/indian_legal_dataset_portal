import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Legal Dataset Research Portal"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-123456")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///c:/Users/Welcome/Desktop/Ai_Task_1/legal-dataset-portal/database/legal_portal.db"
    )

    # Directories
    BASE_DIR: str = "c:/Users/Welcome/Desktop/Ai_Task_1/legal-dataset-portal"
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "reports")
    DATABASE_DIR: str = os.path.join(BASE_DIR, "database")

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.DATABASE_DIR, exist_ok=True)
