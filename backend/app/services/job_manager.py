import asyncio
import threading
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import ProcessingJob
from sqlalchemy import update
import json
from datetime import datetime

class JobManager:
    def __init__(self):
        self.jobs = {}

    def create_job(self, project_id: int, image_id: int) -> int:
        job_id = len(self.jobs) + 1
        self.jobs[job_id] = {
            "id": job_id,
            "project_id": project_id,
            "image_id": image_id,
            "status": "pending",
            "progress": 0,
            "current_stage": "initialized",
            "message": "Job created",
            "result_json": None
        }
        return job_id

    def update_job(self, job_id: int, status: str, progress: int, stage: str, message: str, result: dict = None):
        if job_id in self.jobs:
            self.jobs[job_id].update({
                "status": status,
                "progress": progress,
                "current_stage": stage,
                "message": message
            })
            if result:
                self.jobs[job_id]["result_json"] = json.dumps(result)

    def get_job(self, job_id: int) -> dict:
        return self.jobs.get(job_id)

    def run_pipeline(self, job_id: int, image_path: str):
        def pipeline_thread():
            try:
                self.update_job(job_id, "running", 10, "preprocessing", "Preprocessing image")
                import time
                time.sleep(1) # simulate work
                from app.services.depth_service import estimate_depth
                
                self.update_job(job_id, "running", 30, "depth_estimation", "Estimating depth")
                depth_res = estimate_depth(image_path)
                
                from app.services.segmentation_service import segment_image
                self.update_job(job_id, "running", 50, "segmentation", "Segmenting image")
                seg_res = segment_image(image_path, depth_npy_path=depth_res[0])
                
                from app.services.reconstruction_service import generate_point_cloud, generate_mesh
                self.update_job(job_id, "running", 70, "reconstruction", "Generating 3D models")
                generate_point_cloud(depth_res[0], image_path)
                generate_mesh(depth_res[0], image_path)
                
                self.update_job(job_id, "completed", 100, "finished", "Pipeline completed", {"depth_path": depth_res[0]})
            except Exception as e:
                self.update_job(job_id, "failed", 0, "error", str(e))

        t = threading.Thread(target=pipeline_thread)
        t.start()

job_manager = JobManager()
