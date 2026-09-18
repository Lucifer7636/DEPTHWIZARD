import numpy as np
import math


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
                          orbit_radius: float = 1.5, altitude: float = 1.0) -> list:
    """
    Generate a smooth camera flythrough path.
    Path: top view → diagonal approach → low orbit → building focus → wide view → top
    """
    # Scale based on scene size estimate
    scale = max(0.5, min(num_points / 5000, 3.0))
    r = orbit_radius * scale
    h_high = altitude * scale * 2
    h_low = altitude * scale * 0.5
    
    # Keyframe positions defining the flythrough
    keyframes = [
        [0, 0, h_high * 1.5],           # Start: high top view
        [r * 0.7, r * 0.7, h_high],     # Diagonal approach
        [r, 0, h_low],                   # Low orbit position 1
        [0, -r, h_low * 0.8],           # Low orbit position 2
        [-r * 0.5, -r * 0.5, h_low],    # Building focus area
        [-r, r * 0.3, h_high * 0.7],    # Rising wide view
        [0, r, h_high],                  # Wide city view
        [r * 0.3, r * 0.3, h_high * 1.2], # Ascending
        [0, 0, h_high * 1.5],           # End: back to top view
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
                "target": [0, 0, 0],
                "up": [0, 0, 1],
                "time": round(t, 3)
            })
    
    return path
