import numpy as np
import cv2
import os
from app.config import settings

def generate_demo_image() -> str:
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    
    # Terrain (greenish)
    img[:] = (34, 139, 34)
    
    # Roads (gray)
    cv2.line(img, (256, 0), (256, 512), (100, 100, 100), 40)
    cv2.line(img, (0, 256), (512, 256), (100, 100, 100), 30)
    
    # Buildings (rectangles)
    cv2.rectangle(img, (100, 100), (200, 200), (200, 200, 200), -1)
    cv2.rectangle(img, (300, 100), (450, 200), (180, 180, 180), -1)
    cv2.rectangle(img, (100, 300), (200, 450), (220, 220, 220), -1)
    
    # Vegetation (circles)
    cv2.circle(img, (400, 400), 40, (0, 100, 0), -1)
    cv2.circle(img, (430, 380), 30, (0, 120, 0), -1)
    
    path = os.path.join(settings.UPLOAD_DIR, "demo_image.png")
    cv2.imwrite(path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    return path

def generate_demo_bw_image() -> str:
    path = generate_demo_image()
    img = cv2.imread(path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    bw_path = os.path.join(settings.UPLOAD_DIR, "demo_image_bw.png")
    cv2.imwrite(bw_path, gray)
    return bw_path

def generate_demo_depth() -> str:
    # A simple gradient + some shapes for buildings
    depth = np.linspace(0, 1, 512)[:, None] * np.ones((512, 512))
    
    # Elevate buildings
    depth[100:200, 100:200] = 0.8
    depth[100:200, 300:450] = 0.9
    depth[300:450, 100:200] = 0.7
    
    depth_path = os.path.join(settings.OUTPUT_DIR, "demo_depth.npy")
    np.save(depth_path, depth.astype(np.float32))
    return depth_path

def generate_demo_segmentation() -> str:
    seg = np.zeros((512, 512), dtype=np.uint8)
    # 1: Building, 2: Vegetation
    seg[100:200, 100:200] = 1
    seg[100:200, 300:450] = 1
    seg[300:450, 100:200] = 1
    
    cv2.circle(seg, (400, 400), 40, 2, -1)
    cv2.circle(seg, (430, 380), 30, 2, -1)
    
    seg_path = os.path.join(settings.OUTPUT_DIR, "demo_segmentation.npy")
    np.save(seg_path, seg)
    return seg_path

def get_demo_data() -> dict:
    return {
        "image": generate_demo_image(),
        "bw_image": generate_demo_bw_image(),
        "depth": generate_demo_depth(),
        "segmentation": generate_demo_segmentation()
    }
