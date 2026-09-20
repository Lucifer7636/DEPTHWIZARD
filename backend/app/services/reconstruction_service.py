import numpy as np
import os
import json
import logging
from app.config import settings
from app.utils.image_utils import load_image

logger = logging.getLogger("depthwizard.reconstruction")

# Z-axis amplification to make depth variations more visible in 3D
Z_AMPLIFICATION = 8.0


def generate_point_cloud(depth_map_path: str, image_path: str) -> tuple[str, int]:
    """
    Generate 3D point cloud from ACTUAL depth map + ORIGINAL uploaded image.
    
    Every point corresponds to a real pixel from the uploaded image.
    RGB colors come from the actual image, not from depth visualizations or demo data.
    """
    depth = np.load(depth_map_path)
    
    # Load the ORIGINAL image for RGB colors
    if image_path and os.path.exists(image_path):
        img = load_image(image_path)
        logger.info(f"Point cloud: using real image {os.path.basename(image_path)} "
                     f"({img.shape[1]}x{img.shape[0]})")
    else:
        logger.warning(f"Point cloud: image not found at {image_path}, using white fallback")
        img = np.ones((*depth.shape, 3), dtype=np.uint8) * 255

    # Ensure depth and image dimensions match
    if depth.shape[:2] != img.shape[:2]:
        logger.warning(f"Dimension mismatch: depth={depth.shape[:2]}, img={img.shape[:2]}. "
                       f"Resizing image to match depth.")
        import cv2
        img = cv2.resize(img, (depth.shape[1], depth.shape[0]), interpolation=cv2.INTER_AREA)

    # Downsample for browser performance (every 4th pixel)
    step = 4
    depth_ds = depth[::step, ::step]
    img_ds = img[::step, ::step]

    h, w = depth_ds.shape
    fx, fy = w, h
    cx, cy = w / 2, h / 2
    
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    z = depth_ds * Z_AMPLIFICATION
    x = (u - cx) * depth_ds / fx
    y = (v - cy) * depth_ds / fy
    
    points = np.stack((x, y, z), axis=-1).reshape(-1, 3)
    colors = img_ds.reshape(-1, 3) / 255.0
    
    # Compute bounding box for downstream use (flythrough)
    valid = z.reshape(-1) > 0.001
    if np.any(valid):
        bbox_min = points[valid].min(axis=0).tolist()
        bbox_max = points[valid].max(axis=0).tolist()
        center = ((np.array(bbox_min) + np.array(bbox_max)) / 2).tolist()
    else:
        bbox_min = points.min(axis=0).tolist()
        bbox_max = points.max(axis=0).tolist()
        center = ((np.array(bbox_min) + np.array(bbox_max)) / 2).tolist()
    
    out_dir = settings.OUTPUT_DIR
    base = os.path.basename(depth_map_path).rsplit("_", 1)[0]
    pc_path = os.path.join(out_dir, f"{base}_pointcloud.json")
    
    data = {
        "vertices": points.tolist(),
        "colors": colors.tolist(),
        "bbox_min": bbox_min,
        "bbox_max": bbox_max,
        "center": center
    }
    
    with open(pc_path, 'w') as f:
        json.dump(data, f)
    
    logger.info(f"Point cloud: {len(points)} points, "
                f"bbox=[{bbox_min[0]:.2f},{bbox_min[1]:.2f},{bbox_min[2]:.2f}] to "
                f"[{bbox_max[0]:.2f},{bbox_max[1]:.2f},{bbox_max[2]:.2f}]")
        
    return pc_path, len(points)


def generate_mesh(depth_map_path: str, image_path: str) -> tuple[str, int]:
    """
    Generate 3D mesh from ACTUAL depth map + ORIGINAL uploaded image.
    
    Includes depth-discontinuity protection: triangles are NOT created across
    strong depth boundaries (e.g., building edge to ground). This prevents
    unrealistic stretched triangles. No vertical walls or fake geometry are
    invented — only the actual depth surface is meshed.
    """
    depth = np.load(depth_map_path)
    
    if image_path and os.path.exists(image_path):
        img = load_image(image_path)
        logger.info(f"Mesh: using real image {os.path.basename(image_path)}")
    else:
        logger.warning(f"Mesh: image not found at {image_path}, using white fallback")
        img = np.ones((*depth.shape, 3), dtype=np.uint8) * 255
    
    # Ensure depth and image dimensions match
    if depth.shape[:2] != img.shape[:2]:
        import cv2
        img = cv2.resize(img, (depth.shape[1], depth.shape[0]), interpolation=cv2.INTER_AREA)
        
    step = 8
    depth_ds = depth[::step, ::step]
    img_ds = img[::step, ::step]
    
    h, w = depth_ds.shape
    fx, fy = w, h
    cx, cy = w / 2, h / 2
    
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    z = depth_ds * Z_AMPLIFICATION
    x = (u - cx) * depth_ds / fx
    y = (v - cy) * depth_ds / fy
    
    vertices = np.stack((x, y, z), axis=-1).reshape(-1, 3)
    colors = img_ds.reshape(-1, 3) / 255.0
    
    # --- Depth discontinuity protection ---
    # Compute a threshold: skip faces where any edge has a depth jump
    # larger than N times the median local depth difference.
    depth_flat = z.flatten()
    
    # Horizontal and vertical depth differences
    dh = np.abs(np.diff(z, axis=1))
    dv = np.abs(np.diff(z, axis=0))
    median_step = max(float(np.median(dh[dh > 0])) if np.any(dh > 0) else 0.01,
                      float(np.median(dv[dv > 0])) if np.any(dv > 0) else 0.01)
    discontinuity_threshold = median_step * 5.0  # Allow 5x median step
    
    logger.info(f"Mesh: median depth step={median_step:.4f}, "
                f"discontinuity threshold={discontinuity_threshold:.4f}")
    
    faces = []
    skipped = 0
    for i in range(h - 1):
        for j in range(w - 1):
            idx = i * w + j
            # Four vertices of the grid cell
            z_tl = depth_flat[idx]           # top-left
            z_bl = depth_flat[idx + w]       # bottom-left
            z_tr = depth_flat[idx + 1]       # top-right
            z_br = depth_flat[idx + w + 1]   # bottom-right
            
            # Triangle 1: top-left, bottom-left, top-right
            max_diff_1 = max(abs(z_tl - z_bl), abs(z_tl - z_tr), abs(z_bl - z_tr))
            if max_diff_1 <= discontinuity_threshold:
                faces.append([idx, idx + w, idx + 1])
            else:
                skipped += 1
            
            # Triangle 2: top-right, bottom-left, bottom-right
            max_diff_2 = max(abs(z_tr - z_bl), abs(z_tr - z_br), abs(z_bl - z_br))
            if max_diff_2 <= discontinuity_threshold:
                faces.append([idx + 1, idx + w, idx + w + 1])
            else:
                skipped += 1
    
    logger.info(f"Mesh: {len(faces)} faces created, {skipped} faces skipped "
                f"(depth discontinuity protection)")
            
    out_dir = settings.OUTPUT_DIR
    base = os.path.basename(depth_map_path).rsplit("_", 1)[0]
    mesh_path = os.path.join(out_dir, f"{base}_mesh.json")
    
    data = {
        "vertices": vertices.tolist(),
        "colors": colors.tolist(),
        "faces": faces
    }
    
    with open(mesh_path, 'w') as f:
        json.dump(data, f)
        
    return mesh_path, len(faces)
