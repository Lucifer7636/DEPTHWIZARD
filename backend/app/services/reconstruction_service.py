import numpy as np
import os
import json
import logging
import cv2
from app.config import settings
from app.utils.image_utils import load_image
from app.utils.depth_processing import normalize_depth, clean_depth

logger = logging.getLogger("depthwizard.reconstruction")

# Base planar scene dimensions in Three.js world units
SCENE_BASE_SCALE = 8.0
# Moderate vertical elevation scale (relative height relative to scene base)
DEFAULT_Z_SCALE = 2.2


def generate_point_cloud(depth_map_path: str, image_path: str) -> tuple[str, int]:
    """
    Generate 3D point cloud from ACTUAL depth map + ORIGINAL uploaded image.
    
    Coordinate System (Step 1):
    X depends on pixel column (scaled by scene aspect ratio, centered at 0).
    Y depends on pixel row (scaled by scene height, centered at 0).
    Z depends on processed relative elevation (NO funnel/pinching).
    
    Colors (Step 7 & 8):
    RGB values come strictly from the original uploaded image:
    point[y,x].RGB == original_image[y,x].RGB / 255.0
    """
    raw_depth = np.load(depth_map_path)
    depth = clean_depth(raw_depth)
    
    # Load the ORIGINAL image for RGB colors
    if image_path and os.path.exists(image_path):
        img = load_image(image_path)
        logger.info(f"Point cloud: using real image {os.path.basename(image_path)} ({img.shape[1]}x{img.shape[0]})")
    else:
        logger.warning(f"Point cloud: image not found at {image_path}, using neutral fallback")
        img = np.ones((*depth.shape, 3), dtype=np.uint8) * 200

    # Ensure depth and image dimensions match
    if depth.shape[:2] != img.shape[:2]:
        img = cv2.resize(img, (depth.shape[1], depth.shape[0]), interpolation=cv2.INTER_AREA)

    # Downsample for browser performance (step=4 for dense, responsive point cloud)
    step = 4
    depth_ds = depth[::step, ::step]
    img_ds = img[::step, ::step]

    h, w = depth_ds.shape
    aspect = float(w) / max(float(h), 1.0)
    scene_width = aspect * SCENE_BASE_SCALE
    scene_height = SCENE_BASE_SCALE

    # Step 1: True planar orthographic grid preserving satellite aspect ratio
    u_norm = np.linspace(-0.5, 0.5, w, dtype=np.float32) * scene_width
    v_norm = np.linspace(0.5, -0.5, h, dtype=np.float32) * scene_height
    x_grid, y_grid = np.meshgrid(u_norm, v_norm)

    # Step 5: Bounded relative elevation
    z_grid = (depth_ds * DEFAULT_Z_SCALE).astype(np.float32)

    points = np.stack((x_grid, y_grid, z_grid), axis=-1).reshape(-1, 3)
    # Step 7 & 8: Real satellite RGB colors
    colors = (img_ds.reshape(-1, 3) / 255.0).astype(np.float32)

    # Step 10: Accurate scene bounding box and radius
    bbox_min = [float(np.min(points[:, 0])), float(np.min(points[:, 1])), float(np.min(points[:, 2]))]
    bbox_max = [float(np.max(points[:, 0])), float(np.max(points[:, 1])), float(np.max(points[:, 2]))]
    center = [
        float((bbox_min[0] + bbox_max[0]) / 2.0),
        float((bbox_min[1] + bbox_max[1]) / 2.0),
        float((bbox_min[2] + bbox_max[2]) / 2.0)
    ]
    extent_x = bbox_max[0] - bbox_min[0]
    extent_y = bbox_max[1] - bbox_min[1]
    extent_z = bbox_max[2] - bbox_min[2]
    radius = float(0.5 * np.sqrt(extent_x**2 + extent_y**2 + extent_z**2))

    out_dir = settings.OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.basename(depth_map_path).rsplit("_", 1)[0]
    pc_path = os.path.join(out_dir, f"{base}_pointcloud.json")

    data = {
        "vertices": points.tolist(),
        "colors": colors.tolist(),
        "bbox_min": bbox_min,
        "bbox_max": bbox_max,
        "center": center,
        "radius": radius
    }

    with open(pc_path, 'w') as f:
        json.dump(data, f)

    # Step 11: Save point cloud preview diagnostic (06_point_cloud_preview.png)
    try:
        preview_h, preview_w = 400, int(400 * aspect)
        preview_img = np.zeros((preview_h, preview_w, 3), dtype=np.uint8)
        px = np.clip(((points[:, 0] - bbox_min[0]) / max(extent_x, 1e-5) * (preview_w - 1)).astype(int), 0, preview_w - 1)
        py = np.clip(((bbox_max[1] - points[:, 1]) / max(extent_y, 1e-5) * (preview_h - 1)).astype(int), 0, preview_h - 1)
        c_bgr = (colors[:, ::-1] * 255).astype(np.uint8)
        preview_img[py, px] = c_bgr
        cv2.imwrite(os.path.join(out_dir, f"{base}_06_point_cloud_preview.png"), preview_img)
    except Exception as prev_err:
        logger.warning(f"Could not save point cloud preview: {prev_err}")

    logger.info(f"Point cloud: {len(points)} points generated. BBox X:[{bbox_min[0]:.2f}, {bbox_max[0]:.2f}], "
                f"Y:[{bbox_min[1]:.2f}, {bbox_max[1]:.2f}], Z:[{bbox_min[2]:.2f}, {bbox_max[2]:.2f}]")
    return pc_path, len(points)


