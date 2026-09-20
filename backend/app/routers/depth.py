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
    import asyncio
    import os
    res = await db.execute(select(ImageAsset).filter(ImageAsset.id == image_id))
    img = res.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
        
    # Check if preprocessed image exists, prefer it for faster processing
    root, _ = os.path.splitext(img.filepath)
    prep_path = f"{root}_preprocessed.png"
    target_path = prep_path if os.path.exists(prep_path) else img.filepath
    
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail=f"Image file missing on disk: {target_path}")

    try:
        out_path, min_d, max_d, mean_d, inf_time, model, is_demo = await asyncio.to_thread(estimate_depth, target_path)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Depth estimation failed: {str(e)}")
    
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
