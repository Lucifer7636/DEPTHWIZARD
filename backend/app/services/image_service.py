import cv2
import numpy as np
import os
import io
from PIL import Image as PILImage
from app.utils.image_utils import load_image, resize_image, to_grayscale, is_grayscale, save_image
from app.config import settings

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "tiff", "tif", "webp", "bmp", "avif", "heic", "heif"}

def validate_image(file_content: bytes, filename: str) -> bool:
    if not file_content:
        return False
    if len(file_content) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        return False
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ALLOWED_EXTENSIONS:
        return True
    try:
        with PILImage.open(io.BytesIO(file_content)) as img:
            img.verify()
        return True
    except Exception:
        return False

def preprocess_image(path: str) -> str:
    img = load_image(path)
    img = resize_image(img, max_size=1024)
    root, _ = os.path.splitext(path)
    out_path = f"{root}_preprocessed.png"
    save_image(img, out_path)
    return out_path

def detect_image_type(path: str) -> str:
    img = load_image(path)
    return "GRAYSCALE" if is_grayscale(img) else "RGB"

def enhance_image(path: str) -> str:
    img = load_image(path)
    if len(img.shape) == 3:
        lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl,a,b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)
    else:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(img)
    root, _ = os.path.splitext(path)
    out_path = f"{root}_enhanced.png"
    save_image(enhanced, out_path)
    return out_path

def denoise_image(path: str) -> str:
    img = load_image(path)
    denoised = cv2.bilateralFilter(img, 9, 75, 75)
    root, _ = os.path.splitext(path)
    out_path = f"{root}_denoised.png"
    save_image(denoised, out_path)
    return out_path

