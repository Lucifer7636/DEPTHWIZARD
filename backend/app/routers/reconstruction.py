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
    res = await db.execute(select(DepthResult).filter(DepthResult.id == depth_result_id))
    depth = res.scalar_one_or_none()
    
    res_img = await db.execute(select(ImageAsset).filter(ImageAsset.project_id == project_id).order_by(ImageAsset.id.desc()))
    img = res_img.scalars().first()
    image_path = img.filepath if (img and os.path.exists(img.filepath)) else (depth.depth_map_path.replace("_depth.npy", ".png") if depth else "")
    
    pc_path, num_points = generate_point_cloud(depth.depth_map_path, image_path)
    
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
    res = await db.execute(select(DepthResult).filter(DepthResult.id == depth_result_id))
    depth = res.scalar_one_or_none()
    
    res_img = await db.execute(select(ImageAsset).filter(ImageAsset.project_id == project_id).order_by(ImageAsset.id.desc()))
    img = res_img.scalars().first()
    image_path = img.filepath if (img and os.path.exists(img.filepath)) else (depth.depth_map_path.replace("_depth.npy", ".png") if depth else "")
    
    mesh_path, num_faces = generate_mesh(depth.depth_map_path, image_path)
    
    res = await db.execute(select(Reconstruction).filter(Reconstruction.project_id == project_id))
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
