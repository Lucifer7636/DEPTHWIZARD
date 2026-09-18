from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import ImageAsset, DepthResult
from app.services.depth_service import estimate_depth
from app.schemas.schemas import DepthEstimateResponse

router = APIRouter(prefix="/depth", tags=["depth"])

@router.post("/estimate", response_model=DepthEstimateResponse)
async def estimate(project_id: int = Form(...), image_id: int = Form(...), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ImageAsset).filter(ImageAsset.id == image_id))
    img = res.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
        
    out_path, min_d, max_d, mean_d, inf_time, model, is_demo = estimate_depth(img.filepath)
    
    depth_res = DepthResult(
        project_id=project_id,
        depth_map_path=out_path,
        min_depth=min_d,
        max_depth=max_d,
        mean_depth=mean_d,
        inference_time=inf_time,
        model_used=model,
        is_demo=is_demo
    )
    db.add(depth_res)
    await db.commit()
    await db.refresh(depth_res)
    
    return depth_res
