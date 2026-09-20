from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Reconstruction, Flythrough
from app.services.flythrough_service import generate_camera_path
import json
import os
import logging

logger = logging.getLogger("depthwizard.flythrough_router")

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
    bbox_min = None
    bbox_max = None
    scene_center = None
    
    if reconstruction_id > 0:
        res = await db.execute(select(Reconstruction).filter(Reconstruction.id == reconstruction_id))
        rec = res.scalar_one_or_none()
        if rec:
            num_points = rec.num_points or 5000
            
            # Try to load the actual point cloud JSON to get scene bounding box
            if rec.point_cloud_path and os.path.exists(rec.point_cloud_path):
                try:
                    with open(rec.point_cloud_path, 'r') as f:
                        pc_data = json.load(f)
                    bbox_min = pc_data.get("bbox_min")
                    bbox_max = pc_data.get("bbox_max")
                    scene_center = pc_data.get("center")
                    logger.info(f"Scene bbox loaded: min={bbox_min}, max={bbox_max}, center={scene_center}")
                except Exception as e:
                    logger.warning(f"Could not load point cloud for bbox: {e}")
            else:
                # Try to find it by filename pattern
                pc_filename = os.path.basename(rec.point_cloud_path) if rec.point_cloud_path else ""
                if pc_filename:
                    from app.config import settings
                    alt_path = os.path.join(settings.OUTPUT_DIR, pc_filename)
                    if os.path.exists(alt_path):
                        try:
                            with open(alt_path, 'r') as f:
                                pc_data = json.load(f)
                            bbox_min = pc_data.get("bbox_min")
                            bbox_max = pc_data.get("bbox_max")
                            scene_center = pc_data.get("center")
                        except Exception:
                            pass
    
    path = generate_camera_path(
        num_points=num_points,
        duration=duration,
        orbit_radius=orbit_radius,
        altitude=altitude,
        bbox_min=bbox_min,
        bbox_max=bbox_max,
        scene_center=scene_center
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
