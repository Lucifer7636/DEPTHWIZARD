import os
import sys
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"


def test_full_pipeline_via_http():
    print("=== Testing DepthWizard End-to-End Pipeline via HTTP ===")
    
    # 1. Health check
    res = httpx.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health check passed:", res.json())

    # 2. Run automated demo pipeline
    print("Triggering /demo/run...")
    demo_res = httpx.post(f"{BASE_URL}/demo/run", timeout=30.0)
    assert demo_res.status_code == 200, f"Demo run failed: {demo_res.text}"
    demo_data = demo_res.json()
    print("[OK] Demo pipeline completed successfully!")
    print(f"  Project ID: {demo_data['project_id']}")
    print(f"  Inference Time: {demo_data['depth_stats']['inference_time']:.3f}s")
    print(f"  Depth Range: [{demo_data['depth_stats']['min']:.3f}, {demo_data['depth_stats']['max']:.3f}]")
    print(f"  Estimated Max Height: {demo_data['heights']['max_height']} m")
    print(f"  Structures Detected: {demo_data['heights']['num_buildings']}")
    print(f"  3D Point Cloud: {demo_data['reconstruction']['num_points']:,} vertices")
    print(f"  3D Surface Mesh: {demo_data['reconstruction']['num_faces']:,} faces")
    print(f"  Camera Flight Path: {len(demo_data['flythrough']['path'])} keyframes")

    # 3. Test retrieving generated assets
    img_res = httpx.get(f"http://127.0.0.1:8000{demo_data['image_url']}")
    assert img_res.status_code == 200
    print(f"[OK] Satellite image retrieved: {len(img_res.content):,} bytes")

    depth_img_res = httpx.get(f"http://127.0.0.1:8000{demo_data['depth_image_url']}")
    assert depth_img_res.status_code == 200
    print(f"[OK] Color-mapped depth image retrieved: {len(depth_img_res.content):,} bytes")

    # 4. Test Report Generation
    proj_id = demo_data['project_id']
    report_res = httpx.get(f"{BASE_URL}/reports/{proj_id}")
    assert report_res.status_code == 200
    print("[OK] Report retrieved successfully")

    # 5. Test JSON Export
    json_export = httpx.get(f"{BASE_URL}/reports/{proj_id}/export/json")
    assert json_export.status_code == 200
    print(f"[OK] Report JSON export: {len(json_export.content):,} bytes")

    # 6. Test CSV Export
    csv_export = httpx.get(f"{BASE_URL}/reports/{proj_id}/export/csv")
    assert csv_export.status_code == 200
    print(f"[OK] Report CSV export: {len(csv_export.content):,} bytes")

    # 7. Test Frontend HTTP Dev Server
    fe_res = httpx.get("http://127.0.0.1:5173/")
    assert fe_res.status_code == 200
    print("[OK] Frontend Dev Server responding on http://127.0.0.1:5173/")

    print("\n=============================================")
    print("ALL END-TO-END PIPELINE CHECKS PASSED 100%!")
    print("=============================================")


if __name__ == "__main__":
    test_full_pipeline_via_http()
