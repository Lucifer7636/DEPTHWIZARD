# Smart India Hackathon (SIH) 2026: Live Presentation & Demo Script

**Project Title**: DepthWizard  
**Problem Statement ID**: 26175  
**Target Duration**: 3 to 5 Minutes  
**Audience**: SIH Technical Jury, Geospatial Experts & Domain Mentors  

---

## Presentation Overview & Timing Roadmap

```
+----------------------------------------------------------------------------------------------------+
| 0:00 - 0:35 | 0:35 - 1:15 | 1:15 - 1:55 | 1:55 - 2:40 | 2:40 - 3:30 | 3:30 - 4:15 | 4:15 - 5:00    |
| Problem &   | Ingestion & | Seg & Depth | Calibration | 3D Orbit &  | Reports &   | Real-World App |
| Intro       | Preproc     | Estimation  | & Heights   | Flythrough  | Exports     | & Jury Q&A     |
+----------------------------------------------------------------------------------------------------+
```

---

## Step-by-Step Demonstration Walkthrough

### Step 1: Open DepthWizard — Show Landing Page
- **Time**: `0:00 - 0:20`
- **Action**: Open browser at `http://localhost:5173`. The landing page hero banner is displayed with badges for SIH 2026, FastAPI, PyTorch, and Three.js.
- **Screen State**: Modern dark-mode interface with headline: *"Transform 2D Monocular Aerial Imagery into Metric 3D Digital Elevation Twins"*.
- **Speaker Talking Points**:
  > *"Respected Jury members, welcome to DepthWizard. We are addressing Problem Statement 26175: 3D Visualization and Height Estimation from Single Satellite and Aerial Imagery. Traditional 3D reconstruction requires multi-camera stereo rigs or expensive LiDAR flights. DepthWizard eliminates those requirements. With just a single 2D image—RGB or grayscale—we generate an interactive 3D digital elevation model with calibrated building heights in seconds."*

---

### Step 2: Explain System Architecture & Value Proposition
- **Time**: `0:20 - 0:40`
- **Action**: Scroll briefly to show the high-level architecture diagram and technology stack (React Three Fiber, FastAPI, PyTorch MiDaS, SQLite).
- **Screen State**: Architecture section highlighting the decoupled ML inference pipeline and WebGL rendering engine.
- **Speaker Talking Points**:
  > *"Our pipeline couples state-of-the-art vision transformers like MiDaS and DPT with an instant computer vision fallback engine. We combine morphological segmentation, ground-datum extraction, and metric scale calibration to turn dimensionless relative disparities into verified physical heights."*

---

### Step 3: Upload Image or Click Demo Mode
- **Time**: `0:40 - 0:55`
- **Action**: Click the primary call-to-action button: **"Launch Live Demo"** (or click **"Upload"** and drag-and-drop `urban_commercial_nadir.png`).
- **Screen State**: A modal shows real-time progress indicators: `[Image Ingested] -> [Preprocessing...]`.
- **Speaker Talking Points**:
  > *"To demonstrate our end-to-end pipeline in real time, I'm launching our automated demo. Notice that DepthWizard handles both standard RGB aerial photography and single-band panchromatic satellite imagery."*

---

### Step 4: Show RGB + Black & White (Grayscale) Input Handling
- **Time**: `0:55 - 1:15`
- **Action**: Navigate to the **Processing Stage** screen. Show the dual-view toggle between RGB color and normalized grayscale.
- **Screen State**: Split preview displaying the high-resolution RGB aerial survey alongside the panchromatic single-channel image.
- **Speaker Talking Points**:
  > *"Satellite imagery often arrives as panchromatic grayscale, while UAV drones provide RGB. DepthWizard's ingestion layer validates resolution, bit depth, and color channels, standardizing any input into a calibrated tensor format."*

---

### Step 5: Run Preprocessing Pipeline
- **Time**: `1:15 - 1:35`
- **Action**: Click **"Run Preprocessing"** (or point to the automated output).
- **Screen State**: Preprocessing card displays the image enhanced via Contrast Limited Adaptive Histogram Equalization (CLAHE) and bilateral edge-preserving smoothing.
- **Speaker Talking Points**:
  > *"In aerial imaging, shadows and haze obscure structural boundaries. Our preprocessing engine applies CLAHE and edge-preserving filtering to suppress sensor noise while accentuating rooftop parapets and parcel boundaries."*

