import os
from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import DepthResult, Reconstruction, ImageAsset
from app.schemas.schemas import PointCloudData, MeshData
from app.services.reconstruction_service import generate_point_cloud, generate_mesh

router = APIRouter(prefix="/reconstruct", tags=["reconstruction"])

@router.post("/pointcloud", response_model=PointCloudData)
async def reconstruct_pc(project_id: int = Form(...), depth_result_id: int = Form(...), db: AsyncSession = Depends(get_db)):
    import asyncio
    from fastapi import HTTPException
    res = await db.execute(select(DepthResult).filter(DepthResult.id == depth_result_id))
    depth = res.scalar_one_or_none()
    if not depth or not os.path.exists(depth.depth_map_path):
        raise HTTPException(status_code=404, detail="Depth result not found or depth map missing")
    
    res_img = await db.execute(select(ImageAsset).filter(ImageAsset.project_id == project_id).order_by(ImageAsset.id.desc()))
    img = res_img.scalars().first()
    if not img or not os.path.exists(img.filepath):
        raise HTTPException(status_code=404, detail="Original image asset not found for project")
    image_path = img.filepath
    
    try:
        pc_path, num_points = await asyncio.to_thread(generate_point_cloud, depth.depth_map_path, image_path)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Point cloud generation failed: {str(e)}")
    
    rec = Reconstruction(
        project_id=project_id,
        point_cloud_path=pc_path,
        mesh_path="",
        num_points=num_points,
        num_faces=0
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    
    return {"id": rec.id, "point_cloud_path": pc_path, "num_points": num_points}

@router.post("/mesh", response_model=MeshData)
async def reconstruct_mesh(project_id: int = Form(...), depth_result_id: int = Form(...), db: AsyncSession = Depends(get_db)):
    import asyncio
    from fastapi import HTTPException
    res = await db.execute(select(DepthResult).filter(DepthResult.id == depth_result_id))
    depth = res.scalar_one_or_none()
    if not depth or not os.path.exists(depth.depth_map_path):
        raise HTTPException(status_code=404, detail="Depth result not found or depth map missing")
    
    res_img = await db.execute(select(ImageAsset).filter(ImageAsset.project_id == project_id).order_by(ImageAsset.id.desc()))
    img = res_img.scalars().first()
    if not img or not os.path.exists(img.filepath):
        raise HTTPException(status_code=404, detail="Original image asset not found for project")
    image_path = img.filepath
    
    try:
        mesh_path, num_faces = await asyncio.to_thread(generate_mesh, depth.depth_map_path, image_path)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Mesh generation failed: {str(e)}")
    
    res = await db.execute(select(Reconstruction).filter(Reconstruction.project_id == project_id).order_by(Reconstruction.id.desc()))
    rec = res.scalars().first()
    if rec:
        rec.mesh_path = mesh_path
        rec.num_faces = num_faces
    else:
        rec = Reconstruction(
            project_id=project_id,
            point_cloud_path="",
            mesh_path=mesh_path,
            num_points=0,
            num_faces=num_faces
        )
        db.add(rec)
    
    await db.commit()
    await db.refresh(rec)
    
    return {"id": rec.id, "mesh_path": mesh_path, "num_faces": num_faces}
