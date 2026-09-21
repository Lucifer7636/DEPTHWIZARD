import numpy as np
import cv2

def normalize_depth(depth_map: np.ndarray, p_low: float = 2.0, p_high: float = 98.0) -> np.ndarray:
    """
    Robust percentile-based depth normalization.
    Eliminates extreme pixel spikes and guarantees range in [0, 1].
    """
    cleaned = np.nan_to_num(depth_map.astype(np.float32), nan=0.0, posinf=1.0, neginf=0.0)
    if cleaned.size == 0:
        return cleaned

    p2 = float(np.percentile(cleaned, p_low))
    p98 = float(np.percentile(cleaned, p_high))

    if p98 <= p2:
        min_v = float(np.min(cleaned))
        max_v = float(np.max(cleaned))
        if max_v > min_v:
            return ((cleaned - min_v) / (max_v - min_v)).astype(np.float32)
        return np.zeros_like(cleaned, dtype=np.float32)

    clipped = np.clip(cleaned, p2, p98)
    normalized = (clipped - p2) / (p98 - p2)
    return normalized.astype(np.float32)

def clean_depth(depth_map: np.ndarray) -> np.ndarray:
    """
    Conservative edge-preserving smoothing and spike removal.
    Smooths flat terrain/roofs without blurring sharp building boundaries.
    """
    depth_f = normalize_depth(depth_map)

    # 1. Remove isolated single-pixel spikes using median difference clamping
    med = cv2.medianBlur((depth_f * 255).astype(np.uint8), 3).astype(np.float32) / 255.0
    diff = np.abs(depth_f - med)
    spike_thresh = max(float(np.percentile(diff, 98)) * 1.5, 0.04)
    de_spiked = np.where(diff > spike_thresh, med, depth_f)

    # 2. Edge-preserving bilateral filter
    # Preserves building cliffs while ironing out noisy micro-fluctuations
    smoothed = cv2.bilateralFilter(de_spiked.astype(np.float32), d=5, sigmaColor=0.08, sigmaSpace=4.0)

    # 3. Multi-scale terrain + structural stabilization
    # Base terrain (low frequency) + crisp structures (high frequency)
    terrain_base = cv2.GaussianBlur(smoothed, (25, 25), 0)
    structure_residual = smoothed - terrain_base
    stabilized = terrain_base + structure_residual * 1.05

    return normalize_depth(stabilized)

def smooth_depth(depth_map: np.ndarray, kernel_size: int = 5) -> np.ndarray:
    return cv2.GaussianBlur(depth_map, (kernel_size, kernel_size), 0)

def remove_outliers(depth_map: np.ndarray, percentile: float = 2.0) -> np.ndarray:
    lower = np.percentile(depth_map, percentile)
    upper = np.percentile(depth_map, 100 - percentile)
    return np.clip(depth_map, lower, upper).astype(np.float32)

def estimate_surface(depth_map: np.ndarray) -> np.ndarray:
    dzdx = cv2.Sobel(depth_map, cv2.CV_64F, 1, 0, ksize=3)
    dzdy = cv2.Sobel(depth_map, cv2.CV_64F, 0, 1, ksize=3)
    normal = np.dstack((-dzdx, -dzdy, np.ones_like(depth_map)))
    n = np.linalg.norm(normal, axis=2, keepdims=True)
    normal = normal / (n + 1e-8)
    return normal

def estimate_height(depth_map: np.ndarray, scale_factor: float) -> np.ndarray:
    return depth_map * scale_factor

def generate_height_map(depth_map: np.ndarray, colormap=cv2.COLORMAP_TURBO) -> np.ndarray:
    norm = normalize_depth(depth_map)
    norm_8u = (norm * 255).astype(np.uint8)
    colored = cv2.applyColorMap(norm_8u, colormap)
    return cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)

def generate_point_cloud(depth_map: np.ndarray, rgb_image: np.ndarray, fx: float = None, fy: float = None, cx: float = None, cy: float = None):
    """
    Generate planar orthographic point cloud preserving satellite image aspect ratio.
    """
    h, w = depth_map.shape
    aspect = w / max(h, 1)
    scene_width = aspect * 8.0
    scene_height = 8.0

    u_indices = np.linspace(-0.5, 0.5, w, dtype=np.float32) * scene_width
    v_indices = np.linspace(0.5, -0.5, h, dtype=np.float32) * scene_height
    x_grid, y_grid = np.meshgrid(u_indices, v_indices)

    norm_depth = normalize_depth(depth_map)
    z_grid = norm_depth * 2.2  # Bounded, natural visual vertical relief

    points = np.stack((x_grid, y_grid, z_grid), axis=-1).reshape(-1, 3)
    if rgb_image is not None:
        colors = (rgb_image.reshape(-1, 3) / 255.0).astype(np.float32)
    else:
        colors = np.ones_like(points, dtype=np.float32)
    return points, colors
