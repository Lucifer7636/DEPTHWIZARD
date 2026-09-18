# System Architecture & Technical Design Document

## 1. Executive Summary

**DepthWizard** is a full-stack computer vision and 3D geospatial reconstruction platform built for **Smart India Hackathon (SIH) 2026 (Problem Statement ID: 26175)**. The platform converts single (monocular) aerial and satellite images into metric-calibrated 3D Digital Elevation Models (DEM), extracts structural and terrain elevations, generates dense point clouds and textured meshes, renders real-time 3D web graphics, and computes cinematic camera flythrough trajectories.

---

## 2. End-to-End System Architecture

The DepthWizard platform follows a decoupled, service-oriented architecture comprising four primary tiers:
1. **Client Tier**: Single Page Application (SPA) developed in React 18, TypeScript, and Tailwind CSS, utilizing Three.js and React Three Fiber for WebGL/WebGPU hardware-accelerated 3D scene rendering.
2. **API & Gateway Tier**: Asynchronous Python backend powered by FastAPI, Uvicorn, and Nginx reverse proxy, providing RESTful endpoints, static asset streaming, and validation.
3. **Processing & ML Inference Tier**: Monocular depth estimation engines combining PyTorch deep neural networks (Intel ISL MiDaS / DPT) with an offline computer vision edge-distance heuristic fallback, morphological segmentation, and metric calibration routines.
4. **Persistence & Storage Tier**: Relational metadata management via SQLite (SQLAlchemy 2.0 AsyncIO / aiosqlite) coupled with local filesystem storage for raw imagery, intermediate tensor arrays (`.npy`), 3D coordinate meshes (`.json`), and generated inspection reports.

```mermaid
graph TD
    subgraph ClientTier["1. Client Tier (Browser)"]
        User([End User / Geospatial Analyst])
        subgraph ReactApp["React 18 SPA (Vite + TypeScript)"]
            UIState["Zustand State Store"]
            Views["Views (Dashboard, Upload, Depth, Height, 3D, Flythrough, Reports)"]
            WebGL["Three.js / React Three Fiber Canvas"]
            SplinePlayer["Trajectory Interpolator & Orbit Controls"]
        end
    end

    subgraph GatewayTier["2. Gateway & Routing Tier"]
        Nginx["Nginx Reverse Proxy (:80 / :5173)"]
        Uvicorn["Uvicorn ASGI Server (:8000)"]
    end

    subgraph BackendTier["3. Backend Application Tier (FastAPI)"]
        FastAPIApp["FastAPI Application (app.main)"]
        subgraph APIRouters["API Routers (/api/v1)"]
            R_Proj["projects.py"]
            R_Up["upload.py"]
            R_Proc["processing.py"]
            R_Depth["depth.py"]
            R_Calib["calibration.py"]
            R_Height["height.py"]
            R_Recon["reconstruction.py"]
            R_Fly["flythrough.py"]
            R_Rep["reports.py"]
            R_Demo["demo.py"]
            R_Health["health.py"]
        end
        subgraph CoreServices["Business Logic & Pipeline Services"]
            S_Image["ImageService (Validation, CLAHE, Formats)"]
            S_Seg["SegmentationService (Otsu, Edges, Contours)"]
            S_Depth["DepthService (Inference & Fallback)"]
            S_Calib["CalibrationService (Scale, FOV, Altitude)"]
            S_Height["HeightService (Building Heights & Ground Plane)"]
            S_Recon["ReconstructionService (Point Cloud & Mesh Grid)"]
            S_Fly["FlythroughService (Catmull-Rom Splines)"]
            S_Report["ReportService (JSON, CSV, PDF Generation)"]
        end
    end

    subgraph MLTier["4. ML & Computational Geometry Layer"]
        TorchRuntime["PyTorch Runtime (CUDA / MPS / CPU)"]
        MiDaSModel["MiDaS v2.1 / DPT Transformers"]
        CVFallback["OpenCV Multi-scale Heuristic Fallback"]
        NumPySciPy["NumPy / SciPy Array Processing"]
    end

    subgraph StorageTier["5. Storage & Persistence Tier"]
        DB[(SQLite Database via SQLAlchemy Async)]
        UploadsDir["data/uploads/ (Raw Aerial / Satellite Images)"]
        OutputsDir["data/outputs/ (Depth .npy, PNGs, Meshes, Reports)"]
        ModelCache["models/ & PyTorch Hub Cache"]
    end

    User <-->|HTTP / WebSocket| Views
    Views <--> WebGL
    Views <--> SplinePlayer
    Views <--> UIState
    ReactApp <-->|REST API Requests| Nginx
    Nginx -->|Proxy /api/ & /data/| Uvicorn
    Uvicorn --> FastAPIApp
    FastAPIApp --> APIRouters

    R_Proj --> DB
    R_Up --> S_Image
    R_Proc --> S_Image & S_Seg
    R_Depth --> S_Depth
    R_Calib --> S_Calib
    R_Height --> S_Height
    R_Recon --> S_Recon
    R_Fly --> S_Fly
    R_Rep --> S_Report
    R_Demo --> CoreServices

    S_Depth --> TorchRuntime
    TorchRuntime --> MiDaSModel
    S_Depth -.->|Fallback if no weights| CVFallback
    S_Recon & S_Fly & S_Height --> NumPySciPy

    S_Image --> UploadsDir
    S_Depth & S_Seg & S_Recon & S_Report --> OutputsDir
    MiDaSModel --> ModelCache
    CoreServices <--> DB
```