---

### Step 6: Show Semantic Feature Segmentation
- **Time**: `1:35 - 1:55`
- **Action**: Click on the **"Segmentation"** tab.
- **Screen State**: Multi-color binary mask separating identified building envelopes (cyan) from background terrain and roadways (deep blue).
- **Speaker Talking Points**:
  > *"Next, our segmentation engine extracts building footprints. By separating structures from ground terrain, we establish localized baseline datums for true elevation delta calculations."*

---

### Step 7: Show AI Depth Map with Scientific Colormap Legend
- **Time**: `1:55 - 2:15`
- **Action**: Click on the **"Depth Map"** tab. Switch between colormaps: **Viridis** and **Turbo**.
- **Screen State**: Depth visualization showing high-elevation rooftops in bright yellow/red and ground terrain in deep purple/blue, complete with an interactive numerical legend ($0.0 \to 1.0$).
- **Speaker Talking Points**:
  > *"Here is the predicted depth map. Our neural network has inferred relative proximity directly from monocular perspective cues. Notice how the building roofs pop out with crisp, sharp boundaries, while streets recede into the baseline background."*

---

### Step 8: Show Metric Height Estimation & Calibration
- **Time**: `2:15 - 2:40`
- **Action**: Click on the **"Height Analytics"** tab. Adjust the **Reference Height Slider** to `25.0 meters` and click **"Recalibrate"**.
- **Screen State**: Bar chart showing individual detected buildings with estimated metric heights (e.g., Tower 1: 38.4m, Wing 2: 24.5m, Mean: 16.8m, Confidence: 89%).
- **Speaker Talking Points**:
  > *"Monocular depth suffers from scale ambiguity. DepthWizard solves this with our Metric Calibration Engine. By providing a single reference height or drone altitude, the system calibrates the entire scene. Here we see building heights accurately computed in meters along with automated confidence scores based on rooftop planarity."*

---

### Step 9: Open 3D Digital Elevation Reconstruction
- **Time**: `2:40 - 3:00`
- **Action**: Click the button **"View 3D Elevation Model"**.
- **Screen State**: The Three.js WebGL viewport mounts instantly, rendering the full 3D polygonal mesh surface and dense point cloud.
- **Speaker Talking Points**:
  > *"Now we transition to the core highlight: real-time 3D reconstruction. DepthWizard unprojects the 2D depth matrix into 3D Cartesian coordinates, constructing over 60,000 triangular faces and 120,000 points at a smooth 60 frames per second."*

---

### Step 10: Rotate & Inspect 3D Model with OrbitControls
- **Time**: `3:00 - 3:15`
- **Action**: Click and drag with mouse to smoothly rotate the 3D model, showing the vertical building walls and structural depth. Zoom in to a rooftop and tilt the view.
- **Screen State**: Smooth orbit animation showing the three-dimensional relief, perpendicular building drop-offs, and ground plane.
- **Speaker Talking Points**:
  > *"Using our interactive OrbitControls, inspectors can pan, zoom, and orbit around any building cluster. What was a flat 2D photograph is now a fully manipulable 3D digital elevation twin."*

---

### Step 11: Toggle Height Colormaps & Wireframe Overlays
- **Time**: `3:15 - 3:30`
- **Action**: Toggle the viewport mode:
  1. Click **"Hypsometric Colormap"** (Viridis elevation tint).
  2. Toggle **"Wireframe Mode"** to show underlying geometry.
  3. Adjust the **"Height Exaggeration Slider"** from $1.0\times$ to $2.5\times$.
- **Screen State**: The model transitions from photo-textured realism to scientific elevation gradients, showing the underlying wireframe mesh and accentuated topography.
- **Speaker Talking Points**:
  > *"Analysts can switch between true photogrammetric color textures and hypsometric elevation tints. Our dynamic height exaggeration slider amplifies subtle topographic variations, making drainage slopes and roof parapets immediately obvious."*

---

