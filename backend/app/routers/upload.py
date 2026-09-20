from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.models import ImageAsset
from app.schemas.schemas import ImageResponse
from app.services.image_service import validate_image, detect_image_type
from app.utils.image_utils import load_image
from app.config import settings
import os
import uuid
import aiofiles
from PIL import Image as PILImage

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/", response_model=ImageResponse)
@router.post("", response_model=ImageResponse, include_in_schema=False)
async def upload_image(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    
    # Validate file
    if not validate_image(content, file.filename):
        raise HTTPException(status_code=400, detail="Invalid image file or size exceeds limit")
    
    # Generate safe filename
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "png"
    safe_name = f"{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, safe_name)
    
    async with aiofiles.open(filepath, 'wb') as out_file:
        await out_file.write(content)
    
    # Extract image metadata reliably using multi-codec loader
    try:
        img_arr = load_image(filepath)
        height, width = img_arr.shape[:2]
        channels = img_arr.shape[2] if len(img_arr.shape) == 3 else 1
        img_type = detect_image_type(filepath)
    except Exception as e:
        print(f"Notice: Image metadata extraction fallback: {e}")
        width, height, channels = 0, 0, 3
        img_type = "RGB"
    
    db_image = ImageAsset(
        project_id=project_id,
        filename=safe_name,
        original_filename=file.filename,
        filepath=filepath,
        file_size=len(content),
        width=width,
        height=height,
        channels=channels,
        image_type=img_type
    )
    db.add(db_image)
    await db.commit()
    await db.refresh(db_image)
    
    return db_image

@router.get("/project/{project_id}", response_model=ImageResponse)
async def get_project_image(project_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    res = await db.execute(select(ImageAsset).filter(ImageAsset.project_id == project_id).order_by(ImageAsset.id.desc()))
    img = res.scalars().first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found for project")
    return img

