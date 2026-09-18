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
async def preprocess(
    image_id: int = Form(...),
    project_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(ImageAsset).filter(ImageAsset.id == image_id))
    img = res.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    
    out_path = preprocess_image(img.filepath)
    return {"message": "Preprocessed", "path": out_path}

@router.post("/segment")
async def segment(
    image_id: int = Form(...),
    project_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(ImageAsset).filter(ImageAsset.id == image_id))
    img = res.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
        
    seg_path, label = segment_image(img.filepath)
    return {"segmentation_path": seg_path, "label": label}
