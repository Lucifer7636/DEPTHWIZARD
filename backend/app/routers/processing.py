from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import ImageAsset
from app.services.image_service import preprocess_image
from app.services.segmentation_service import segment_image
from app.schemas.schemas import JobResponse

router = APIRouter(tags=["processing"])

@router.post("/preprocess")
@router.post("/preprocess/", include_in_schema=False)
async def preprocess(
    image_id: int = Form(...),
    project_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    import os
    import asyncio
    import traceback
    print("DW_STAGE2_BACKEND_RECEIVED")
    print("image_id =", image_id)
    print("project_id =", project_id)
    try:
        res = await db.execute(select(ImageAsset).filter(ImageAsset.id == image_id))
        img = res.scalar_one_or_none()
        print("[PREPROCESS] IMAGE RECORD =", img)
        if not img:
            raise HTTPException(status_code=404, detail="Image not found")
        
        print("[PREPROCESS] FILEPATH =", img.filepath)
        print("[PREPROCESS] FILE EXISTS =", os.path.exists(img.filepath))
        if not os.path.exists(img.filepath):
            raise HTTPException(status_code=404, detail=f"Image file not found on disk: {img.filepath}")
        
        print("[PREPROCESS] IMAGE PROCESSING START")
        out_path = await asyncio.to_thread(preprocess_image, img.filepath)
        print("[PREPROCESS] IMAGE PROCESSING COMPLETE")
        print("[PREPROCESS] OUTPUT =", out_path)
        print("[PREPROCESS] RESPONSE RETURNING")
        return {"message": "Preprocessed", "path": out_path}
    except HTTPException:
        raise
    except Exception as e:
        print("[PREPROCESS] EXCEPTION CAUGHT:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

@router.post("/segment")
@router.post("/segment/", include_in_schema=False)
async def segment(
    image_id: int = Form(...),
    project_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    import asyncio
    import traceback
    try:
        res = await db.execute(select(ImageAsset).filter(ImageAsset.id == image_id))
        img = res.scalar_one_or_none()
        if not img:
            raise HTTPException(status_code=404, detail="Image not found")
            
        seg_path, label = await asyncio.to_thread(segment_image, img.filepath)
        return {"segmentation_path": seg_path, "label": label}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")
