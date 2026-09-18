from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ImageResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    original_filename: str
    filepath: str
    file_size: int
    width: int
    height: int
    channels: int
    image_type: str
    upload_time: datetime

    class Config:
        from_attributes = True

class JobResponse(BaseModel):
    id: int
    project_id: int
    image_id: int
    status: str
    progress: int
    current_stage: Optional[str]
    message: Optional[str]
    result_json: Optional[str]

    class Config:
        from_attributes = True

class DepthEstimateResponse(BaseModel):
    id: int
    depth_map_path: str
    min_depth: float
    max_depth: float
    mean_depth: float
    inference_time: float
    model_used: str

    class Config:
        from_attributes = True

class CalibrationRequest(BaseModel):
    project_id: int
    reference_height: Optional[float] = None
    focal_length: Optional[float] = None
    camera_altitude: Optional[float] = None
    fov: Optional[float] = None

class CalibrationResponse(BaseModel):
    id: int
    scale_factor: float
    is_estimated: bool

    class Config:
        from_attributes = True

class HeightResponse(BaseModel):
    id: int
    min_height: float
    max_height: float
    mean_height: float
    building_heights: List[Dict[str, Any]]
    confidence: float

    class Config:
        from_attributes = True

class PointCloudData(BaseModel):
    id: int
    point_cloud_path: str
    num_points: int

    class Config:
        from_attributes = True

class MeshData(BaseModel):
    id: int
    mesh_path: str
    num_faces: int

    class Config:
        from_attributes = True

class FlythroughPathResponse(BaseModel):
    id: int
    path_points: List[Dict[str, Any]]
    duration: float

class ReportResponse(BaseModel):
    id: int
    project_id: int
    report_data: Dict[str, Any]

class HealthResponse(BaseModel):
    status: str
    model_available: bool

class DemoResponse(BaseModel):
    message: str
    project_id: int
