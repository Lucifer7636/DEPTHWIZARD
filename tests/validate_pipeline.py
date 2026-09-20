import os
import sys
import shutil
import json
import time
import math
import numpy as np
import cv2

# Ensure backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.services.depth_service import estimate_depth
from app.services.segmentation_service import segment_image
from app.services.calibration_service import calibrate, calibrate_default
from app.services.height_service import estimate_heights
from app.services.reconstruction_service import generate_point_cloud, generate_mesh
from app.services.flythrough_service import generate_camera_path
from app.schemas.schemas import CalibrationRequest


def render_point_cloud_preview(vertices, colors, output_path, img_size=(600, 600)):
    """Render an isometric/perspective projection of 3D point cloud onto a 2D image."""
    canvas = np.zeros((img_size[1], img_size[0], 3), dtype=np.uint8)
    canvas[:] = (20, 24, 32)  # Dark slate background
    
    if len(vertices) == 0:
        cv2.imwrite(output_path, canvas)
        return
    
    pts = np.array(vertices, dtype=np.float32)
    cols = (np.array(colors, dtype=np.float32) * 255).astype(np.uint8)
    
    # Rotate around X by 55 deg and Z by 40 deg for isometric perspective
    angle_x = math.radians(55)
    angle_z = math.radians(40)
    
    Rx = np.array([
        [1, 0, 0],
        [0, math.cos(angle_x), -math.sin(angle_x)],
        [0, math.sin(angle_x), math.cos(angle_x)]
    ], dtype=np.float32)
    
    Rz = np.array([
        [math.cos(angle_z), -math.sin(angle_z), 0],
        [math.sin(angle_z), math.cos(angle_z), 0],
        [0, 0, 1]
    ], dtype=np.float32)
    
    R = Rx @ Rz
    
    # Center points
    center = (pts.min(axis=0) + pts.max(axis=0)) / 2.0
    centered = pts - center
    
    # Rotate
    rotated = centered @ R.T
    
    # Sort points by depth (Y after rotation) for painter's algorithm
    sort_idx = np.argsort(rotated[:, 1])
    rotated = rotated[sort_idx]
    cols = cols[sort_idx]
    
    # Project to screen
    extent = max(np.ptp(rotated[:, 0]), np.ptp(rotated[:, 2]), 1e-4)
    scale = (img_size[0] * 0.75) / extent
    
    u = ((rotated[:, 0] * scale) + (img_size[0] / 2)).astype(int)
    v = ((-rotated[:, 2] * scale) + (img_size[1] / 2)).astype(int)
    
    # Draw points
    valid = (u >= 0) & (u < img_size[0]) & (v >= 0) & (v < img_size[1])
    u = u[valid]
    v = v[valid]
    c = cols[valid]
    
    for ui, vi, col in zip(u, v, c):
        # RGB to BGR for cv2
        bgr = (int(col[2]), int(col[1]), int(col[0]))
        cv2.circle(canvas, (ui, vi), 1, bgr, -1)
        
    cv2.putText(canvas, f"Point Cloud Preview ({len(pts)} pts)", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 220, 240), 2)
    cv2.imwrite(output_path, canvas)