---

## 3. Data Flow Architecture

The data pipeline progresses sequentially from raw image ingestion through preprocessing, monocular depth estimation, scale calibration, height extraction, 3D reconstruction, and visualization.

```mermaid
flowchart LR
    A["Raw Image Input<br/>(Aerial RGB / B&W)"] --> B["Image Preprocessing<br/>(Noise Filter & CLAHE)"]
    B --> C["Feature Segmentation<br/>(Ground vs Structure Masks)"]
    B --> D["Monocular Depth Estimation<br/>(MiDaS or CV Fallback)"]
    
    C & D --> E["Metric Calibration<br/>(Scale Factor: Reference / Telemetry)"]
    E --> F["Height Measurement<br/>(Roof vs Terrain Elevations)"]
    
    D & B --> G["3D Reconstruction Engine"]
    G --> H["Point Cloud<br/>(x, y, z, r, g, b)"]
    G --> I["Triangulated Mesh<br/>(Vertices, Faces, UVs)"]
    
    G --> J["Camera Flight Path<br/>(Centripetal Catmull-Rom Spline)"]
    
    F & H & I & J --> K["Interactive 3D WebGL Viewer<br/>(React Three Fiber / Three.js)"]
    F & E --> L["Automated Report<br/>(PDF / CSV / JSON Analytics)"]
```

---

## 4. Component Diagram

