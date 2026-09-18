from fastapi import APIRouter
from app.schemas.schemas import HealthResponse
from app.config import settings

router = APIRouter(prefix="/health", tags=["health"])

@router.get("", response_model=HealthResponse)
@router.get("/", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "model_available": settings.MODEL_AVAILABLE}
