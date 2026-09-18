#!/usr/bin/env python3
"""
DepthWizard Model Download Script
---------------------------------
Downloads pre-trained deep learning weights for monocular depth estimation.
Supported models:
  - MiDaS_small (lightweight, ~45MB, optimal for real-time CPU/GPU inference)
  - DPT_Hybrid (high accuracy transformer hybrid, ~470MB)
"""

import os
import sys
import argparse
from pathlib import Path

def format_size(size_bytes: int) -> str:
    """Format bytes to human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def get_directory_size(path: Path) -> int:
    """Calculate total size of all files in a directory."""
    total = 0
    if path.is_file():
        return path.stat().st_size
    for p in path.rglob('*'):
        if p.is_file():
            total += p.stat().st_size
    return total

def main():
    parser = argparse.ArgumentParser(description="Download DepthWizard AI Depth Estimation Models")
    parser.add_argument(
        "--model-type",
        choices=["MiDaS_small", "DPT_Hybrid", "DPT_Large"],
        default="MiDaS_small",
        help="Depth model architecture to download (default: MiDaS_small)"
    )
    parser.add_argument(
        "--models-dir",
        default="models",
        help="Target local models directory (default: models/)"
    )
    args = parser.parse_args()

    print("=" * 70)
    print("           DepthWizard - Model Pre-fetch & Setup Utility")
    print("=" * 70)

    # 1. Ensure models directory exists
    models_path = Path(args.models_dir).resolve()
    models_path.mkdir(parents=True, exist_ok=True)
    print(f"[*] Local models directory: {models_path}")

    # 2. Check PyTorch installation
    try:
        import torch
        print(f"[*] PyTorch version detected: {torch.__version__}")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[*] Default acceleration device: {device.upper()}")
    except ImportError:
        print("[!] ERROR: PyTorch is not installed in the current Python environment.")
        print("[!] Please run: pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu")
        print("    or refer to backend/requirements.txt")
        sys.exit(1)

    hub_dir = Path(torch.hub.get_dir())
    print(f"[*] Torch Hub cache directory: {hub_dir}")

    # Check if model already exists in hub cache or models dir
    model_name = args.model_type
    print(f"\n[+] Preparing to download model: '{model_name}'...")

    try:
        # Download model architecture and weights using torch.hub
        # Intel ISL repository: intel-isl/MiDaS
        print(f"[*] Connecting to torch.hub repository 'intel-isl/MiDaS'...")
        model = torch.hub.load("intel-isl/MiDaS", model_name, pretrained=True, trust_repo=True)
        model.eval()

        # Check torch hub checkpoints directory
        checkpoints_dir = hub_dir / "checkpoints"
        found_weights = []
        if checkpoints_dir.exists():
            for f in checkpoints_dir.iterdir():
                if f.is_file() and model_name.lower() in f.name.lower() or "midas" in f.name.lower() or "dpt" in f.name.lower():
                    found_weights.append(f)

        print("\n" + "-" * 70)
        print(f"[SUCCESS] Model '{model_name}' downloaded and loaded successfully!")
        print("-" * 70)

        if found_weights:
            for w in found_weights:
                print(f" - Weight file: {w.name}")
                print(f"   Path:        {w.resolve()}")
                print(f"   Size:        {format_size(w.stat().st_size)}")
        else:
            total_hub_size = get_directory_size(hub_dir)
            print(f" - Stored in PyTorch Hub cache: {hub_dir}")
            print(f"   Total cache size: {format_size(total_hub_size)}")

        # Also download transforms
        print("\n[*] Loading and validating model transforms...")
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
        if model_name in ["DPT_Large", "DPT_Hybrid"]:
            transform = midas_transforms.dpt_transform
        else:
            transform = midas_transforms.small_transform
        print(f"[SUCCESS] Transforms loaded successfully for {model_name}.")

        print("\n" + "=" * 70)
        print("Model verification complete! DepthWizard is ready for neural depth inference.")
        print("Start the backend server with: uvicorn app.main:app --reload")
        print("=" * 70)

    except Exception as exc:
        print("\n" + "!" * 70)
        print(f"[WARNING] Automated model download could not complete: {exc}")
        print("!" * 70)
        print("\nTroubleshooting and Offline Usage:")
        print("1. Network Connectivity:")
        print("   Make sure you have an active internet connection to download from GitHub & PyTorch CDN.")
        print("2. Built-in Fallback Engine:")
        print("   DepthWizard features an automated offline computer vision fallback engine!")
        print("   Even without downloading neural weights, DepthWizard will seamlessly compute")
        print("   relative depth maps using multi-scale edge gradient & Euclidean distance transform.")
        print("3. Manual Download Instructions:")
        print("   You can manually download the MiDaS weights from:")
        print("   https://github.com/isl-org/MiDaS/releases")
        print("   Save the file into torch hub checkpoints or the 'models/' folder.")
        print("=" * 70)

if __name__ == "__main__":
    main()
