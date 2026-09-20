import cv2
import numpy as np
from PIL import Image
import os

# Prevent DecompressionBombError on high-res satellite images
Image.MAX_IMAGE_PIXELS = 500_000_000

# Automatically register HEIF/AVIF opener if pillow_heif is available
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

def load_image(path: str) -> np.ndarray:
    """
    Robust image loader supporting RGB, RGBA, Grayscale, AVIF, HEIC, TIFF, WebP, JPEG, PNG.
    """
    # 1. Try Pillow first (supports most formats and AVIF/HEIC when pillow-heif is present)
    try:
        with Image.open(path) as pil_img:
            return np.array(pil_img.convert('RGB'))
    except Exception:
        pass

    # 2. Try OpenCV
    try:
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        if img is not None:
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    except Exception:
        pass

    # 3. Try reading raw bytes via Pillow BytesIO (handles paths with exotic encoding)
    try:
        import io
        with open(path, 'rb') as f:
            data = f.read()
        with Image.open(io.BytesIO(data)) as pil_img:
            return np.array(pil_img.convert('RGB'))
    except Exception:
        pass

    raise ValueError(f"Failed to load image at {path}. Unsupported format or unreadable file.")


def save_image(array: np.ndarray, path: str):
    """
    Save an RGB or grayscale numpy array as an image file safely on all platforms.
    Avoids cv2.imwrite unicode path issues on Windows.
    """
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    if len(array.shape) == 3 and array.shape[2] == 3:
        pil_img = Image.fromarray(array.astype(np.uint8), mode='RGB')
    elif len(array.shape) == 2:
        pil_img = Image.fromarray(array.astype(np.uint8), mode='L')
    else:
        pil_img = Image.fromarray(array.astype(np.uint8))
    pil_img.save(path)

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
