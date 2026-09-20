import cv2
import numpy as np
import logging
from app.utils.image_utils import load_image, to_grayscale
import os
from app.config import settings

logger = logging.getLogger("depthwizard.segmentation")


def segment_image(image_path: str, depth_npy_path: str = None) -> tuple[str, str]:
    """
    Structural boundary and region segmentation.
    
    Uses image features, edges, and optionally depth data to identify
    structural boundaries and classify regions. This is approximate
    segmentation — it does NOT claim perfect semantic segmentation.
    
    Classes:
        0 = ground/flat region
        1 = elevated structure (potential building)
        2 = textured region (potential vegetation)
    
    These are approximate structural categories, not definitive semantic labels.
    """
    img = load_image(image_path)
    gray = to_grayscale(img)
    h, w = gray.shape
    logger.info(f"Segmentation: processing {w}x{h} image")
    
    gray_f = gray.astype(np.float64)
    
    # --- Image-based features ---
    
    # Edge detection for structural boundaries
    edges = cv2.Canny(gray, 50, 150)
    
    # Otsu threshold — basic bright/dark separation
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Local texture variance — smooth (buildings/roads) vs textured (vegetation)
    local_mean = cv2.blur(gray_f, (11, 11))
    local_sq_mean = cv2.blur(gray_f ** 2, (11, 11))
    local_var = np.maximum(local_sq_mean - local_mean ** 2, 0)
    texture = np.sqrt(local_var)
    
    # Green channel analysis (if RGB) — vegetation signal
    green_signal = np.zeros_like(gray_f)
    if len(img.shape) == 3 and img.shape[2] >= 3:
        r, g, b = img[:, :, 0].astype(float), img[:, :, 1].astype(float), img[:, :, 2].astype(float)
        # Excess Green Index: 2*G - R - B (positive for vegetation)
        total = r + g + b + 1e-8
        egi = (2 * g - r - b) / total
        green_signal = np.clip(egi, 0, 1)
    
    # --- Depth-based features (if depth map available) ---
    depth_elevation = np.zeros_like(gray_f)
    depth_edges = np.zeros_like(gray_f)
    has_depth = False
    
    if depth_npy_path and os.path.exists(depth_npy_path):
        try:
            depth = np.load(depth_npy_path).astype(np.float64)
            if depth.shape[:2] != (h, w):
                depth = cv2.resize(depth, (w, h), interpolation=cv2.INTER_LINEAR)
            
            has_depth = True
            
            # Depth gradient — identifies structural boundaries (building edges)
            dx = cv2.Sobel(depth, cv2.CV_64F, 1, 0, ksize=3)
            dy = cv2.Sobel(depth, cv2.CV_64F, 0, 1, ksize=3)
            depth_grad = np.sqrt(dx**2 + dy**2)
            depth_edges = cv2.normalize(depth_grad, None, 0, 1, cv2.NORM_MINMAX).astype(np.float64)
            
            # Relative elevation (higher depth = potentially elevated structure)
            # This is a SUPPORTING signal, not a definitive classification
            depth_mean = np.mean(depth)
            depth_std = np.std(depth) + 1e-8
            depth_elevation = np.clip((depth - depth_mean) / (3 * depth_std) + 0.5, 0, 1)
            
            logger.info(f"  Depth features incorporated (range: {depth.min():.3f}-{depth.max():.3f})")
        except Exception as e:
            logger.warning(f"  Could not load depth for segmentation: {e}")
    
    # --- Combine features into approximate classification ---
    labels = np.zeros((h, w), dtype=np.uint8)
    
    # Morphological cleaning of threshold
    kernel = np.ones((5, 5), np.uint8)
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    morph_open = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel)
    
    # Texture threshold — high texture variance suggests vegetation
    texture_thresh = np.percentile(texture, 70) if np.max(texture) > 0 else 30
    high_texture = texture > texture_thresh
    
    # Elevated structure detection (approximate — NOT definitive)
    if has_depth:
        # Use depth elevation as a supporting signal combined with image features
        # A region is LIKELY elevated if it has:
        # - Above-average depth AND relatively uniform texture (not vegetation)
        # - OR Otsu-thresholded as foreground AND not high-texture vegetation
        elevated_depth = depth_elevation > 0.6  # Above ~1 std above mean
        low_texture = texture < texture_thresh
        low_green = green_signal < 0.15
        
        # Building-like: elevated + relatively smooth + not green
        building_signal = elevated_depth & low_texture & low_green
        # Also include Otsu foreground that's not green/textured as supporting evidence
        building_from_image = (morph_open == 255) & low_green & low_texture
        building_combined = building_signal | building_from_image
        
        # Clean with morphology
        building_mask = cv2.morphologyEx(building_combined.astype(np.uint8) * 255, cv2.MORPH_CLOSE, kernel)
        building_mask = cv2.morphologyEx(building_mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        labels[building_mask > 0] = 1
        
        # Vegetation: high texture OR strong green signal, NOT elevated
        veg_signal = (high_texture | (green_signal > 0.1)) & ~elevated_depth
        veg_mask = cv2.morphologyEx(veg_signal.astype(np.uint8) * 255, cv2.MORPH_CLOSE, kernel)
        labels[(veg_mask > 0) & (labels == 0)] = 2
    else:
        # Without depth, use image features only (less reliable)
        low_green = green_signal < 0.15
        
        # Potential structures: Otsu foreground, low texture, not green
        labels[(morph_open == 255) & (texture < texture_thresh) & low_green] = 1
        
        # Potential vegetation: high texture or green
        labels[((high_texture) | (green_signal > 0.1)) & (labels == 0)] = 2
        
        # Edge-adjacent non-building regions as vegetation (from original logic)
        labels[(morph == 0) & (edges > 0) & (labels == 0)] = 2
    
    # Count regions
    n_building = int(np.sum(labels == 1))
    n_vegetation = int(np.sum(labels == 2))
    n_ground = int(np.sum(labels == 0))
    total_px = h * w
    logger.info(f"  Classification: ground={n_ground/total_px:.1%}, "
                f"elevated={n_building/total_px:.1%}, "
                f"textured={n_vegetation/total_px:.1%}")
    
    # Save outputs
    out_dir = settings.OUTPUT_DIR
    base = os.path.basename(image_path).rsplit(".", 1)[0]
    
    npy_path = os.path.join(out_dir, f"{base}_segmentation.npy")
    np.save(npy_path, labels)
    
    img_path = os.path.join(out_dir, f"{base}_segmentation.png")
    colored = np.zeros((*labels.shape, 3), dtype=np.uint8)
    colored[labels == 1] = [0, 0, 255]  # Red buildings
    colored[labels == 2] = [0, 255, 0]  # Green vegetation
    cv2.imwrite(img_path, colored)
    
    method = "Structural Boundary Detection"
    if has_depth:
        method += " (with depth features)"
    else:
        method += " (image features only)"
    
    return npy_path, method