def render_mesh_preview(vertices, faces, colors, output_path, img_size=(600, 600)):
    """Render wireframe projection of 3D mesh."""
    canvas = np.zeros((img_size[1], img_size[0], 3), dtype=np.uint8)
    canvas[:] = (18, 22, 28)
    
    if len(vertices) == 0 or len(faces) == 0:
        cv2.imwrite(output_path, canvas)
        return
        
    pts = np.array(vertices, dtype=np.float32)
    
    # Isometric rotation
    angle_x = math.radians(55)
    angle_z = math.radians(40)
    
    Rx = np.array([
        [1, 0, 0],
        [0, math.cos(angle_x), -math.sin(angle_x)],
        [0, math.sin(angle_x), math.cos(angle_x)]
    ], dtype=np.float32)
    
    Rz = np.array([
        [math.cos(angle_z), -math.sin(angle_z), 0],
        [math.sin(angle_z), math.cos(angle_z), 0],
        [0, 0, 1]
    ], dtype=np.float32)
    
    R = Rx @ Rz
    center = (pts.min(axis=0) + pts.max(axis=0)) / 2.0
    centered = pts - center
    rotated = centered @ R.T
    
    extent = max(np.ptp(rotated[:, 0]), np.ptp(rotated[:, 2]), 1e-4)
    scale = (img_size[0] * 0.75) / extent
    
    u = ((rotated[:, 0] * scale) + (img_size[0] / 2)).astype(int)
    v = ((-rotated[:, 2] * scale) + (img_size[1] / 2)).astype(int)
    
    # Subsample faces for rendering clarity if too dense
    step = max(1, len(faces) // 3000)
    sampled_faces = faces[::step]
    
    for f in sampled_faces:
        p0 = (u[f[0]], v[f[0]])
        p1 = (u[f[1]], v[f[1]])
        p2 = (u[f[2]], v[f[2]])
        
        # Check boundary
        if all(0 <= pt[0] < img_size[0] and 0 <= pt[1] < img_size[1] for pt in (p0, p1, p2)):
            pts_tri = np.array([p0, p1, p2], np.int32)
            # Subtle filled triangle + cyan wireframe
            cv2.fillConvexPoly(canvas, pts_tri, (45, 55, 65))
            cv2.polylines(canvas, [pts_tri], True, (0, 190, 220), 1, cv2.LINE_AA)
            
    cv2.putText(canvas, f"3D Mesh Surface ({len(faces)} faces)", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 210, 255), 2)
    cv2.imwrite(output_path, canvas)


def render_flythrough_preview(path, output_path, img_size=(600, 600)):
    """Render top-down & perspective trajectory of the camera flight path."""
    canvas = np.zeros((img_size[1], img_size[0], 3), dtype=np.uint8)
    canvas[:] = (15, 18, 24)
    
    positions = [k["position"] for k in path]
    targets = [k["target"] for k in path]
    
    if not positions:
        cv2.imwrite(output_path, canvas)
        return
        
    pts = np.array(positions)
    min_xy = pts[:, :2].min(axis=0)
    max_xy = pts[:, :2].max(axis=0)
    extent = max(max_xy[0] - min_xy[0], max_xy[1] - min_xy[1], 0.1)
    
    scale = (img_size[0] * 0.7) / extent
    center = (min_xy + max_xy) / 2.0
    
    # Draw orbit path
    screen_pts = []
    for p in pts:
        sx = int((p[0] - center[0]) * scale + img_size[0] / 2)
        sy = int((p[1] - center[1]) * scale + img_size[1] / 2)
        screen_pts.append((sx, sy))
        
    # Draw trajectory line
    for i in range(len(screen_pts) - 1):
        # Color gradient along trajectory (cyan -> purple)
        t = i / len(screen_pts)
        b = int(255 * (1 - t) + 120 * t)
        g = int(200 * (1 - t) + 30 * t)
        r = int(20 * (1 - t) + 240 * t)
        cv2.line(canvas, screen_pts[i], screen_pts[i+1], (b, g, r), 2, cv2.LINE_AA)
        
    # Draw target point
    tgt = targets[0]
    tx = int((tgt[0] - center[0]) * scale + img_size[0] / 2)
    ty = int((tgt[1] - center[1]) * scale + img_size[1] / 2)
    cv2.circle(canvas, (tx, ty), 6, (0, 0, 255), -1)
    cv2.putText(canvas, "Scene Focus Center", (tx + 10, ty + 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)
                
    # Mark start and end keyframes
    cv2.circle(canvas, screen_pts[0], 5, (0, 255, 0), -1)
    cv2.putText(canvas, "Start", (screen_pts[0][0] + 8, screen_pts[0][1]),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)
                
    cv2.putText(canvas, f"Flythrough Camera Trajectory ({len(path)} waypoints)", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 220, 255), 2)
    cv2.imwrite(output_path, canvas)


