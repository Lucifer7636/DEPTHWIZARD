import cv2
import numpy as np
from app.utils.image_utils import load_image, to_grayscale
import os
from app.config import settings

def segment_image(image_path: str) -> tuple[str, str]:
    img = load_image(image_path)
    gray = to_grayscale(img)
    
    # Fallback segmentation using edges + thresholds
    edges = cv2.Canny(gray, 50, 150)
    
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Morphological ops
    kernel = np.ones((5,5), np.uint8)
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Fake classes: 0: ground, 1: building, 2: vegetation
    labels = np.zeros_like(gray, dtype=np.uint8)
    labels[morph == 255] = 1 # building
    labels[(morph == 0) & (edges > 0)] = 2 # vegetation
    
    out_dir = settings.OUTPUT_DIR
    base = os.path.basename(image_path).rsplit(".", 1)[0]
    
    npy_path = os.path.join(out_dir, f"{base}_segmentation.npy")
    np.save(npy_path, labels)
    
    img_path = os.path.join(out_dir, f"{base}_segmentation.png")
    colored = np.zeros((*labels.shape, 3), dtype=np.uint8)
    colored[labels == 1] = [0, 0, 255] # Red buildings
    colored[labels == 2] = [0, 255, 0] # Green vegetation
    cv2.imwrite(img_path, colored)
    
    return npy_path, "Approximate / Demo Segmentation"
