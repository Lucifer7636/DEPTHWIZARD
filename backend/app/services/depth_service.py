import cv2
import numpy as np
import time
import os
from app.utils.image_utils import load_image, to_grayscale
from app.config import settings
from app.utils.depth_processing import normalize_depth, smooth_depth

_midas_model = None
_midas_transform = None

def _load_midas():
    """Load MiDaS model (small version for CPU compatibility)."""
    global _midas_model, _midas_transform
    if _midas_model is not None:
        return _midas_model, _midas_transform
    
    try:
        import torch
        # Use MiDaS small for CPU performance
        model_type = "MiDaS_small"
        _midas_model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
        _midas_model.eval()
        
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
        _midas_transform = midas_transforms.small_transform
        
        return _midas_model, _midas_transform
    except Exception as e:
        print(f"Failed to load MiDaS: {e}")
        return None, None


def _estimate_depth_fallback(image_path: str) -> np.ndarray:
    """Heuristic depth estimation from edges and gradients (demo fallback)."""
    img = load_image(image_path)
    gray = to_grayscale(img)
    h, w = gray.shape
    
    # Edge detection
    edges = cv2.Canny(gray, 50, 150)
    dist_transform = cv2.distanceTransform(255 - edges, cv2.DIST_L2, 5)
    dist_norm = normalize_depth(dist_transform)
    
    # Gradient magnitude
    grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(grad_x**2 + grad_y**2)
    grad_norm = normalize_depth(grad_mag)
    
    # Intensity-based component (brighter = closer in many satellite views)
    intensity = gray.astype(np.float64) / 255.0
    
    # Combine heuristics
    depth = dist_norm * 0.4 + grad_norm * 0.3 + intensity * 0.3
    depth = normalize_depth(depth)
    depth = smooth_depth(depth, kernel_size=11)
    
    return depth.astype(np.float32)


def _estimate_depth_midas(image_path: str) -> np.ndarray:
    """Real MiDaS depth estimation."""
    import torch
    
    model, transform = _load_midas()
    if model is None:
        return _estimate_depth_fallback(image_path)
    
    img = load_image(image_path)

    
    # Apply MiDaS transform
    input_batch = transform(img)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    input_batch = input_batch.to(device)
    
    with torch.no_grad():
        prediction = model(input_batch)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()
    
    depth = prediction.cpu().numpy()
    # Normalize to 0-1
    depth = normalize_depth(depth)
    return depth.astype(np.float32)


def estimate_depth(image_path: str) -> tuple[str, float, float, float, float, str, bool]:
    """
    Estimate depth from image. Tries MiDaS first, falls back to heuristic.
    Returns: (depth_npy_path, min_depth, max_depth, mean_depth, inference_time, model_used, is_demo)
    """
    start = time.time()
    model_used = "Fallback Heuristic"
    is_demo = True
    
    try:
        if settings.MODEL_AVAILABLE:
            depth = _estimate_depth_midas(image_path)
            model_used = "MiDaS (DPT Small)"
            is_demo = False
        else:
            depth = _estimate_depth_fallback(image_path)
    except Exception as e:
        print(f"MiDaS estimation failed: {e}, using fallback")
        depth = _estimate_depth_fallback(image_path)

    inference_time = time.time() - start
    
    # Save depth map
    out_dir = settings.OUTPUT_DIR
    base = os.path.basename(image_path).rsplit(".", 1)[0]
    
    out_npy = os.path.join(out_dir, f"{base}_depth.npy")
    np.save(out_npy, depth)
    
    # Save colored depth image for visualization
    out_img_path = os.path.join(out_dir, f"{base}_depth.png")
    depth_colored = cv2.applyColorMap(
        (depth * 255).astype(np.uint8), cv2.COLORMAP_TURBO
    )
    cv2.imwrite(out_img_path, depth_colored)
    
    # Save grayscale depth image
    out_gray_path = os.path.join(out_dir, f"{base}_depth_gray.png")
    cv2.imwrite(out_gray_path, (depth * 255).astype(np.uint8))
    
    min_d = float(np.min(depth))
    max_d = float(np.max(depth))
    mean_d = float(np.mean(depth))
    
    return out_npy, min_d, max_d, mean_d, inference_time, model_used, is_demo