```mermaid
graph TB
    subgraph FrontendComponents["Frontend Application Modules"]
        Nav["Navigation Bar & Route Switcher"]
        ProjMgr["Project Manager Component"]
        Uploader["File Dropzone & Upload Handler"]
        PreprocPanel["Preprocessing Control Panel"]
        DepthPanel["Depth Visualization with Colormap Selector"]
        HeightInspector["Building Height Bar Chart & Spatial Inspector"]
        Viewer3D["Three.js Viewport (Points, Mesh, Wireframe)"]
        SplineCtrl["Flythrough Trajectory Player Controls"]
        ReportViewer["Export & Analytics Dashboard"]
    end

    subgraph BackendComponents["Backend API Modules"]
        AuthMiddleware["CORS & Request Middleware"]
        UploadRouter["Upload Router (/upload)"]
        ProcessRouter["Processing Router (/preprocess, /segment)"]
        DepthRouter["Depth Router (/depth/estimate)"]
        CalibRouter["Calibration Router (/calibrate)"]
        HeightRouter["Height Router (/height/estimate)"]
        ReconRouter["Reconstruction Router (/reconstruct/...)"]
        FlyRouter["Flythrough Router (/flythrough/...)"]
        ReportRouter["Reports Router (/reports/...)"]
        HealthRouter["Health & Demo Router (/health, /demo)"]
    end

    subgraph ServiceLayer["Core Computational Services"]
        ImgProcSvc["Image Processing Service"]
        SegSvc["Segmentation Service"]
        DepthInferenceSvc["Depth Inference Service"]
        CalibEngine["Metric Calibration Engine"]
        HeightEngine["Height Estimation Engine"]
        MeshEngine["Point Cloud & Mesh Surface Engine"]
        SplineEngine["Catmull-Rom Spline Trajectory Engine"]
        ExportEngine["PDF/CSV/JSON Exporter"]
    end

    Uploader --> UploadRouter --> ImgProcSvc
    PreprocPanel --> ProcessRouter --> ImgProcSvc & SegSvc
    DepthPanel --> DepthRouter --> DepthInferenceSvc
    HeightInspector --> CalibRouter & HeightRouter --> CalibEngine & HeightEngine
    Viewer3D --> ReconRouter --> MeshEngine
    SplineCtrl --> FlyRouter --> SplineEngine
    ReportViewer --> ReportRouter --> ExportEngine
```

---

## 5. Database Schema Architecture

The relational database layer is managed using SQLAlchemy ORM with asynchronous execution via `aiosqlite`. It tracks projects, image assets, asynchronous processing jobs, depth results, metric calibrations, building height measurements, 3D reconstructions, flythrough trajectories, and reports.

```mermaid
erDiagram
    PROJECT ||--o{ IMAGE_ASSET : contains
    PROJECT ||--o{ PROCESSING_JOB : schedules
    PROJECT ||--o{ DEPTH_RESULT : generates
    PROJECT ||--o{ CALIBRATION : configures
    PROJECT ||--o{ HEIGHT_MEASUREMENT : evaluates
    PROJECT ||--o{ RECONSTRUCTION : builds
    PROJECT ||--o{ FLYTHROUGH : animates
    PROJECT ||--o{ REPORT : summarizes

    PROJECT {
        int id PK
        string name
        string description
        string status
        datetime created_at
        datetime updated_at
    }

    IMAGE_ASSET {
        int id PK
        int project_id FK
        string filename
        string original_filename
        string filepath
        int file_size
        int width
        int height
        int channels
        string image_type
        datetime upload_time
    }

    PROCESSING_JOB {
        int id PK
        int project_id FK
        int image_id FK
        string status
        int progress
        string current_stage
        string message
        text result_json
        datetime created_at
        datetime updated_at
    }

    DEPTH_RESULT {
        int id PK
        int job_id FK
        int project_id FK
        string depth_map_path
        float min_depth
        float max_depth
        float mean_depth
        float inference_time
        string model_used
        boolean is_demo
    }

    CALIBRATION {
        int id PK
        int project_id FK
        string method
        float reference_height
        float focal_length
        float camera_altitude
        float fov
        float scale_factor
        boolean is_estimated
    }

    HEIGHT_MEASUREMENT {
        int id PK
        int project_id FK
        int depth_result_id FK
        float min_height
        float max_height
        float mean_height
        text building_heights_json
        float confidence
    }

    RECONSTRUCTION {
        int id PK
        int project_id FK
        string point_cloud_path
        string mesh_path
        int num_points
        int num_faces
        datetime created_at
    }

    FLYTHROUGH {
        int id PK
        int project_id FK
        int reconstruction_id FK
        text path_json
        float duration
        datetime created_at
    }

    REPORT {
        int id PK
        int project_id FK
        text report_data_json
        datetime created_at
    }
```

---

## 6. API Sequence & Execution Lifecycle

