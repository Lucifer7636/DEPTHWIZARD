import os
import sys
import numpy as np
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.utils.depth_processing import (
    normalize_depth,
    smooth_depth,
    remove_outliers,
    estimate_surface,
    estimate_height,
    generate_height_map,
)
from app.utils.image_utils import (
    resize_image,
    to_grayscale,
    is_grayscale,
)
from app.services.calibration_service import calibrate_default, calibrate
from app.services.flythrough_service import generate_camera_path
from app.services.demo_service import (
    generate_demo_image,
    generate_demo_bw_image,
    generate_demo_depth,
    generate_demo_segmentation,
    get_demo_data,
)
from app.schemas.schemas import CalibrationRequest


def test_normalize_depth():
    arr = np.array([[10.0, 20.0], [30.0, 40.0]], dtype=np.float32)
    norm = normalize_depth(arr)
    assert norm.min() == 0.0
    assert norm.max() == 1.0
    assert norm.shape == (2, 2)


def test_smooth_depth():
    arr = np.random.rand(50, 50).astype(np.float32)
    smoothed = smooth_depth(arr, kernel_size=5)
    assert smoothed.shape == (50, 50)
    assert not np.isnan(smoothed).any()


def test_remove_outliers():
    arr = np.ones((20, 20), dtype=np.float32) * 10.0
    arr[0, 0] = 1000.0  # extreme outlier
    arr[19, 19] = -500.0  # extreme outlier
    cleaned = remove_outliers(arr, percentile=2.0)
    assert cleaned.max() < 1000.0
    assert cleaned.min() > -500.0


def test_estimate_surface():
    arr = np.ones((30, 30), dtype=np.float32) * 5.0
    normals = estimate_surface(arr)
    assert normals.shape == (30, 30, 3)
    # Check that unit normal vectors have magnitude ~1
    magnitudes = np.linalg.norm(normals, axis=2)
    assert np.allclose(magnitudes, 1.0, atol=1e-3)


def test_generate_height_map():
    arr = np.linspace(0, 1, 100).reshape((10, 10)).astype(np.float32)
    colored = generate_height_map(arr)
    assert colored.shape == (10, 10, 3)
    assert colored.dtype == np.uint8


def test_image_utils():
    # Test RGB image
    rgb = np.zeros((100, 100, 3), dtype=np.uint8)
    rgb[:, :, 0] = 255  # pure red
    assert not is_grayscale(rgb)

    # Test B&W image
    bw = np.zeros((100, 100, 3), dtype=np.uint8)
    bw[:, :] = 128
    assert is_grayscale(bw)

    # Grayscale conversion
    gray = to_grayscale(rgb)
    assert gray.shape == (100, 100)

    # Resize
    large = np.zeros((2000, 1000, 3), dtype=np.uint8)
    resized = resize_image(large, max_size=512)
    assert max(resized.shape[:2]) <= 512


def test_calibration_service():
    scale = calibrate_default(0.0, 1.0)
    assert scale == 50.0

    # Reference height calibration
    req = CalibrationRequest(project_id=1, reference_height=45.0)
    scale_factor, method, is_estimated = calibrate(0.0, 1.0, req)
    assert scale_factor == 45.0
    assert method == "reference_object"
    assert not is_estimated

    # Camera telemetry calibration
    req_telemetry = CalibrationRequest(project_id=1, camera_altitude=500.0, focal_length=50.0)
    scale_factor, method, is_estimated = calibrate(0.0, 1.0, req_telemetry)
    assert scale_factor == 10.0
    assert method == "camera_intrinsic"


def test_flythrough_camera_path():
    path = generate_camera_path(num_points=1000, duration=15.0)
    assert len(path) > 0
    first_kf = path[0]
    assert "position" in first_kf
    assert "target" in first_kf
    assert "up" in first_kf
    assert "time" in first_kf
    assert len(first_kf["position"]) == 3
    assert len(first_kf["target"]) == 3


def test_demo_data_generation():
    img_path = generate_demo_image()
    assert os.path.exists(img_path)

    bw_path = generate_demo_bw_image()
    assert os.path.exists(bw_path)

    depth_path = generate_demo_depth()
    assert os.path.exists(depth_path)

    seg_path = generate_demo_segmentation()
    assert os.path.exists(seg_path)

    demo_data = get_demo_data()
    assert "image" in demo_data
    assert "bw_image" in demo_data
    assert "depth" in demo_data
    assert "segmentation" in demo_data
