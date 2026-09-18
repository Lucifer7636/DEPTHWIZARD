from pydantic_settings import BaseSettings
import os

# Root directory of DEPTHWIZARD - safe resolution for local and cloud (Railway/Docker)
if "BASE_DIR" in os.environ:
    BASE_DIR = os.path.abspath(os.environ["BASE_DIR"])
else:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent = os.path.abspath(os.path.join(current_dir, ".."))
    grandparent = os.path.abspath(os.path.join(parent, ".."))
    
    if os.path.isdir(os.path.join(grandparent, "backend", "app")):
        BASE_DIR = grandparent
    else:
        BASE_DIR = parent

DB_FILE = os.path.join(BASE_DIR, "depthwizard.db").replace("\\", "/")

def _get_database_url() -> str:
    env_db = os.environ.get("DATABASE_URL")
    if env_db:
        if env_db.startswith("postgres://"):
            return env_db.replace("postgres://", "postgresql+asyncpg://", 1)
        if env_db.startswith("postgresql://") and not env_db.startswith("postgresql+asyncpg://"):
            return env_db.replace("postgresql://", "postgresql+asyncpg://", 1)
        if env_db.startswith("sqlite:///") and not env_db.startswith("sqlite+aiosqlite:///"):
            return env_db.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return env_db
    return f"sqlite+aiosqlite:///{DB_FILE}"

class Settings(BaseSettings):
    APP_ENV: str = os.getenv("APP_ENV", "production")
    BACKEND_PORT: int = int(os.getenv("PORT", os.getenv("BACKEND_PORT", 8000)))
    DATABASE_URL: str = _get_database_url()
    MODEL_PATH: str = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "models"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "data", "uploads"))
    OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", os.path.join(BASE_DIR, "data", "outputs"))
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", 50))
    CORS_ORIGINS: list[str] = ["*"]
    MODEL_AVAILABLE: bool = False
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Detect if PyTorch is available
try:
    import torch
    settings.MODEL_AVAILABLE = True
except ImportError:
    settings.MODEL_AVAILABLE = False

try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    os.makedirs(settings.MODEL_PATH, exist_ok=True)
except Exception as e:
    print(f"Notice: Directory initialization deferred: {e}")
