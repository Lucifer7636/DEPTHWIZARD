import axios, { InternalAxiosRequestConfig } from 'axios';

// Get base URL for backend API
// Priority:
// 1. User runtime override saved in localStorage (e.g. configured via UI modal)
// 2. Vite environment variable VITE_API_URL or VITE_BACKEND_URL
// 3. Empty string '' (relative path for local Vite proxy or Vercel rewrites)
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const customUrl = localStorage.getItem('depthwizard_api_url');
      if (customUrl && customUrl.trim()) {
        return customUrl.trim().replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
      }
    } catch {
      // localStorage may fail in restricted environments
    }

    // On Vercel and local development, ALWAYS use same-origin relative URLs ('') so Vercel rewrites
    // and Vite dev proxies handle /api and /data routing without CORS errors, preflight delays, or ORB blocks.
    const hostname = window.location.hostname;
    if (hostname.endsWith('vercel.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
  }
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
  }
  return '';
};

export const setCustomApiBaseUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    try {
      if (url && url.trim()) {
        localStorage.setItem('depthwizard_api_url', url.trim().replace(/\/+$/, ''));
      } else {
        localStorage.removeItem('depthwizard_api_url');
      }
    } catch {
      // Ignore
    }
  }
  const current = getApiBaseUrl();
  api.defaults.baseURL = current ? `${current}/api/v1` : '/api/v1';
};

// Convert relative /data/... paths to full backend URLs when backend is hosted elsewhere (e.g. Railway)
export const getMediaUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (
    path.startsWith('http://') || 
    path.startsWith('https://') || 
    path.startsWith('blob:') || 
    path.startsWith('data:')
  ) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
};

// Helper to test connectivity to a given backend URL or the currently configured one
export const testBackendConnection = async (targetUrl?: string): Promise<{ ok: boolean; message: string; modelAvailable?: boolean }> => {
  const base = targetUrl !== undefined ? targetUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const testUrl = base ? `${base}/api/v1/health` : '/api/v1/health';
  try {
    const res = await axios.get(testUrl, { timeout: 10000 });
    if (res.data?.status === 'ok') {
      return { ok: true, message: 'Connected successfully', modelAvailable: res.data?.model_available };
    }
    return { ok: false, message: `Unexpected response: ${JSON.stringify(res.data)}` };
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Connection failed';
    return { ok: false, message: detail };
  }
};

const initialBase = getApiBaseUrl();
const api = axios.create({
  baseURL: initialBase ? `${initialBase}/api/v1` : '/api/v1',
  timeout: 120000, // 2 min timeout for ML tasks
});

// Request interceptor to keep baseURL updated if changed dynamically
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const currentBase = getApiBaseUrl();
  config.baseURL = currentBase ? `${currentBase}/api/v1` : '/api/v1';
  return config;
});

export interface DemoResult {
  message: string;
  project_id: number;
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
  segmentation: {
    path: string;
    labels: string;
  };
  calibration: {
    scale_factor: number;
    method: string;
    is_estimated: boolean;
  };
  heights: {
    min_height: number;
    max_height: number;
    mean_height: number;
    scale_factor: number;
    num_buildings: number;
    buildings: Array<{
      id: number;
      estimated_height: number;
      min_height: number;
      max_height: number;
      mean_height: number;
      area_pixels: number;
      centroid: [number, number];
    }>;
    confidence: number;
    unit: string;
  };
  reconstruction: {
    point_cloud_path: string;
    mesh_path: string;
    num_points: number;
    num_faces: number;
  };
  flythrough: {
    path: Array<{
      position: [number, number, number];
      target: [number, number, number];
      up: [number, number, number];
      time: number;
    }>;
    duration: number;
  };
  model_available: boolean;
}

