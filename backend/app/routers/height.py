from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import DepthResult, Calibration, HeightMeasurement
from app.services.height_service import estimate_heights, get_height_at_point
import json

router = APIRouter(prefix="/height", tags=["height"])

@router.post("/estimate")
async def estimate(project_id: int = Form(...), depth_result_id: int = Form(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(DepthResult).filter(DepthResult.id == depth_result_id))
    depth = res.scalar_one_or_none()
    if not depth:
        raise HTTPException(status_code=404, detail="Depth result not found")
    
    res = await db.execute(select(Calibration).filter(Calibration.project_id == project_id).order_by(Calibration.id.desc()))
    calib = res.scalars().first()
    
    scale_factor = calib.scale_factor if calib else 50.0
    
    # Use the updated estimate_heights that takes a path
    heights = estimate_heights(depth.depth_map_path, scale_factor)
    
    height_res = HeightMeasurement(
        project_id=project_id,
        depth_result_id=depth_result_id,
        min_height=heights["min_height"],
        max_height=heights["max_height"],
        mean_height=heights["mean_height"],
        building_heights_json=json.dumps(heights["buildings"]),
        confidence=heights["confidence"]
    )
    db.add(height_res)
    await db.commit()
    await db.refresh(height_res)
    
    return heights

@router.post("/at-point")
async def height_at_point(
    depth_result_id: int = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    scale_factor: float = Form(50.0),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(DepthResult).filter(DepthResult.id == depth_result_id))
    depth = res.scalar_one_or_none()
    if not depth:
        raise HTTPException(status_code=404, detail="Depth result not found")
    
    return get_height_at_point(depth.depth_map_path, x, y, scale_factor)
