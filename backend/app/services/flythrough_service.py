import numpy as np
import math
import logging

logger = logging.getLogger("depthwizard.flythrough")


def _catmull_rom_spline(P0, P1, P2, P3, num_points):
    """Catmull-Rom spline interpolation between P1 and P2."""
    P0, P1, P2, P3 = np.array(P0, dtype=float), np.array(P1, dtype=float), np.array(P2, dtype=float), np.array(P3, dtype=float)
    
    t0 = 0.0
    d1 = np.linalg.norm(P1 - P0)
    d2 = np.linalg.norm(P2 - P1)
    d3 = np.linalg.norm(P3 - P2)
    
    t1 = t0 + max(d1**0.5, 0.001)
    t2 = t1 + max(d2**0.5, 0.001)
    t3 = t2 + max(d3**0.5, 0.001)
    
    t = np.linspace(t1, t2, num_points)
    
    def safe_div(a, b):
        return a / max(b, 1e-10)
    
    points = []
    for ti in t:
        A1 = safe_div(t1 - ti, t1 - t0) * P0 + safe_div(ti - t0, t1 - t0) * P1
        A2 = safe_div(t2 - ti, t2 - t1) * P1 + safe_div(ti - t1, t2 - t1) * P2
        A3 = safe_div(t3 - ti, t3 - t2) * P2 + safe_div(ti - t2, t3 - t2) * P3
        
        B1 = safe_div(t2 - ti, t2 - t0) * A1 + safe_div(ti - t0, t2 - t0) * A2
        B2 = safe_div(t3 - ti, t3 - t1) * A2 + safe_div(ti - t1, t3 - t1) * A3
        
        C = safe_div(t2 - ti, t2 - t1) * B1 + safe_div(ti - t1, t2 - t1) * B2
        points.append(C)
    
    return points


def generate_camera_path(num_points: int = 1000, duration: float = 30.0,
                          orbit_radius: float = 1.5, altitude: float = 1.0,
                          bbox_min: list = None, bbox_max: list = None,
                          scene_center: list = None) -> list:
    """
    Generate a smooth camera flythrough path adapted to the ACTUAL reconstructed scene.
    
    Uses the scene bounding box and center to generate scene-specific keyframes.
    Different reconstructed scenes produce different camera paths.
    
    Path: top view → diagonal approach → low orbit → building focus → wide view → top
    Architecture: Catmull-Rom spline (unchanged).
    """
    # Determine scene geometry from actual reconstruction
    if bbox_min and bbox_max and scene_center:
        cx, cy, cz = scene_center
        extent_x = abs(bbox_max[0] - bbox_min[0])
        extent_y = abs(bbox_max[1] - bbox_min[1])
        extent_z = abs(bbox_max[2] - bbox_min[2])
        scene_diagonal = math.sqrt(extent_x**2 + extent_y**2 + extent_z**2)
        
        # Orbit radius adapts to scene extent
        r = max(scene_diagonal * 0.6, 0.5)
        # Heights adapt to scene's vertical extent
        h_high = max(extent_z * 2.5, cz + 1.0)
        h_low = max(extent_z * 0.8, cz * 0.5)
        
    # Three.js coordinate system: X is horizontal, Y is Up (elevation), Z is horizontal depth
    tcx = float(cx)
    tcy = float(cz)   # Three.js Up
    tcz = float(-cy)  # Three.js depth

    target = [tcx, tcy * 0.5, tcz]

    keyframes = [
        [tcx, tcy + h_high * 1.5, tcz],                          # Start: high top view
        [tcx + r * 0.7, tcy + h_high, tcz + r * 0.7],           # Diagonal approach
        [tcx + r, tcy + h_low, tcz],                             # Low orbit position 1
        [tcx, tcy + h_low * 0.8, tcz - r],                       # Low orbit position 2
        [tcx - r * 0.5, tcy + h_low, tcz - r * 0.5],             # Building focus area
        [tcx - r, tcy + h_high * 0.7, tcz + r * 0.3],            # Rising wide view
        [tcx, tcy + h_high, tcz + r],                            # Wide city view
        [tcx + r * 0.3, tcy + h_high * 1.2, tcz + r * 0.3],      # Ascending
        [tcx, tcy + h_high * 1.5, tcz],                          # End: back to top view
    ]
    
    # Generate smooth path using Catmull-Rom splines
    fps = 30
    total_frames = int(duration * fps)
    frames_per_segment = max(total_frames // max(len(keyframes) - 3, 1), 5)
    
    path = []
    for i in range(len(keyframes) - 3):
        segment = _catmull_rom_spline(
            keyframes[i], keyframes[i+1], keyframes[i+2], keyframes[i+3],
            frames_per_segment
        )
        for pt in segment:
            t = len(path) / fps
            path.append({
                "position": [round(float(pt[0]), 4), round(float(pt[1]), 4), round(float(pt[2]), 4)],
                "target": [round(float(target[0]), 4), round(float(target[1]), 4), round(float(target[2]), 4)],
                "up": [0, 1, 0],
                "time": round(t, 3)
            })
    
    return path
