import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "DepthWizard" in data["message"]


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model_available" in data


def test_demo_get_endpoint(client):
    response = client.get("/api/v1/demo/")
    assert response.status_code == 200
    data = response.json()
    assert "image_path" in data
    assert "depth_path" in data
    assert "segmentation_path" in data


def test_projects_crud(client):
    # Create project
    create_res = client.post("/api/v1/projects/", json={"name": "Test Aerial Analysis", "description": "SIH Verification"})
    assert create_res.status_code == 200
    proj_data = create_res.json()
    assert proj_data["name"] == "Test Aerial Analysis"
    proj_id = proj_data["id"]

    # List projects
    list_res = client.get("/api/v1/projects/")
    assert list_res.status_code == 200
    projects = list_res.json()
    assert any(p["id"] == proj_id for p in projects)

    # Get single project
    get_res = client.get(f"/api/v1/projects/{proj_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Test Aerial Analysis"


def test_demo_run_pipeline_end_to_end(client):
    # End-to-end full pipeline execution
    response = client.post("/api/v1/demo/run")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Demo pipeline completed"
    assert "project_id" in data
    assert "image_url" in data
    assert "depth_image_url" in data
    assert "depth_stats" in data
    assert "heights" in data
    assert "reconstruction" in data
    assert "flythrough" in data

    # Verify depth statistics
    assert "min" in data["depth_stats"]
    assert "max" in data["depth_stats"]
    assert "mean" in data["depth_stats"]

    # Verify height measurements
    assert "min_height" in data["heights"]
    assert "max_height" in data["heights"]
    assert "buildings" in data["heights"]

    # Verify 3D reconstruction outputs
    assert "point_cloud_path" in data["reconstruction"]
    assert "mesh_path" in data["reconstruction"]
    assert data["reconstruction"]["num_points"] > 0
    assert data["reconstruction"]["num_faces"] > 0

    # Verify camera flight path
    assert "path" in data["flythrough"]
    assert len(data["flythrough"]["path"]) > 0


def test_calibration_endpoint(client):
    # Calibration with reference height
    res = client.post("/api/v1/calibrate/", json={"project_id": 1, "reference_height": 35.0})
    assert res.status_code == 200
    data = res.json()
    assert "scale_factor" in data


def test_flythrough_render_endpoint(client):
    res = client.post("/api/v1/flythrough/render")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "export_formats" in data
