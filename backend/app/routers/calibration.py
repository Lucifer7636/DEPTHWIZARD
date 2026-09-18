from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Calibration, DepthResult
from app.schemas.schemas import CalibrationRequest, CalibrationResponse
from app.services.calibration_service import calibrate, calibrate_default

router = APIRouter(prefix="/calibrate", tags=["calibration"])

@router.post("/", response_model=CalibrationResponse)
@router.post("", response_model=CalibrationResponse, include_in_schema=False)
async def do_calibration(req: CalibrationRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(DepthResult).filter(DepthResult.project_id == req.project_id).order_by(DepthResult.id.desc()))
    depth_res = res.scalars().first()
    
    if depth_res:
        scale, method, is_estimated = calibrate(depth_res.min_depth, depth_res.max_depth, req)
    else:
        scale = calibrate_default(0.0, 1.0)
        method = "estimated"
        is_estimated = True
        
    calib = Calibration(
        project_id=req.project_id,
        method=method,
        reference_height=req.reference_height,
        focal_length=req.focal_length,
        camera_altitude=req.camera_altitude,
        fov=req.fov,
        scale_factor=scale,
        is_estimated=is_estimated
    )
    db.add(calib)
    await db.commit()
    await db.refresh(calib)
    
    return calib
