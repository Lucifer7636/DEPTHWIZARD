from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="created")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ImageAsset(Base):
    __tablename__ = "image_assets"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String)
    original_filename = Column(String)
    filepath = Column(String)
    file_size = Column(Integer)
    width = Column(Integer)
    height = Column(Integer)
    channels = Column(Integer)
    image_type = Column(String)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    image_id = Column(Integer, ForeignKey("image_assets.id"))
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    current_stage = Column(String)
    message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    result_json = Column(Text, nullable=True)

class DepthResult(Base):
    __tablename__ = "depth_results"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("processing_jobs.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    depth_map_path = Column(String)
    min_depth = Column(Float)
    max_depth = Column(Float)
    mean_depth = Column(Float)
    inference_time = Column(Float)
    model_used = Column(String)
    is_demo = Column(Boolean, default=False)

class Calibration(Base):
    __tablename__ = "calibrations"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    method = Column(String)
    reference_height = Column(Float, nullable=True)
    focal_length = Column(Float, nullable=True)
    camera_altitude = Column(Float, nullable=True)
    fov = Column(Float, nullable=True)
    scale_factor = Column(Float)
    is_estimated = Column(Boolean, default=True)

class HeightMeasurement(Base):
    __tablename__ = "height_measurements"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    depth_result_id = Column(Integer, ForeignKey("depth_results.id"))
    min_height = Column(Float)
    max_height = Column(Float)
    mean_height = Column(Float)
    building_heights_json = Column(Text)
    confidence = Column(Float)

class Reconstruction(Base):
    __tablename__ = "reconstructions"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    point_cloud_path = Column(String)
    mesh_path = Column(String)
    num_points = Column(Integer)
    num_faces = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Flythrough(Base):
    __tablename__ = "flythroughs"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    reconstruction_id = Column(Integer, ForeignKey("reconstructions.id"))
    path_json = Column(Text)
    duration = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    report_data_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