The following sequence illustrates the chronological lifecycle of an end-user request through image ingestion, AI depth estimation, metric calibration, height measurement, 3D mesh building, and flythrough visualization.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client / User
    participant Frontend as React Frontend
    participant API as FastAPI Gateway
    participant Svc as Backend Services
    participant ML as ML Inference Engine
    participant DB as SQLite DB
    participant FS as File System Storage

    User->>Frontend: Select and Upload Aerial Image
    Frontend->>API: POST /api/v1/upload/ (multipart/form-data)
    API->>Svc: Validate file format & save bytes
    Svc->>FS: Write to data/uploads/image.png
    Svc->>DB: Insert ImageAsset record
    DB-->>API: ImageAsset ID
    API-->>Frontend: 200 OK (Image details)

    User->>Frontend: Click "Estimate Depth"
    Frontend->>API: POST /api/v1/depth/estimate (project_id, image_id)
    API->>Svc: Invoke estimate_depth(image_path)
    alt Neural Model Available (CUDA/CPU)
        Svc->>ML: Run PyTorch MiDaS forward pass
        ML-->>Svc: Relative inverse depth matrix
    else Offline / Fallback
        Svc->>ML: Run OpenCV Edge-Distance Gradient Fallback
        ML-->>Svc: Heuristic depth matrix
    end
    Svc->>FS: Save depth.npy and depth.png in data/outputs/
    Svc->>DB: Insert DepthResult record
    DB-->>API: DepthResult record
    API-->>Frontend: 200 OK (min/max/mean depth, paths, model)

    User->>Frontend: Set Calibration Parameter (e.g., Reference Height = 25m)
    Frontend->>API: POST /api/v1/calibrate/ (project_id, reference_height)
    API->>Svc: Calculate scale_factor
    Svc->>DB: Insert Calibration record
    API-->>Frontend: 200 OK (scale_factor)

    User->>Frontend: Click "Estimate Heights"
    Frontend->>API: POST /api/v1/height/estimate (project_id, depth_result_id)
    API->>Svc: Segment roofs, baseline terrain, calculate elevation deltas
    Svc->>DB: Insert HeightMeasurement record
    API-->>Frontend: 200 OK (min/max/mean building heights, JSON list)

    User->>Frontend: Click "Generate 3D Model"
    Frontend->>API: POST /api/v1/reconstruct/mesh (project_id, depth_result_id)
    API->>Svc: Unproject 2D grid to 3D vertices, compute faces & colors
    Svc->>FS: Save model_mesh.json
    Svc->>DB: Insert/Update Reconstruction record
    API-->>Frontend: 200 OK (mesh_path, num_faces)

    Frontend->>API: GET /data/outputs/model_mesh.json
    API-->>Frontend: Mesh vertices, faces, vertex colors
    Frontend->>Frontend: Mount Three.js BufferGeometry & OrbitControls

    User->>Frontend: Click "Start Cinematic Flythrough"
    Frontend->>API: POST /api/v1/flythrough/path (project_id, reconstruction_id)
    API->>Svc: Generate Catmull-Rom spline keyframes (30 fps)
    Svc->>DB: Insert Flythrough record
    API-->>Frontend: 200 OK (waypoint array [x, y, z])
    Frontend->>Frontend: Animate camera along trajectory loop
```

---

## 7. Performance & Scalability Characteristics

1. **Memory Footprint**:
   - Monocular inference is executed with image tiling or constrained resolutions ($384 \times 384$ or $512 \times 512$) to ensure operation within $< 2\text{ GB}$ system RAM.
2. **Subsampling in 3D Meshing**:
   - Direct $1:1$ pixel-to-vertex meshing on a $2048 \times 2048$ image produces $> 4\text{ million}$ vertices, overwhelming browser WebGL buffers. DepthWizard implements adaptive regular grid downsampling (stride $= 4$ for point clouds, stride $= 8$ for polygonal surface meshes), producing lightweight, photorealistic geometries of $\sim 30,000 - 65,000$ triangles that achieve smooth 60 FPS in Three.js.
3. **Graceful Fallback Execution**:
   - Total resilience against absent GPUs or network cutoffs: If PyTorch CUDA models fail to initialize, the CV heuristic fallback executes instantly in $< 150\text{ ms}$ on standard x86 and ARM CPUs.
