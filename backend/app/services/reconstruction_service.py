import numpy as np
import os
import json
from app.config import settings
from app.utils.image_utils import load_image

def generate_point_cloud(depth_map_path: str, image_path: str) -> tuple[str, int]:
    depth = np.load(depth_map_path)
    if image_path and os.path.exists(image_path):
        img = load_image(image_path)
    else:
        img = np.ones((*depth.shape, 3), dtype=np.uint8) * 255

    # Downsample for performance (every 4th pixel)
    step = 4
    depth = depth[::step, ::step]
    img = img[::step, ::step]

    h, w = depth.shape
    fx, fy = w, h
    cx, cy = w/2, h/2
    
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    z = depth
    x = (u - cx) * z / fx
    y = (v - cy) * z / fy
    
    points = np.stack((x, y, z), axis=-1).reshape(-1, 3)
    colors = img.reshape(-1, 3) / 255.0
    
    out_dir = settings.OUTPUT_DIR
    base = os.path.basename(depth_map_path).rsplit("_", 1)[0]
    pc_path = os.path.join(out_dir, f"{base}_pointcloud.json")
    
    data = {
        "vertices": points.tolist(),
        "colors": colors.tolist()
    }
    
    with open(pc_path, 'w') as f:
        json.dump(data, f)
        
    return pc_path, len(points)

def generate_mesh(depth_map_path: str, image_path: str) -> tuple[str, int]:
    depth = np.load(depth_map_path)
    if image_path and os.path.exists(image_path):
        img = load_image(image_path)
    else:
        img = np.ones((*depth.shape, 3), dtype=np.uint8) * 255
        
    step = 8
    depth = depth[::step, ::step]
    img = img[::step, ::step]
    
    h, w = depth.shape
    fx, fy = w, h
    cx, cy = w/2, h/2
    
    u, v = np.meshgrid(np.arange(w), np.arange(h))
    z = depth
    x = (u - cx) * z / fx
    y = (v - cy) * z / fy
    
    vertices = np.stack((x, y, z), axis=-1).reshape(-1, 3)
    colors = img.reshape(-1, 3) / 255.0
    
    faces = []
    for i in range(h - 1):
        for j in range(w - 1):
            idx = i * w + j
            faces.append([idx, idx + w, idx + 1])
            faces.append([idx + 1, idx + w, idx + w + 1])
            
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