export const client = {
  // Health
  getHealth: async () => {
    const { data } = await api.get('/health');
    return data;
  },

  // Projects
  createProject: async (name: string, description?: string) => {
    const { data } = await api.post('/projects', { name, description });
    return data;
  },
  getProjects: async () => {
    const { data } = await api.get('/projects');
    return data;
  },
  getProject: async (id: number) => {
    const { data } = await api.get(`/projects/${id}`);
    return data;
  },

  // Upload
  uploadImage: async (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('file', file);
    const { data } = await api.post('/upload', formData);
    return data;
  },
  getProjectImage: async (projectId: number) => {
    const { data } = await api.get(`/upload/project/${projectId}`);
    return data;
  },

  // Processing
  preprocess: async (projectId: number, imageId: number) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('image_id', String(imageId));
    const { data } = await api.post('/preprocess', formData);
    return data;
  },
  segment: async (projectId: number, imageId: number) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('image_id', String(imageId));
    const { data } = await api.post('/segment', formData);
    return data;
  },

  // Depth
  estimateDepth: async (projectId: number, imageId: number) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('image_id', String(imageId));
    const { data } = await api.post('/depth/estimate', formData);
    return data;
  },

  // Calibration
  calibrate: async (projectId: number, params: {
    reference_height?: number;
    focal_length?: number;
    camera_altitude?: number;
    fov?: number;
  }) => {
    const { data } = await api.post('/calibrate', {
      project_id: projectId,
      ...params
    });
    return data;
  },

  // Height
  estimateHeight: async (projectId: number, depthResultId: number) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('depth_result_id', String(depthResultId));
    const { data } = await api.post('/height/estimate', formData);
    return data;
  },

  // Reconstruction
  generatePointCloud: async (projectId: number, depthResultId: number) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('depth_result_id', String(depthResultId));
    const { data } = await api.post('/reconstruct/pointcloud', formData);
    return data;
  },
  generateMesh: async (projectId: number, depthResultId: number) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('depth_result_id', String(depthResultId));
    const { data } = await api.post('/reconstruct/mesh', formData);
    return data;
  },

  // Flythrough
  generateFlythroughPath: async (projectId: number, reconstructionId: number, duration?: number) => {
    const formData = new FormData();
    formData.append('project_id', String(projectId));
    formData.append('reconstruction_id', String(reconstructionId));
    if (duration) formData.append('duration', String(duration));
    const { data } = await api.post('/flythrough/path', formData);
    return data;
  },
  renderFlythrough: async () => {
    const { data } = await api.post('/flythrough/render');
    return data;
  },

  // Reports
  getReport: async (projectId: number) => {
    const { data } = await api.get(`/reports/${projectId}`);
    return data;
  },
  exportReportJSON: async (projectId: number) => {
    const { data } = await api.get(`/reports/${projectId}/export/json`);
    return data;
  },
  exportReportCSV: async (projectId: number) => {
    const { data } = await api.get(`/reports/${projectId}/export/csv`, { responseType: 'blob' });
    return data;
  },

  // Demo
  getDemo: async () => {
    const { data } = await api.get('/demo');
    return {
      ...data,
      image_path: getMediaUrl(data.image_path),
      bw_image_path: getMediaUrl(data.bw_image_path),
      depth_path: getMediaUrl(data.depth_path),
      segmentation_path: getMediaUrl(data.segmentation_path),
    };
  },
  runDemo: async (): Promise<DemoResult> => {
    const { data } = await api.post('/demo/run');
    return {
      ...data,
      image_url: getMediaUrl(data.image_url),
      bw_image_url: getMediaUrl(data.bw_image_url),
      depth_image_url: getMediaUrl(data.depth_image_url),
    };
  },

  // Load point cloud/mesh JSON data
  loadPointCloudData: async (path: string) => {
    const filename = path.split(/[\\/]/).pop();
    const relativePath = path.startsWith('/data/') ? path : `/data/outputs/${filename}`;
    const url = getMediaUrl(relativePath);
    const { data } = await axios.get(url);
    return data;
  },
  loadMeshData: async (path: string) => {
    const filename = path.split(/[\\/]/).pop();
    const relativePath = path.startsWith('/data/') ? path : `/data/outputs/${filename}`;
    const url = getMediaUrl(relativePath);
    const { data } = await axios.get(url);
    return data;
  },
};

export default client;
