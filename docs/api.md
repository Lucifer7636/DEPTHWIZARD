# DepthWizard REST API Specification

The DepthWizard backend exposes a modular, RESTful API built on **FastAPI**. All computational and persistence endpoints are versioned under the `/api/v1` namespace.

**Base URL**: `http://localhost:8000/api/v1`  
**Interactive OpenAPI Documentation (Swagger)**: `http://localhost:8000/docs`  
**ReDoc Documentation**: `http://localhost:8000/redoc`

---

## Table of Endpoints

| Category | Method | Endpoint Path | Summary |
|---|---|---|---|
| **Health** | `GET` | `/health/` | Service health status & ML model availability |
| **Projects** | `POST` | `/projects/` | Create a new reconstruction project |
| | `GET` | `/projects/` | Retrieve a list of all projects |
| | `GET` | `/projects/{id}` | Retrieve details for a specific project |
| **Upload** | `POST` | `/upload/` | Upload an aerial or satellite image |
| **Processing** | `POST` | `/preprocess` | Preprocess and enhance image (CLAHE, denoising) |
| | `POST` | `/segment` | Segment terrain, buildings, and ground features |
| **Depth** | `POST` | `/depth/estimate` | Compute monocular depth estimation map |
| **Calibration**| `POST` | `/calibrate/` | Calibrate metric scale factor |
| **Height** | `POST` | `/height/estimate` | Extract building & elevation height measurements |
| **3D Mesh** | `POST` | `/reconstruct/pointcloud` | Generate 3D point cloud coordinate buffer |
| | `POST` | `/reconstruct/mesh` | Generate triangulated 3D polygonal surface mesh |
| **Flythrough** | `POST` | `/flythrough/path` | Calculate Catmull-Rom spline camera flightpath |
| | `POST` | `/flythrough/render` | Validate camera trajectory rendering engine |
| **Reports** | `GET` | `/reports/{project_id}` | Generate/retrieve comprehensive project report |
| | `GET` | `/reports/{project_id}/export/json`| Export report analytics payload as JSON |
| | `GET` | `/reports/{project_id}/export/csv` | Export building inventory table as CSV |
| **Demo** | `GET` | `/demo/` | Retrieve demo metadata and sample assets |
| | `POST` | `/demo/run` | Trigger automated end-to-end demo execution |

---

## 1. System Health

### `GET /health/`
Checks backend responsiveness and hardware-accelerated ML framework status.

- **Request**: None
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "model_available": true
}
```

---

## 2. Project Management

### `POST /projects/`
Initializes a new geospatial reconstruction workspace.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Connaught Place Urban Survey",
  "description": "Aerial drone survey of circular commercial blocks"
}
```
- **Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Connaught Place Urban Survey",
  "description": "Aerial drone survey of circular commercial blocks",
  "status": "created",
  "created_at": "2026-09-09T11:00:00Z",
  "updated_at": null
}
```

---

### `GET /projects/`
Retrieves all registered reconstruction projects.

- **Request**: None
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Connaught Place Urban Survey",
    "description": "Aerial drone survey of circular commercial blocks",
    "status": "created",
    "created_at": "2026-09-09T11:00:00Z",
    "updated_at": null
  }
]
```

---

### `GET /projects/{id}`
Fetches status and metadata for a single project by ID.

- **URL Parameter**: `id` (integer, required)
- **Response**: `200 OK` or `404 Not Found`
```json
{
  "id": 1,
  "name": "Connaught Place Urban Survey",
  "description": "Aerial drone survey of circular commercial blocks",
  "status": "completed",
  "created_at": "2026-09-09T11:00:00Z",
  "updated_at": "2026-09-09T11:05:00Z"
}
```

---

## 3. Image Ingestion

### `POST /upload/`
Uploads an aerial RGB or grayscale raster for processing.

- **Request Headers**: `Content-Type: multipart/form-data`
- **Form Parameters**:
  - `project_id` (integer, required): Target project ID.
  - `file` (binary, required): Supported formats: PNG, JPG, JPEG, TIFF, WebP (up to 50 MB).
- **Response**: `200 OK`
```json
{
  "id": 101,
  "project_id": 1,
  "filename": "aerial_survey_01.png",
  "original_filename": "aerial_survey_01.png",
  "filepath": "data/uploads/aerial_survey_01.png",
  "file_size": 4194304,
  "width": 1920,
  "height": 1080,
  "channels": 3,
  "image_type": "RGB",
  "upload_time": "2026-09-09T11:01:20Z"
}
```

---

## 4. Image Preprocessing & Segmentation

### `POST /preprocess`
Executes histogram equalization (CLAHE), noise filtering, and grayscale alignment.

- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Form Parameters**:
  - `image_id` (integer, required): Target image ID.
- **Response**: `200 OK`
```json
{
  "message": "Preprocessed",
  "path": "data/outputs/aerial_survey_01_preprocessed.png"
}
```

---

### `POST /segment`
Performs feature contour extraction, separating structural footprints from ground terrain.

- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Form Parameters**:
  - `image_id` (integer, required): Target image ID.
- **Response**: `200 OK`
```json
{
  "segmentation_path": "data/outputs/aerial_survey_01_seg.npy",
  "label": "structures_and_terrain"
}
```

---

## 5. Depth Estimation

### `POST /depth/estimate`
Triggers monocular depth estimation using MiDaS/DPT or CV heuristic fallback.

- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Form Parameters**:
  - `project_id` (integer, required): Associated project ID.
  - `image_id` (integer, required): Target image asset ID.
