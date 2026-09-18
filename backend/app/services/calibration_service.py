import numpy as np
from app.schemas.schemas import CalibrationRequest


def calibrate_default(min_depth: float, max_depth: float) -> float:
    """Estimate default scale factor mapping depth range to ~50m."""
    depth_range = max_depth - min_depth
    if depth_range > 0:
        return 50.0 / depth_range
    return 50.0


def calibrate(min_depth: float, max_depth: float, req: CalibrationRequest) -> tuple[float, str, bool]:
    """
    Calibrate depth to metric scale using reference information.
    Returns: (scale_factor, method, is_estimated)
    """
    if req.reference_height and req.reference_height > 0:
        if max_depth > 0:
            scale_factor = req.reference_height / max_depth
            return scale_factor, "reference_object", False

    if req.focal_length and req.camera_altitude:
        if req.focal_length > 0:
            scale_factor = req.camera_altitude / req.focal_length
            return scale_factor, "camera_intrinsic", False

    if req.fov and req.camera_altitude:
        # Use FOV-based estimation
        import math
        half_fov_rad = math.radians(req.fov / 2)
        ground_size = 2 * req.camera_altitude * math.tan(half_fov_rad)
        scale_factor = ground_size / max(max_depth, 0.001)
        return scale_factor, "fov_based", False

    # Default estimation
    return calibrate_default(min_depth, max_depth), "estimated", True