def generate_mesh(depth_map_path: str, image_path: str) -> tuple[str, int]:
    """
    Generate 3D mesh from ACTUAL depth map + ORIGINAL uploaded image.
    
    Includes adaptive depth-discontinuity protection (Step 6):
    Triangles are NOT created across severe depth cliffs (e.g. building walls).
    This prevents stretched diagonal triangles while preserving true building geometry.
    """
    raw_depth = np.load(depth_map_path)
    depth = clean_depth(raw_depth)

    if image_path and os.path.exists(image_path):
        img = load_image(image_path)
        logger.info(f"Mesh: using real image {os.path.basename(image_path)}")
    else:
        logger.warning(f"Mesh: image not found at {image_path}, using neutral fallback")
        img = np.ones((*depth.shape, 3), dtype=np.uint8) * 200

    # Ensure depth and image dimensions match
    if depth.shape[:2] != img.shape[:2]:
        img = cv2.resize(img, (depth.shape[1], depth.shape[0]), interpolation=cv2.INTER_AREA)

    # Downsample grid for mesh generation (step=6 for rich detail and fast 60fps rendering)
    step = 6
    depth_ds = depth[::step, ::step]
    img_ds = img[::step, ::step]

    h, w = depth_ds.shape
    aspect = float(w) / max(float(h), 1.0)
    scene_width = aspect * SCENE_BASE_SCALE
    scene_height = SCENE_BASE_SCALE

    # Step 1: True planar orthographic grid
    u_norm = np.linspace(-0.5, 0.5, w, dtype=np.float32) * scene_width
    v_norm = np.linspace(0.5, -0.5, h, dtype=np.float32) * scene_height
    x_grid, y_grid = np.meshgrid(u_norm, v_norm)
    z_grid = (depth_ds * DEFAULT_Z_SCALE).astype(np.float32)

    vertices = np.stack((x_grid, y_grid, z_grid), axis=-1).reshape(-1, 3)
    # Step 7: Real satellite RGB colors attached to every vertex
    colors = (img_ds.reshape(-1, 3) / 255.0).astype(np.float32)

    # Step 6: Depth-aware mesh generation with adaptive threshold
    depth_flat = z_grid.flatten()
    dh = np.abs(np.diff(z_grid, axis=1))
    dv = np.abs(np.diff(z_grid, axis=0))
    all_diffs = np.concatenate([dh.flatten(), dv.flatten()])
    all_diffs = all_diffs[all_diffs > 0.001]

    if len(all_diffs) > 0:
        med_step = float(np.median(all_diffs))
        p75 = float(np.percentile(all_diffs, 75))
        # Adaptive threshold: allow normal slopes, reject cliff jumps
        discontinuity_thresh = max(med_step * 3.8, p75 * 2.2, 0.25)
    else:
        discontinuity_thresh = 0.35

    faces = []
    total_candidates = 2 * (h - 1) * (w - 1)
    rejected_count = 0

    for i in range(h - 1):
        for j in range(w - 1):
            idx = i * w + j
            # Quad vertices:
            # TL: idx,     TR: idx + 1
            # BL: idx + w, BR: idx + w + 1
            z_tl = depth_flat[idx]
            z_tr = depth_flat[idx + 1]
            z_bl = depth_flat[idx + w]
            z_br = depth_flat[idx + w + 1]

            # Triangle 1: (TL, BL, TR)
            diff1 = max(abs(z_tl - z_bl), abs(z_tl - z_tr), abs(z_bl - z_tr))
            if diff1 <= discontinuity_thresh:
                faces.append([idx, idx + w, idx + 1])
            else:
                rejected_count += 1

            # Triangle 2: (TR, BL, BR)
            diff2 = max(abs(z_tr - z_bl), abs(z_tr - z_br), abs(z_bl - z_br))
            if diff2 <= discontinuity_thresh:
                faces.append([idx + 1, idx + w, idx + w + 1])
            else:
                rejected_count += 1

    rejection_pct = (rejected_count / max(total_candidates, 1)) * 100.0

    # Step 10: Accurate scene bounding box
    bbox_min = [float(np.min(vertices[:, 0])), float(np.min(vertices[:, 1])), float(np.min(vertices[:, 2]))]
    bbox_max = [float(np.max(vertices[:, 0])), float(np.max(vertices[:, 1])), float(np.max(vertices[:, 2]))]
    center = [
        float((bbox_min[0] + bbox_max[0]) / 2.0),
        float((bbox_min[1] + bbox_max[1]) / 2.0),
        float((bbox_min[2] + bbox_max[2]) / 2.0)
    ]
    extent_x = bbox_max[0] - bbox_min[0]
    extent_y = bbox_max[1] - bbox_min[1]
    extent_z = bbox_max[2] - bbox_min[2]
    radius = float(0.5 * np.sqrt(extent_x**2 + extent_y**2 + extent_z**2))

    out_dir = settings.OUTPUT_DIR
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.basename(depth_map_path).rsplit("_", 1)[0]
    mesh_path = os.path.join(out_dir, f"{base}_mesh.json")

    data = {
        "vertices": vertices.tolist(),
        "colors": colors.tolist(),
        "faces": faces,
        "bbox_min": bbox_min,
        "bbox_max": bbox_max,
        "center": center,
        "radius": radius,
        "reconstruction_stats": {
            "candidate_triangles": total_candidates,
            "accepted_triangles": len(faces),
            "rejected_triangles": rejected_count,
            "rejection_percentage": round(rejection_pct, 2),
            "discontinuity_threshold": round(discontinuity_thresh, 4),
            "num_vertices": len(vertices),
            "num_faces": len(faces)
        }
    }

    with open(mesh_path, 'w') as f:
        json.dump(data, f)

    # Step 11: Save mesh preview diagnostic (07_mesh_preview.png)
    try:
        preview_h, preview_w = 400, int(400 * aspect)
        preview_img = np.zeros((preview_h, preview_w, 3), dtype=np.uint8)
        px = np.clip(((vertices[:, 0] - bbox_min[0]) / max(extent_x, 1e-5) * (preview_w - 1)).astype(int), 0, preview_w - 1)
        py = np.clip(((bbox_max[1] - vertices[:, 1]) / max(extent_y, 1e-5) * (preview_h - 1)).astype(int), 0, preview_h - 1)
        c_bgr = (colors[:, ::-1] * 255).astype(np.uint8)
        preview_img[py, px] = c_bgr
        cv2.imwrite(os.path.join(out_dir, f"{base}_07_mesh_preview.png"), preview_img)
    except Exception as prev_err:
        logger.warning(f"Could not save mesh preview: {prev_err}")

    logger.info(f"Mesh: {len(faces)} faces accepted ({100 - rejection_pct:.1f}%), {rejected_count} rejected "
                f"({rejection_pct:.1f}% cliff edges). Vertices: {len(vertices)}.")
    return mesh_path, len(faces)