### Step 12: Start Autonomous Cinematic Flythrough
- **Time**: `3:30 - 3:55`
- **Action**: Click **"Start Flythrough"**.
- **Screen State**: The camera takes flight along a smooth, curved path, descending from a high nadir survey down to a 360-degree perimeter sweep around the main tower before ascending smoothly.
- **Speaker Talking Points**:
  > *"A static view is not enough for modern tactical missions. DepthWizard features an Autonomous Drone Flythrough Engine. Using Centripetal Catmull-Rom spline mathematics, we generate smooth, cusp-free camera trajectories at 30 frames per second, simulating an unmanned aerial surveillance flight."*

---

### Step 13: Review & Export Automated Project Report
- **Time**: `3:55 - 4:15`
- **Action**: Click on the **"Reports"** tab. Click **"Download CSV"** and **"Download JSON"**.
- **Screen State**: Comprehensive analytics dashboard showing structural inventories, height distributions, footprint areas, and export buttons.
- **Speaker Talking Points**:
  > *"Once analysis is complete, DepthWizard compiles a comprehensive geospatial report. With one click, municipal authorities and disaster response teams can export building inventories to CSV, analytics to JSON, or generate a formal PDF report."*

---

### Step 14: Explain Real-World Impact & Applications
- **Time**: `4:15 - 4:45`
- **Action**: Switch to presentation summary slide or final dashboard view.
- **Screen State**: Clean dashboard showing the five core application domains.
- **Speaker Talking Points**:
  > *"DepthWizard has immediate, high-impact applications across five major sectors:*
  > 1. *Urban Planning & Smart Cities: Rapid auditing of building floor counts and municipal zoning compliance.*
  > 2. *Disaster Response & Flood Modeling: Instant post-cyclone or earthquake elevation mapping to model flood inundation without waiting for specialized survey crews.*
  > 3. *Defense & Tactical Reconnaissance: Creating 3D mission planning environments from a single satellite reconnaissance pass.*
  > 4. *Infrastructure & Highway Monitoring: Calculating cut-and-fill earthwork volumes and monitoring corridor encroachments.*
  > 5. *Environmental Monitoring: Tracking coastal erosion, quarry excavation depths, and forestry canopy heights.*
  >
  > *In conclusion, DepthWizard proves that high-accuracy 3D geospatial intelligence does not require expensive hardware—it requires smart computer vision algorithms. Thank you, and we are ready for your questions!"*

---

## Anticipated Jury Q&A & Expert Responses

### Q1: "How do you overcome the fundamental scale ambiguity of monocular depth?"
> **Answer**:  
> *"Monocular neural networks output relative inverse depth (disparity). We solve the scale ambiguity through two primary mechanisms: First, reference object calibration, where a known structure or building height scales the relative disparity into physical meters. Second, when telemetry is available, we use the drone altitude and camera sensor FOV to compute the Ground Sampling Distance (GSD) and derive an absolute metric scale factor."*

### Q2: "What happens if there is no internet connection or no GPU at an edge site?"
> **Answer**:  
> *"DepthWizard is engineered with zero external dependency lock-in. If PyTorch weights or GPUs are unavailable, our built-in Computer Vision Heuristic Fallback Engine takes over. It executes multi-scale Canny edge detection, Euclidean distance transforms, and Sobel gradients in less than 100 milliseconds purely on CPU, ensuring uninterrupted field operations."*

### Q3: "How does the system handle building shadows caused by low sun angles?"
> **Answer**:  
> *"Deep cast shadows can trick convolutional filters into predicting deep pits. Our preprocessing stage incorporates Contrast Limited Adaptive Histogram Equalization (CLAHE) and multi-channel chromaticity normalization to recover shadow penumbra details before depth estimation. Additionally, our morphological ground filter prevents shadow areas from sinking below the regional terrain baseline."*

### Q4: "How scalable is the 3D rendering for large satellite rasters?"
> **Answer**:  
> *"Directly converting every pixel of a 4K image would produce 16 million polygons, crashing browser WebGL. DepthWizard uses regular grid spatial decimation—sampling every 4th pixel for point clouds and every 8th pixel for surface meshes. This generates lightweight meshes of 60,000 triangles that render at a locked 60 FPS in Three.js on any standard laptop."*
