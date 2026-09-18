# DepthWizard - Project State

## System Overview
- **Project**: DepthWizard
- **Event**: Smart India Hackathon (SIH) 2026
- **Problem Statement**: 26175
- **Tagline**: "From 2D Satellite Images to 3D Real-World Understanding"
- **Architecture**: 4-Tier Decoupled System (React/Three.js + FastAPI + CV/ML Engine + SQLite)

## Current Status: PRODUCTION READY PROTOTYPE (All Phases 1-10 Complete)

## Completed Features
- [x] Full Project Monorepo Structure Created
- [x] Backend Shell & FastAPI 0.141+ with Lifespan & CORS
- [x] Database Schema with SQLAlchemy ORM (SQLite + aiosqlite async engine)
- [x] Configuration with Pydantic-settings & absolute workspace path resolution
- [x] Image Ingestion System (Drag & Drop, JPG/PNG/TIFF, Client & Server RGB vs B&W Detection)
- [x] Preprocessing Pipeline (CLAHE Contrast Enhancement, Bilateral Denoising, Aspect-preserving Resize)
- [x] Semantic / Ground Detection (Heuristic connected-component & morphological segmentation)
- [x] Monocular Depth Estimation Engine (MiDaS DPT architecture integration + Canny/Sobel/Distance-Transform fallback)
- [x] Scale Calibration Engine (Reference object, camera intrinsic altitude/focal length, and estimated default)
- [x] Height Estimation Module (Building height extraction, terrain stats, point query, elevation histograms)
- [x] 3D Point Cloud Generator (Cartesian unprojection, hypsometric color mapping, height exaggeration 0.5x-5x)
- [x] 3D Polygonal Mesh Generator (Triangulated regular heightfield grid, wireframe/textured/solid modes)
- [x] Three.js / React Three Fiber Scene Viewer (Lighting, OrbitControls, Grid, Axes, Bounds, North Arrow)
- [x] Autonomous Camera Path Planner (Centripetal Catmull-Rom spline trajectory with smooth interpolation)
- [x] Interactive 3D Flythrough Studio (Transport controls Play/Pause/Stop/Restart, Timeline scrubbing, 15/30/60s duration, Frame capture & Path JSON export)
- [x] Quantitative Height & Intelligence Report (Recharts visualizations, JSON/CSV/PDF exports)
- [x] SIH 2026 Presentation Mode (Fullscreen multi-panel dashboard with automated 1-click end-to-end demo)
- [x] Pre-bundled Demo Mode (Complete synthetic multi-structure satellite dataset with zero-wait testing)
- [x] Comprehensive Test Suite (16/16 Unit & API Integration Tests Passing)
- [x] Production Frontend Build (`tsc -b && vite build` bundled in 5.75s)
- [x] Complete Technical Documentation (Architecture, ML pipeline, Depth estimation, 3D reconstruction, Flythrough, API, Demo, Limitations, SIH Demo Script)
- [x] Containerization Config (Dockerfiles for Backend & Frontend, docker-compose.yml, Nginx proxy)

## Active Services & Ports
- **Frontend**: `http://127.0.0.1:5173/` (Vite dev server running)
- **Backend API**: `http://127.0.0.1:8000/` (Uvicorn FastAPI server running)
- **Database**: `depthwizard.db` (SQLite in workspace root)

## Commands Reference
```bash
# Backend Launch
cd backend
python init_db.py
uvicorn app.main:app --host 127.0.0.1 --port 8000

# Frontend Launch
cd frontend
npm install
npm run dev

# Run Tests
pytest tests/

# Build Production Frontend
cd frontend
npm run build
```

## Database Schema (All Initialized)
- `projects`: id, name, description, status, created_at, updated_at
- `image_assets`: id, project_id, filename, original_filename, filepath, file_size, width, height, channels, image_type, upload_time
- `processing_jobs`: id, project_id, image_id, status, progress, current_stage, message, result_json, created_at, updated_at
- `depth_results`: id, job_id, project_id, depth_map_path, min_depth, max_depth, mean_depth, inference_time, model_used, is_demo
- `calibrations`: id, project_id, method, reference_height, focal_length, camera_altitude, fov, scale_factor, is_estimated
- `height_measurements`: id, project_id, depth_result_id, min_height, max_height, mean_height, building_heights_json, confidence
- `reconstructions`: id, project_id, point_cloud_path, mesh_path, num_points, num_faces, created_at
- `flythroughs`: id, project_id, reconstruction_id, path_json, duration, created_at
- `reports`: id, project_id, report_data_json, created_at

## Verified API Endpoints (100% Tested)
- `GET /` -> Health/Welcome message
- `GET /api/v1/health` -> Service availability & model flag
- `POST /api/v1/projects/` -> Project creation
- `GET /api/v1/projects/` -> Project listing
- `GET /api/v1/projects/{id}` -> Project retrieval
- `POST /api/v1/upload/` -> Image upload & type analysis
- `POST /api/v1/preprocess` -> CLAHE, resize, denoise
- `POST /api/v1/segment` -> Region classification
- `POST /api/v1/depth/estimate` -> MiDaS / Heuristic monocular depth map
- `POST /api/v1/calibrate/` -> Metric scale calibration
- `POST /api/v1/height/estimate` -> Structure height extraction
- `POST /api/v1/height/at-point` -> Point height query
- `POST /api/v1/reconstruct/pointcloud` -> 3D Point cloud generation
- `POST /api/v1/reconstruct/mesh` -> 3D Surface mesh triangulation
- `POST /api/v1/flythrough/path` -> Catmull-Rom spline trajectory
- `POST /api/v1/flythrough/render` -> Flythrough config & render specs
- `GET /api/v1/reports/{id}` -> Full project report
- `GET /api/v1/reports/{id}/export/json` -> JSON export
- `GET /api/v1/reports/{id}/export/csv` -> Building heights CSV export
- `GET /api/v1/demo/` -> Demo asset metadata
- `POST /api/v1/demo/run` -> End-to-end pipeline execution with synthetic dataset

## Frontend Routes (All Built & Verified)
- `/` -> Landing Page (Hero, Brand, Pipeline Preview, Tech Badges)
- `/dashboard` -> Dashboard (Project analytics, quick metrics, recent analyses)
- `/upload` -> Upload & Preprocessing (Drag-and-drop, RGB/BW badge, Demo launcher)
- `/processing/:id?` -> Pipeline Tracker (11 animated sequential stages)
- `/depth/:id?` -> Depth Map Viewer (Side-by-side original vs depth, Turbo legend)
- `/height/:id?` -> Height Analysis (Metrics cards, Elevation histogram, Structure table)
- `/reconstruction/:id?` -> 3D Reconstruction Viewer (Point cloud, Mesh, Exaggeration controls)
- `/flythrough/:id?` -> Cinematic Flythrough Studio (Transport controls, Timeline scrubbing, Spline path)
- `/reports/:id?` -> Intelligence Reports (Visual overview, CSV/JSON/PDF exports)
- `/about` -> Methodology & Technical Documentation
- `/presentation` -> Fullscreen Jury Presentation Mode (Automated 1-click live demo)

## Verification & Test Results
- **Pytest**: 16/16 Passed (1.10s)
- **TypeScript**: 0 Errors (`npx tsc --noEmit` exit 0)
- **Vite Build**: Production Bundle Generated (`dist/` in 5.75s)
- **Vite Proxy**: Both `/api` and `/data` verified over HTTP
- **Static Asset Serving**: Tested with 200 OK for `/data/uploads` and `/data/outputs`
