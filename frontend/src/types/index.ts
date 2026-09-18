export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImageAsset {
  id: number;
  project_id: number;
  filename: string;
  original_filename: string;
  filepath: string;
  file_size: number;
  width: number;
  height: number;
  channels: number;
  image_type: string;
}

export interface ProcessingJob {
  id: number;
  project_id: number;
  image_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_stage: string;
  message: string;
  result_json?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface DepthResult {
  id?: number;
  depth_map_path: string;
  depth_image_url: string;
  min_depth: number;
  max_depth: number;
  mean_depth: number;
  inference_time: number;
  model_used: string;
  is_demo: boolean;
}

export interface CalibrationData {
  scale_factor: number;
  method: string;
  is_estimated: boolean;
}

export interface BuildingHeight {
  id: number;
  estimated_height: number;
  min_height: number;
  max_height: number;
  mean_height: number;
  area_pixels: number;
  centroid: [number, number];
}

export interface HeightMeasurement {
  min_height: number;
  max_height: number;
  mean_height: number;
  scale_factor: number;
  num_buildings: number;
  buildings: BuildingHeight[];
  confidence: number;
  unit: string;
}

export interface PointCloudData {
  vertices: number[][];
  colors: number[][];
}

export interface MeshData {
  vertices: number[][];
  colors: number[][];
  faces: number[][];
}

export interface CameraKeyframe {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  time: number;
}

export interface ReconstructionInfo {
  point_cloud_path: string;
  mesh_path: string;
  num_points: number;
  num_faces: number;
}

export interface FlythroughData {
  path: CameraKeyframe[];
  duration: number;
}

export interface DemoData {
  image_url: string;
  bw_image_url: string;
  depth_image_url: string;
  depth_stats: {
    min: number;
    max: number;
    mean: number;
    inference_time: number;
    model_used: string;
    is_demo: boolean;
  };
  heights: HeightMeasurement;
  reconstruction: ReconstructionInfo;
  flythrough: FlythroughData;
  calibration: CalibrationData;
  model_available: boolean;
}