- **Response**: `200 OK`
```json
{
  "id": 201,
  "depth_map_path": "data/outputs/aerial_survey_01_depth.npy",
  "min_depth": 0.021,
  "max_depth": 0.984,
  "mean_depth": 0.432,
  "inference_time": 0.145,
  "model_used": "MiDaS_small"
}
```

---

## 6. Metric Scale Calibration

### `POST /calibrate/`
Establishes conversion factors between relative depth units and physical meters.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "project_id": 1,
  "reference_height": 24.5,
  "focal_length": 35.0,
  "camera_altitude": 150.0,
  "fov": 65.0
}
```
- **Response**: `200 OK`
```json
{
  "id": 301,
  "scale_factor": 48.72,
  "is_estimated": false
}
```

---

## 7. Height Estimation

### `POST /height/estimate`
Computes elevation profiles, terrain baseline, and per-building height measurements.

- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Form Parameters**:
  - `project_id` (integer, required): Project identifier.
  - `depth_result_id` (integer, required): Depth result identifier.
- **Response**: `200 OK`
```json
{
  "id": 401,
  "min_height": 0.0,
  "max_height": 38.4,
  "mean_height": 14.2,
  "confidence": 0.85,
  "building_heights": [
    {
      "building_id": 1,
      "estimated_height": 24.5,
      "area_m2": 420.0,
      "stories": 7,
      "confidence": 0.92
    },
    {
      "building_id": 2,
      "estimated_height": 18.2,
      "area_m2": 310.0,
      "stories": 5,
      "confidence": 0.88
    },
    {
      "building_id": 3,
      "estimated_height": 38.4,
      "area_m2": 850.0,
      "stories": 11,
      "confidence": 0.84
    }
  ]
}
```

---

## 8. 3D Digital Elevation Reconstruction

### `POST /reconstruct/pointcloud`
Constructs 3D point coordinates with mapped vertex colors.

- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Form Parameters**:
  - `project_id` (integer, required): Project ID.
  - `depth_result_id` (integer, required): Depth result ID.
- **Response**: `200 OK`
```json
{
  "id": 501,
  "point_cloud_path": "data/outputs/aerial_survey_01_pointcloud.json",
  "num_points": 129600
}
```

---

### `POST /reconstruct/mesh`
Synthesizes a continuous, triangulated 3D polygonal surface mesh.

- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Form Parameters**:
  - `project_id` (integer, required): Project ID.
  - `depth_result_id` (integer, required): Depth result ID.
- **Response**: `200 OK`
```json
{
  "id": 502,
  "mesh_path": "data/outputs/aerial_survey_01_mesh.json",
  "num_faces": 64800
}
```

---

## 9. Cinematic Flythrough

### `POST /flythrough/path`
Generates a 30 FPS Centripetal Catmull-Rom spline trajectory for automated camera flight.

- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Form Parameters**:
  - `project_id` (integer, required): Project ID.
  - `reconstruction_id` (integer, required): Associated 3D reconstruction ID.
- **Response**: `200 OK`
```json
{
  "id": 601,
  "duration": 10.0,
  "path_points": [
    {
      "position": [0.0, 0.0, 10.0],
      "target": [0.0, 0.0, 0.0],
      "up": [0.0, 1.0, 0.0],
      "time": 0.0
    },
    {
      "position": [0.82, 0.82, 9.45],
      "target": [0.0, 0.0, 0.0],
      "up": [0.0, 1.0, 0.0],
      "time": 0.033
    }
  ]
}
```

---

### `POST /flythrough/render`
Validates camera path configuration and triggers viewport animation handshake.

- **Request**: None
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "message": "Render configuration generated."
}
```

---

## 10. Reports & Analytics Export

### `GET /reports/{project_id}`
Retrieves complete aggregated analysis data for a project.

- **URL Parameter**: `project_id` (integer, required)
- **Response**: `200 OK`
```json
{
  "id": 1,
  "project_id": 1,
  "report_data": {
    "project_name": "Connaught Place Urban Survey",
    "total_structures": 14,
    "max_building_height_m": 38.4,
    "mean_building_height_m": 16.8,
    "total_built_footprint_m2": 18450.0,
    "reconstruction_fidelity": "high",
    "calibration_method": "reference_object",
    "timestamp": "2026-09-09T11:10:00Z"
  }
}
```

---

### `GET /reports/{project_id}/export/json`
Streams project summary and structure inventories as a downloadable JSON file.

- **URL Parameter**: `project_id` (integer, required)
- **Response**: `200 OK`, `Content-Type: application/json`

---

### `GET /reports/{project_id}/export/csv`
Streams building inventory table as a CSV spreadsheet.

- **URL Parameter**: `project_id` (integer, required)
- **Response**: `200 OK`, `Content-Type: text/csv`
- **Sample Output**:
```csv
building_id,height_meters,stories,footprint_area_m2,confidence
1,24.5,7,420.0,0.92
2,18.2,5,310.0,0.88
3,38.4,11,850.0,0.84
```

---

## 11. Demo Automation

### `GET /demo/`
Returns pre-bundled demo dataset information.

- **Response**: `200 OK`
```json
{
  "title": "DepthWizard SIH 2026 Demo Dataset",
  "sample_image": "urban_commercial_nadir.png",
  "preconfigured_calibration": {
    "reference_height": 28.0,
    "camera_altitude": 200.0
  }
}
```

---

### `POST /demo/run`
Spawns an automated demo project, executes processing, and returns the project ID for instant inspection.

- **Request**: None
- **Response**: `200 OK`
```json
{
  "message": "Demo project created and processing started",
  "project_id": 99
}
```
