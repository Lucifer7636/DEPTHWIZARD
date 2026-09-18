import { create } from 'zustand';
import type { 
  Project, ProcessingJob, DepthResult, HeightMeasurement, 
  PointCloudData, MeshData, CameraKeyframe, DemoData,
  CalibrationData, ReconstructionInfo
} from '../types';

interface AppState {
  // Data
  currentProject: Project | null;
  projects: Project[];
  currentJob: ProcessingJob | null;
  depthResult: DepthResult | null;
  heightData: HeightMeasurement | null;
  calibration: CalibrationData | null;
  pointCloudData: PointCloudData | null;
  meshData: MeshData | null;
  reconstructionInfo: ReconstructionInfo | null;
  cameraPath: CameraKeyframe[];
  demoData: DemoData | null;
  
  // UI State
  isDemo: boolean;
  modelAvailable: boolean;
  flythroughPlaying: boolean;
  flythroughProgress: number;
  flythroughDuration: number;
  flythroughSpeed: number;
  heightExaggeration: number;
  viewMode: 'pointcloud' | 'mesh' | 'wireframe' | 'textured';
  pointSize: number;
  
  // Image URLs
  originalImageUrl: string | null;
  bwImageUrl: string | null;
  depthImageUrl: string | null;
  
  // Actions
  setProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  setJob: (job: ProcessingJob | null) => void;
  setDepthResult: (result: DepthResult | null) => void;
  setHeightData: (data: HeightMeasurement | null) => void;
  setCalibration: (data: CalibrationData | null) => void;
  setPointCloudData: (data: PointCloudData | null) => void;
  setMeshData: (data: MeshData | null) => void;
  setReconstructionInfo: (info: ReconstructionInfo | null) => void;
  setCameraPath: (path: CameraKeyframe[]) => void;
  setDemoData: (data: DemoData | null) => void;
  setIsDemo: (isDemo: boolean) => void;
  setModelAvailable: (available: boolean) => void;
  setFlythroughPlaying: (playing: boolean) => void;
  setFlythroughProgress: (progress: number) => void;
  setFlythroughDuration: (duration: number) => void;
  setFlythroughSpeed: (speed: number) => void;
  setHeightExaggeration: (exaggeration: number) => void;
  setViewMode: (mode: 'pointcloud' | 'mesh' | 'wireframe' | 'textured') => void;
  setPointSize: (size: number) => void;
  setOriginalImageUrl: (url: string | null) => void;
  setBwImageUrl: (url: string | null) => void;
  setDepthImageUrl: (url: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentProject: null,
  projects: [],
  currentJob: null,
  depthResult: null,
  heightData: null,
  calibration: null,
  pointCloudData: null,
  meshData: null,
  reconstructionInfo: null,
  cameraPath: [],
  demoData: null,
  isDemo: false,
  modelAvailable: false,
  flythroughPlaying: false,
  flythroughProgress: 0,
  flythroughDuration: 30,
  flythroughSpeed: 1,
  heightExaggeration: 1,
  viewMode: 'pointcloud' as const,
  pointSize: 2,
  originalImageUrl: null,
  bwImageUrl: null,
  depthImageUrl: null,
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setJob: (job) => set({ currentJob: job }),
  setDepthResult: (result) => set({ depthResult: result }),
  setHeightData: (data) => set({ heightData: data }),
  setCalibration: (data) => set({ calibration: data }),
  setPointCloudData: (data) => set({ pointCloudData: data }),
  setMeshData: (data) => set({ meshData: data }),
  setReconstructionInfo: (info) => set({ reconstructionInfo: info }),
  setCameraPath: (path) => set({ cameraPath: path }),
  setDemoData: (data) => set({ demoData: data }),
  setIsDemo: (isDemo) => set({ isDemo }),
  setModelAvailable: (available) => set({ modelAvailable: available }),
  setFlythroughPlaying: (playing) => set({ flythroughPlaying: playing }),
  setFlythroughProgress: (progress) => set({ flythroughProgress: progress }),
  setFlythroughDuration: (duration) => set({ flythroughDuration: duration }),
  setFlythroughSpeed: (speed) => set({ flythroughSpeed: speed }),
  setHeightExaggeration: (exaggeration) => set({ heightExaggeration: exaggeration }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPointSize: (size) => set({ pointSize: size }),
  setOriginalImageUrl: (url) => set({ originalImageUrl: url }),
  setBwImageUrl: (url) => set({ bwImageUrl: url }),
  setDepthImageUrl: (url) => set({ depthImageUrl: url }),
  reset: () => set(initialState),
}));
