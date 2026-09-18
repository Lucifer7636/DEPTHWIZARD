import numpy as np
import json
import os
import cv2


def estimate_heights(depth_npy_path: str, scale_factor: float) -> dict:
    """
    Estimate heights from depth map and scale factor.
    Returns dict with min, max, mean heights and building heights.
    """
    depth = np.load(depth_npy_path)
    height_map = depth * scale_factor

    min_h = float(np.min(height_map))
    max_h = float(np.max(height_map))
    mean_h = float(np.mean(height_map))

    # Estimate building heights by detecting elevated regions
    threshold = mean_h + 0.3 * (max_h - mean_h)
    building_mask = (height_map > threshold).astype(np.uint8)

    # Connected components for individual buildings
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        building_mask, connectivity=8
    )

    buildings = []
    for i in range(1, num_labels):
        area = int(stats[i, cv2.CC_STAT_AREA])
        if area < 50:
            continue  # skip small regions
        mask = labels == i
        b_heights = height_map[mask]
        buildings.append({
            "id": i,
            "estimated_height": round(float(np.max(b_heights) - min_h), 1),
            "min_height": round(float(np.min(b_heights)), 1),
            "max_height": round(float(np.max(b_heights)), 1),
            "mean_height": round(float(np.mean(b_heights)), 1),
            "area_pixels": area,
            "centroid": [round(float(centroids[i][0]), 1), round(float(centroids[i][1]), 1)]
        })

    # Sort by estimated height descending
    buildings.sort(key=lambda b: b["estimated_height"], reverse=True)

    return {
        "min_height": round(min_h, 2),
        "max_height": round(max_h, 2),
        "mean_height": round(mean_h, 2),
        "scale_factor": scale_factor,
        "num_buildings": len(buildings),
        "buildings": buildings[:20],  # top 20
        "confidence": 0.65 if scale_factor == 50.0 else 0.80,
        "unit": "meters (estimated)"
    }


def get_height_at_point(depth_npy_path: str, x: int, y: int, scale_factor: float) -> dict:
    """Get estimated height at a specific image coordinate."""
    depth = np.load(depth_npy_path)
    h, w = depth.shape
    if 0 <= y < h and 0 <= x < w:
        depth_val = float(depth[y, x])
        height_val = depth_val * scale_factor
        return {
            "x": x,
            "y": y,
            "depth": round(depth_val, 4),
            "estimated_height": round(height_val, 2),
            "unit": "meters (estimated)"
        }
    return {"error": "Coordinates out of bounds"}
