from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Reconstruction, Flythrough
from app.services.flythrough_service import generate_camera_path
import json

router = APIRouter(prefix="/flythrough", tags=["flythrough"])

@router.post("/path")
async def generate_path(
    project_id: int = Form(...),
    reconstruction_id: int = Form(0),
    duration: float = Form(30.0),
    orbit_radius: float = Form(1.5),
    altitude: float = Form(1.0),
    db: AsyncSession = Depends(get_db)
):
    # Get reconstruction info for scaling
    num_points = 5000
    if reconstruction_id > 0:
        res = await db.execute(select(Reconstruction).filter(Reconstruction.id == reconstruction_id))
        rec = res.scalar_one_or_none()
        if rec:
            num_points = rec.num_points or 5000
    
    path = generate_camera_path(
        num_points=num_points,
        duration=duration,
        orbit_radius=orbit_radius,
        altitude=altitude
    )
    
    fly = Flythrough(
        project_id=project_id,
        reconstruction_id=reconstruction_id if reconstruction_id > 0 else None,
        path_json=json.dumps(path),
        duration=duration
    )
    db.add(fly)
    await db.commit()
    await db.refresh(fly)
    
    return {
        "id": fly.id,
        "path": path,
        "duration": duration,
        "num_keyframes": len(path)
    }

@router.post("/render")
async def render_path():
    return {
        "status": "ok",
        "message": "Flythrough render configuration generated. Use the path data for browser-based animation.",
        "export_formats": ["json", "webm"]
    }
