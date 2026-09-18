import cv2
import numpy as np
from PIL import Image
import os

def load_image(path: str) -> np.ndarray:
    try:
        with Image.open(path) as pil_img:
            return np.array(pil_img.convert('RGB'))
    except Exception:
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Failed to load image at {path}")
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def save_image(array: np.ndarray, path: str):
    if len(array.shape) == 3 and array.shape[2] == 3:
        array = cv2.cvtColor(array, cv2.COLOR_RGB2BGR)
    cv2.imwrite(path, array)

def resize_image(img: np.ndarray, max_size: int = 1024) -> np.ndarray:
    h, w = img.shape[:2]
    if max(h, w) > max_size:
        scale = max_size / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return img

def to_grayscale(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 3:
        return cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    return img

def apply_colormap(gray: np.ndarray, colormap=cv2.COLORMAP_TURBO) -> np.ndarray:
    if gray.dtype != np.uint8:
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    colored = cv2.applyColorMap(gray, colormap)
    return cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)

def is_grayscale(img: np.ndarray) -> bool:
    if len(img.shape) < 3:
        return True
    if img.shape[2] == 1:
        return True
    # Check if R==G==B
    b, g, r = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    return bool(np.all(b == g) and np.all(g == r))
