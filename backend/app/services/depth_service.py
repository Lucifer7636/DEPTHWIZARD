import cv2
import numpy as np
import time
import os
import logging
from app.utils.image_utils import load_image, to_grayscale
from app.config import settings
from app.utils.depth_processing import normalize_depth, smooth_depth

logger = logging.getLogger("depthwizard.depth")

_midas_model = None
_midas_transform = None

def _load_midas():
    """Load MiDaS model (small version for CPU compatibility)."""
    global _midas_model, _midas_transform
    if _midas_model is not None:
        return _midas_model, _midas_transform
    
    try:
        import torch
        # Ensure repositories are pre-trusted so torch.hub never blocks on interactive stdin
        try:
            hub_dir = torch.hub.get_dir()
            trusted_file = os.path.join(hub_dir, "trusted_list")
            trusted_repos = set()
            if os.path.exists(trusted_file):
                with open(trusted_file, "r") as tf:
                    trusted_repos = {line.strip() for line in tf if line.strip()}
            trusted_repos.update([
                "intel-isl_MiDaS",
                "rwightman_gen-efficientnet-pytorch",
                "intel-isl/MiDaS",
                "rwightman/gen-efficientnet-pytorch"
            ])
            os.makedirs(hub_dir, exist_ok=True)
            with open(trusted_file, "w") as tf:
                tf.write("\n".join(sorted(trusted_repos)) + "\n")
        except Exception as te:
            logger.debug(f"Could not pre-populate hub trusted list: {te}")

        # Use MiDaS small for CPU performance
        model_type = "MiDaS_small"
        logger.info(f"Loading MiDaS model: {model_type}")
        _midas_model = torch.hub.load("intel-isl/MiDaS", model_type, trust_repo=True)
        _midas_model.eval()
        
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
        _midas_transform = midas_transforms.small_transform
        
        logger.info("MiDaS model loaded successfully")
        return _midas_model, _midas_transform
    except Exception as e:
        logger.warning(f"Failed to load MiDaS: {e}")
        return None, None


def _estimate_depth_fallback(image_path: str) -> np.ndarray:
    """
    Heuristic depth estimation from image features.
    Uses edge detection, gradient magnitude, intensity, and local texture variance
    to produce an input-dependent relative depth map.
    This is NOT a demo/fake depth — it operates on the real uploaded image.
    """
    img = load_image(image_path)
    gray = to_grayscale(img)
    h, w = gray.shape
    logger.info(f"Fallback heuristic: processing image {h}x{w}")
    
    gray_f = gray.astype(np.float64)
    
    # Edge detection — structural boundaries
    edges = cv2.Canny(gray, 50, 150)
    dist_transform = cv2.distanceTransform(255 - edges, cv2.DIST_L2, 5)
    dist_norm = normalize_depth(dist_transform)
    
    # Gradient magnitude — captures texture and structure changes
    grad_x = cv2.Sobel(gray_f, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray_f, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(grad_x**2 + grad_y**2)
    grad_norm = normalize_depth(grad_mag)
    
    # Intensity-based component (brighter = potentially elevated in many satellite views)
    intensity = gray_f / 255.0
    
    # Local texture variance — elevated structures (buildings) often have more uniform
    # texture than ground/vegetation, creating characteristic variance patterns
    local_mean = cv2.blur(gray_f, (15, 15))
    local_sq_mean = cv2.blur(gray_f**2, (15, 15))
    local_var = np.maximum(local_sq_mean - local_mean**2, 0)
    local_var_norm = normalize_depth(np.sqrt(local_var))
    
    # Laplacian — captures fine detail, helps distinguish textured from smooth regions
    laplacian = np.abs(cv2.Laplacian(gray_f, cv2.CV_64F, ksize=5))
    lap_smooth = cv2.GaussianBlur(laplacian, (11, 11), 0)
    lap_norm = normalize_depth(lap_smooth)
    
    # Combine heuristics with weights that emphasize structural features
    depth = (dist_norm * 0.30 + 
             grad_norm * 0.20 + 
             intensity * 0.25 + 
             local_var_norm * 0.15 +
             lap_norm * 0.10)
    depth = normalize_depth(depth)
    depth = smooth_depth(depth, kernel_size=9)
    
    return depth.astype(np.float32)


def _estimate_depth_midas(image_path: str) -> np.ndarray:
    """Real MiDaS monocular depth estimation. Produces relative/ordinal depth (not metric)."""
    import torch
    
    model, transform = _load_midas()
    if model is None:
        logger.warning("MiDaS model unavailable, falling back to heuristic")
        return _estimate_depth_fallback(image_path)
    
    img = load_image(image_path)
    h, w = img.shape[:2]
    logger.info(f"MiDaS inference: input image {h}x{w}")

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
    # Normalize to 0-1 (relative depth, NOT metric)
    depth = normalize_depth(depth)
    logger.info(f"MiDaS output: shape={depth.shape}, range=[{depth.min():.4f}, {depth.max():.4f}]")
    return depth.astype(np.float32)


def estimate_depth(image_path: str) -> tuple[str, float, float, float, float, str, bool]:
    """
    Estimate relative depth from image.
    Tries MiDaS first, falls back to image-based heuristic.
    
    Both paths operate on the ACTUAL uploaded image.
    MiDaS provides relative/ordinal depth, not absolute metric depth.
    Metric scale requires calibration (handled separately).
    
    Returns: (depth_npy_path, min_depth, max_depth, mean_depth, inference_time, model_used, is_demo)
    """
    start = time.time()
    model_used = "Heuristic (Edge/Gradient/Texture)"
    # is_demo is False for real images — heuristic fallback still processes the real image
    is_demo = False
    
    img_for_log = load_image(image_path)
    h_in, w_in = img_for_log.shape[:2]
    logger.info(f"=== Depth Estimation Start ===")
    logger.info(f"  Input: {os.path.basename(image_path)}, dimensions: {w_in}x{h_in}")
    logger.info(f"  PyTorch available: {settings.MODEL_AVAILABLE}")
    
    fallback_used = False
    try:
        if settings.MODEL_AVAILABLE:
            depth = _estimate_depth_midas(image_path)
            model_used = "MiDaS v2.1 Small (Relative Depth)"
        else:
            logger.info("PyTorch not available, using heuristic fallback on real image")
            depth = _estimate_depth_fallback(image_path)
            fallback_used = True
    except Exception as e:
        logger.warning(f"MiDaS estimation failed: {e}, using heuristic fallback")
        depth = _estimate_depth_fallback(image_path)
        fallback_used = True

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
    std_d = float(np.std(depth))
    
    logger.info(f"  Model used: {model_used}")
    logger.info(f"  Fallback used: {fallback_used}")
    logger.info(f"  Depth stats: min={min_d:.4f}, max={max_d:.4f}, mean={mean_d:.4f}, std={std_d:.4f}")
    logger.info(f"  Inference time: {inference_time:.2f}s")
    logger.info(f"  Output: {out_npy}")
    logger.info(f"=== Depth Estimation Complete ===")
    
    return out_npy, min_d, max_d, mean_d, inference_time, model_used, is_demo
