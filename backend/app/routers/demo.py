from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.demo_service import get_demo_data, generate_demo_image, generate_demo_bw_image
from app.services.depth_service import estimate_depth
from app.services.segmentation_service import segment_image
from app.services.calibration_service import calibrate_default
from app.services.height_service import estimate_heights
from app.services.reconstruction_service import generate_point_cloud, generate_mesh
from app.services.flythrough_service import generate_camera_path
from app.models.models import (
    Project, DepthResult, Calibration, HeightMeasurement, 
    Reconstruction, Flythrough, Report, ImageAsset
)
from app.config import settings
import os
import json

router = APIRouter(prefix="/demo", tags=["demo"])

@router.get("/")
async def get_demo():
    """Get pre-generated demo data for immediate display."""
    data = get_demo_data()
    return {
        "message": "Demo data generated",
        "image_path": data["image"].replace("\\", "/"),
        "bw_image_path": data["bw_image"].replace("\\", "/"),
        "depth_path": data["depth"].replace("\\", "/"),
        "segmentation_path": data["segmentation"].replace("\\", "/"),
        "model_available": settings.MODEL_AVAILABLE
    }

@router.post("/run")
async def run_demo(db: AsyncSession = Depends(get_db)):
    """Run complete demo pipeline end-to-end and persist relational data."""
    # 1. Create demo project
    project = Project(name="Demo Project", description="Auto-generated demo analysis", status="completed")
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    # 2. Generate demo images
    image_path = generate_demo_image()
    bw_path = generate_demo_bw_image()
    
    # Record ImageAsset
    img_asset = ImageAsset(
        project_id=project.id,
        filename=os.path.basename(image_path),
        original_filename="demo_satellite_nadir.png",
        filepath=image_path,
        file_size=os.path.getsize(image_path),
        width=512,
        height=512,
        channels=3,
        image_type="RGB"
    )
    db.add(img_asset)
    await db.commit()
    await db.refresh(img_asset)

    # 3. Run depth estimation
    depth_npy, min_d, max_d, mean_d, inf_time, model_used, is_demo = estimate_depth(image_path)
    
    depth_record = DepthResult(
        project_id=project.id,
        depth_map_path=depth_npy,
        min_depth=min_d,
        max_depth=max_d,
        mean_depth=mean_d,
        inference_time=inf_time,
        model_used=model_used,
        is_demo=is_demo
    )
    db.add(depth_record)
    await db.commit()
    await db.refresh(depth_record)

    # 4. Run segmentation (with depth features when available)
    seg_path, seg_labels = segment_image(image_path, depth_npy_path=depth_npy)
    
    # 5. Calibration
    scale_factor = calibrate_default(min_d, max_d)
    calib_record = Calibration(
        project_id=project.id,
        method="estimated",
        scale_factor=scale_factor,
        is_estimated=True
    )
    db.add(calib_record)
    await db.commit()
    await db.refresh(calib_record)

    # 6. Height estimation
    heights = estimate_heights(depth_npy, scale_factor)
    height_record = HeightMeasurement(
        project_id=project.id,
        depth_result_id=depth_record.id,
        min_height=heights["min_height"],
        max_height=heights["max_height"],
        mean_height=heights["mean_height"],
        building_heights_json=json.dumps(heights["buildings"]),
        confidence=heights["confidence"]
    )
    db.add(height_record)
    await db.commit()
    await db.refresh(height_record)

    # 7. 3D Point cloud & mesh reconstruction
    pc_path, num_points = generate_point_cloud(depth_npy, image_path)
    mesh_path, num_faces = generate_mesh(depth_npy, image_path)
    rec_record = Reconstruction(
        project_id=project.id,
        point_cloud_path=pc_path,
        mesh_path=mesh_path,
        num_points=num_points,
        num_faces=num_faces
    )
    db.add(rec_record)
    await db.commit()
    await db.refresh(rec_record)

    # 8. Flythrough path
    camera_path = generate_camera_path(num_points)
    fly_record = Flythrough(
        project_id=project.id,
        reconstruction_id=rec_record.id,
        path_json=json.dumps(camera_path),
        duration=30.0
    )
    db.add(fly_record)
    await db.commit()
    await db.refresh(fly_record)

    # 9. Intelligence Report
    report_data = {
        "project_name": project.name,
        "image": os.path.basename(image_path),
        "depth": {"min": min_d, "max": max_d, "mean": mean_d, "model": model_used},
        "heights": heights,
        "3d": {"points": num_points, "faces": num_faces},
        "flythrough": {"keyframes": len(camera_path), "duration": 30.0}
    }
    report_record = Report(
        project_id=project.id,
        report_data_json=json.dumps(report_data)
    )
    db.add(report_record)
    await db.commit()
    await db.refresh(report_record)

    # Get image URL paths for frontend
    base_name = os.path.basename(image_path).rsplit(".", 1)[0]
    
    return {
        "message": "Demo pipeline completed",
        "project_id": project.id,
        "image_url": f"/data/uploads/{os.path.basename(image_path)}",
        "bw_image_url": f"/data/uploads/{os.path.basename(bw_path)}",
        "depth_image_url": f"/data/outputs/{base_name}_depth.png",
        "depth_stats": {
            "min": min_d,
            "max": max_d,
            "mean": mean_d,
            "inference_time": inf_time,
            "model_used": model_used,
            "is_demo": is_demo
        },
        "segmentation": {
            "path": seg_path,
            "labels": seg_labels
        },
        "calibration": {
            "scale_factor": scale_factor,
            "method": "estimated",
            "is_estimated": True
        },
        "heights": heights,
        "reconstruction": {
            "point_cloud_path": pc_path,
            "mesh_path": mesh_path,
            "num_points": num_points,
            "num_faces": num_faces
        },
        "flythrough": {
            "path": camera_path,
            "duration": 30,
        },
        "model_available": settings.MODEL_AVAILABLE
    }
