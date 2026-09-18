import numpy as np
import cv2

def normalize_depth(depth_map: np.ndarray) -> np.ndarray:
    min_val = np.min(depth_map)
    max_val = np.max(depth_map)
    if max_val == min_val:
        return np.zeros_like(depth_map, dtype=np.float32)
    return ((depth_map - min_val) / (max_val - min_val)).astype(np.float32)

def smooth_depth(depth_map: np.ndarray, kernel_size: int = 5) -> np.ndarray:
    return cv2.GaussianBlur(depth_map, (kernel_size, kernel_size), 0)

def remove_outliers(depth_map: np.ndarray, percentile: float = 2.0) -> np.ndarray:
    lower = np.percentile(depth_map, percentile)
    upper = np.percentile(depth_map, 100 - percentile)
    cleaned = np.clip(depth_map, lower, upper)
    return cleaned

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

def generate_point_cloud(depth_map: np.ndarray, rgb_image: np.ndarray, fx: float, fy: float, cx: float, cy: float):
    h, w = depth_map.shape
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    z = depth_map
    x = (u - cx) * z / fx
    y = (v - cy) * z / fy
    points = np.stack((x, y, z), axis=-1).reshape(-1, 3)
    if rgb_image is not None:
        colors = rgb_image.reshape(-1, 3) / 255.0
    else:
        colors = np.zeros_like(points)
    return points, colors