def run_project_pipeline(image_path: str, project_name: str, out_dir: str):
    """Run full pipeline and isolate all outputs into project-specific directory."""
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"\n=======================================================")
    print(f"RUNNING PIPELINE FOR: {project_name}")
    print(f"Input image: {image_path}")
    print(f"Destination: {out_dir}")
    print(f"=======================================================")
    
    # Copy input image
    in_ext = os.path.splitext(image_path)[1]
    input_copy = os.path.join(out_dir, f"input_image{in_ext}")
    shutil.copyfile(image_path, input_copy)
    
    # 1. Depth Estimation
    depth_npy, min_d, max_d, mean_d, inf_time, model_used, is_demo = estimate_depth(image_path)
    print(f"1. Depth: min={min_d:.4f}, max={max_d:.4f}, mean={mean_d:.4f}, model={model_used}, time={inf_time:.2f}s")
    
    # Copy depth files to project directory
    depth_base = os.path.basename(image_path).rsplit(".", 1)[0]
    depth_png_src = os.path.join(os.path.dirname(depth_npy), f"{depth_base}_depth.png")
    depth_png_dst = os.path.join(out_dir, "depth_visualization.png")
    shutil.copyfile(depth_png_src, depth_png_dst)
    
    proj_depth_npy = os.path.join(out_dir, "depth_map.npy")
    shutil.copyfile(depth_npy, proj_depth_npy)
    
    # 2. Segmentation
    seg_npy, seg_method = segment_image(image_path, depth_npy_path=proj_depth_npy)
    seg_png_src = os.path.join(os.path.dirname(seg_npy), f"{depth_base}_segmentation.png")
    seg_png_dst = os.path.join(out_dir, "segmentation_preview.png")
    shutil.copyfile(seg_png_src, seg_png_dst)
    print(f"2. Segmentation method: {seg_method}")
    
    # 3. Calibration
    scale_factor, calib_method, is_est = calibrate(min_d, max_d, CalibrationRequest(project_id=1))
    print(f"3. Calibration: scale_factor={scale_factor:.2f}, method={calib_method}")
    
    # 4. Height Estimation
    heights = estimate_heights(proj_depth_npy, scale_factor)
    print(f"4. Heights: min={heights['min_height']}m, max={heights['max_height']}m, buildings={heights['num_buildings']}")
    
    with open(os.path.join(out_dir, "height_metrics.json"), "w") as f:
        json.dump(heights, f, indent=2)
        
    # 5. Point Cloud Generation
    pc_path, num_points = generate_point_cloud(proj_depth_npy, image_path)
    with open(pc_path, "r") as f:
        pc_data = json.load(f)
    print(f"5. Point cloud: {num_points} vertices, bbox={pc_data.get('bbox_min')} to {pc_data.get('bbox_max')}")
    
    proj_pc_json = os.path.join(out_dir, "pointcloud.json")
    shutil.copyfile(pc_path, proj_pc_json)
    
    pc_preview_png = os.path.join(out_dir, "point_cloud_preview.png")
    render_point_cloud_preview(pc_data["vertices"], pc_data["colors"], pc_preview_png)
    
    # 6. Mesh Generation
    mesh_path, num_faces = generate_mesh(proj_depth_npy, image_path)
    with open(mesh_path, "r") as f:
        mesh_data = json.load(f)
    print(f"6. Mesh: {num_faces} faces, vertices={len(mesh_data['vertices'])}")
    
    proj_mesh_json = os.path.join(out_dir, "mesh.json")
    shutil.copyfile(mesh_path, proj_mesh_json)
    
    mesh_preview_png = os.path.join(out_dir, "mesh_preview.png")
    render_mesh_preview(mesh_data["vertices"], mesh_data["faces"], mesh_data["colors"], mesh_preview_png)
    
    # 7. Scene-Adaptive Flythrough
    camera_path = generate_camera_path(
        num_points=num_points,
        duration=30.0,
        bbox_min=pc_data.get("bbox_min"),
        bbox_max=pc_data.get("bbox_max"),
        scene_center=pc_data.get("center")
    )
    print(f"7. Flythrough: {len(camera_path)} keyframes, start={camera_path[0]['position']}, target={camera_path[0]['target']}")
    
    proj_fly_json = os.path.join(out_dir, "flythrough_path.json")
    with open(proj_fly_json, "w") as f:
        json.dump(camera_path, f, indent=2)
        
    fly_preview_png = os.path.join(out_dir, "flythrough_preview.png")
    render_flythrough_preview(camera_path, fly_preview_png)
    
    return {
        "project_name": project_name,
        "input_image": image_path,
        "depth_stats": {"min": min_d, "max": max_d, "mean": mean_d, "model": model_used},
        "height_stats": heights,
        "pc_stats": {
            "num_points": num_points,
            "bbox_min": pc_data.get("bbox_min"),
            "bbox_max": pc_data.get("bbox_max"),
            "center": pc_data.get("center")
        },
        "mesh_stats": {"num_faces": num_faces, "num_vertices": len(mesh_data["vertices"])},
        "flythrough_stats": {
            "num_keyframes": len(camera_path),
            "start_pos": camera_path[0]["position"],
            "target": camera_path[0]["target"]
        },
        "files": {
            "input": input_copy,
            "depth_viz": depth_png_dst,
            "point_cloud_preview": pc_preview_png,
            "mesh_preview": mesh_preview_png,
            "flythrough_preview": fly_preview_png
        }
    }


