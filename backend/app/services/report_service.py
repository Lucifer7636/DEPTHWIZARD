import json
import csv
from io import StringIO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Project, ImageAsset, DepthResult, Calibration, HeightMeasurement

async def generate_report(db: AsyncSession, project_id: int):
    # Fetch all data related to project
    res = await db.execute(select(Project).filter(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        return None
        
    res = await db.execute(select(ImageAsset).filter(ImageAsset.project_id == project_id).order_by(ImageAsset.id.desc()))
    image = res.scalars().first()
    
    res = await db.execute(select(DepthResult).filter(DepthResult.project_id == project_id).order_by(DepthResult.id.desc()))
    depth = res.scalars().first()
    
    res = await db.execute(select(Calibration).filter(Calibration.project_id == project_id).order_by(Calibration.id.desc()))
    calibration = res.scalars().first()
    
    res = await db.execute(select(HeightMeasurement).filter(HeightMeasurement.project_id == project_id).order_by(HeightMeasurement.id.desc()))
    height = res.scalars().first()
    
    report_data = {
        "project_name": project.name,
        "image_file": image.filename if image else None,
        "depth_stats": {
            "min": depth.min_depth if depth else 0,
            "max": depth.max_depth if depth else 0,
            "mean": depth.mean_depth if depth else 0
        } if depth else None,
        "calibration": {
            "scale_factor": calibration.scale_factor if calibration else 1.0
        } if calibration else None,
        "height_stats": {
            "min_height": height.min_height if height else 0,
            "max_height": height.max_height if height else 0,
            "mean_height": height.mean_height if height else 0,
            "buildings": json.loads(height.building_heights_json) if height and height.building_heights_json else []
        } if height else None
    }
    return report_data

async def export_json(db: AsyncSession, project_id: int):
    data = await generate_report(db, project_id)
    return json.dumps(data, indent=2)

async def export_csv(db: AsyncSession, project_id: int):
    data = await generate_report(db, project_id)
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Building ID", "Min Height", "Max Height", "Mean Height", "Area"])
    if data and data.get("height_stats") and data["height_stats"].get("buildings"):
        for b in data["height_stats"]["buildings"]:
            writer.writerow([b.get("id"), b.get("min"), b.get("max"), b.get("mean"), b.get("area")])
    return output.getvalue()