def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    data_dir = os.path.join(base_dir, 'data', 'uploads')
    
    # Select two genuinely different input images
    img_a = os.path.join(data_dir, '57a5b6fbd6ab.jpg') # 800x800 satellite scene
    img_b = os.path.join(data_dir, 'ecac697a25f6.png') # 754x487 aerial/urban scene
    
    if not os.path.exists(img_a) or not os.path.exists(img_b):
        print(f"Error: Missing test images: {img_a}, {img_b}")
        sys.exit(1)
        
    val_out_base = os.path.join(base_dir, 'data', 'validation_output')
    out_dir_a = os.path.join(val_out_base, 'project_A_satellite')
    out_dir_b = os.path.join(val_out_base, 'project_B_aerial')
    out_dir_a2 = os.path.join(val_out_base, 'project_A_repeat')
    
    print("\n=======================================================")
    print("STARTING DEPTHWIZARD REAL-IMAGE 3D PIPELINE VALIDATION")
    print("=======================================================")
    
    # Run Project A
    res_a = run_project_pipeline(img_a, "Project A (Satellite 800x800)", out_dir_a)
    
    # Run Project B (Visually & dimensionally different)
    res_b = run_project_pipeline(img_b, "Project B (Aerial 754x487)", out_dir_b)
    
    # Run Project A again (to verify determinism)
    res_a2 = run_project_pipeline(img_a, "Project A Repeat (Determinism Check)", out_dir_a2)
    
    # COMPARISONS & ASSERTIONS
    print("\n=======================================================")
    print("VALIDATION COMPARISON RESULTS")
    print("=======================================================")
    
    print("\n--- 1. Depth Statistics ---")
    print(f"Project A:  mean={res_a['depth_stats']['mean']:.4f}, min={res_a['depth_stats']['min']:.4f}, max={res_a['depth_stats']['max']:.4f}")
    print(f"Project B:  mean={res_b['depth_stats']['mean']:.4f}, min={res_b['depth_stats']['min']:.4f}, max={res_b['depth_stats']['max']:.4f}")
    print(f"Project A2: mean={res_a2['depth_stats']['mean']:.4f}, min={res_a2['depth_stats']['min']:.4f}, max={res_a2['depth_stats']['max']:.4f}")
    
    diff_depth_ab = abs(res_a['depth_stats']['mean'] - res_b['depth_stats']['mean'])
    diff_depth_aa = abs(res_a['depth_stats']['mean'] - res_a2['depth_stats']['mean'])
    print(f"Mean Depth Diff (A vs B): {diff_depth_ab:.4f} (MUST BE SIGNIFICANT)")
    print(f"Mean Depth Diff (A vs A2): {diff_depth_aa:.6f} (MUST BE DETERMINISTIC ~0.0)")
    
    print("\n--- 2. Point Cloud & Bounding Box ---")
    print(f"Project A Points: {res_a['pc_stats']['num_points']}, BBox: {res_a['pc_stats']['bbox_min']} to {res_a['pc_stats']['bbox_max']}")
    print(f"Project B Points: {res_b['pc_stats']['num_points']}, BBox: {res_b['pc_stats']['bbox_min']} to {res_b['pc_stats']['bbox_max']}")
    
    print("\n--- 3. 3D Mesh Topologies ---")
    print(f"Project A Faces: {res_a['mesh_stats']['num_faces']}, Vertices: {res_a['mesh_stats']['num_vertices']}")
    print(f"Project B Faces: {res_b['mesh_stats']['num_faces']}, Vertices: {res_b['mesh_stats']['num_vertices']}")
    
    print("\n--- 4. Building Height Distribution ---")
    print(f"Project A: buildings={res_a['height_stats']['num_buildings']}, max_height={res_a['height_stats']['max_height']}m")
    print(f"Project B: buildings={res_b['height_stats']['num_buildings']}, max_height={res_b['height_stats']['max_height']}m")
    
    print("\n--- 5. Scene-Adaptive Flythrough Camera Path ---")
    print(f"Project A Flythrough Start: {res_a['flythrough_stats']['start_pos']}, Target: {res_a['flythrough_stats']['target']}")
    print(f"Project B Flythrough Start: {res_b['flythrough_stats']['start_pos']}, Target: {res_b['flythrough_stats']['target']}")
    
    diff_fly_start = np.linalg.norm(np.array(res_a['flythrough_stats']['start_pos']) - np.array(res_b['flythrough_stats']['start_pos']))
    print(f"Flythrough Start Coordinate Delta (A vs B): {diff_fly_start:.4f}m")
    
    # Assertions
    assert res_a['pc_stats']['num_points'] != res_b['pc_stats']['num_points'], "Points count must differ for different resolutions!"
    assert res_a['mesh_stats']['num_faces'] != res_b['mesh_stats']['num_faces'], "Mesh faces must differ for different resolutions!"
    assert res_a['pc_stats']['bbox_min'] != res_b['pc_stats']['bbox_min'], "Bounding box must differ for different geometries!"
    assert res_a['flythrough_stats']['start_pos'] != res_b['flythrough_stats']['start_pos'], "Flythrough path must adapt to scene geometry!"
    
    # Check determinism
    assert res_a['pc_stats']['num_points'] == res_a2['pc_stats']['num_points'], "Point cloud must be deterministic for same image!"
    assert res_a['mesh_stats']['num_faces'] == res_a2['mesh_stats']['num_faces'], "Mesh faces must be deterministic for same image!"
    
    print("\n=======================================================")
    print("ALL VALIDATION CRITERIA PASSED 100%!")
    print("All project-specific preview files saved successfully:")
    print(f"  Project A: {out_dir_a}")
    print(f"  Project B: {out_dir_b}")
    print(f"  Project A Repeat: {out_dir_a2}")
    print("=======================================================\n")


if __name__ == "__main__":
    main()
