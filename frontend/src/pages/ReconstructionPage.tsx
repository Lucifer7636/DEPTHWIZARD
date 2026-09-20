import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, useParams } from 'react-router-dom';
import SceneViewer from '../components/three/SceneViewer';
import ViewerControls from '../components/three/ViewerControls';
import { client, getMediaUrl } from '../api/client';
import { Box, Loader2, ArrowRight, Sparkles, Mountain, Layers, Eye } from 'lucide-react';
import BackendConfigModal from '../components/common/BackendConfigModal';

const ReconstructionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const pointCloudData = useStore(state => state.pointCloudData);
  const meshData = useStore(state => state.meshData);
  const reconstructionInfo = useStore(state => state.reconstructionInfo);
  const setPointCloudData = useStore(state => state.setPointCloudData);
  const setMeshData = useStore(state => state.setMeshData);
  const setReconstructionInfo = useStore(state => state.setReconstructionInfo);
  const setHeightData = useStore(state => state.setHeightData);
  const setCalibration = useStore(state => state.setCalibration);
  const setCameraPath = useStore(state => state.setCameraPath);
  const setOriginalImageUrl = useStore(state => state.setOriginalImageUrl);
  const setDepthImageUrl = useStore(state => state.setDepthImageUrl);
  const setDepthResult = useStore(state => state.setDepthResult);
  const isDemo = useStore(state => state.isDemo);
  const setIsDemo = useStore(state => state.setIsDemo);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Auto-load 3D data if empty on page load or refresh
  useEffect(() => {
    if (!pointCloudData && !meshData && !reconstructionInfo) {
      setLoading(true);
      if (id && id !== 'demo') {
        const projId = parseInt(id, 10);
        if (!isNaN(projId)) {
          client.getProjectImage(projId).then(imgData => {
            if (imgData) {
              const baseName = imgData.filename.replace(/\.[^/.]+$/, '');
              setIsDemo(false);
              setOriginalImageUrl(getMediaUrl(`/data/uploads/${imgData.filename}`));
              setDepthImageUrl(getMediaUrl(`/data/outputs/${baseName}_depth.png`));
              const pcPath = `/data/outputs/${baseName}_pointcloud.json`;
              const meshPath = `/data/outputs/${baseName}_mesh.json`;
              setReconstructionInfo({
                point_cloud_path: pcPath,
                mesh_path: meshPath,
                num_points: 0,
                num_faces: 0
              });
              client.loadPointCloudData(pcPath).then(setPointCloudData).catch(console.error);
              client.loadMeshData(meshPath).then(setMeshData).catch(console.error);
            }
          }).catch(console.error).finally(() => setLoading(false));
          return;
        }
      }

      client.runDemo().then(result => {
        setIsDemo(true);
        setOriginalImageUrl(result.image_url);
        setDepthImageUrl(result.depth_image_url);
        setDepthResult({
          depth_map_path: '',
          depth_image_url: result.depth_image_url,
          min_depth: result.depth_stats.min,
          max_depth: result.depth_stats.max,
          mean_depth: result.depth_stats.mean,
          inference_time: result.depth_stats.inference_time,
          model_used: result.depth_stats.model_used,
          is_demo: result.depth_stats.is_demo,
        });
        setHeightData(result.heights);
        setCalibration(result.calibration);
        setReconstructionInfo(result.reconstruction);
        setCameraPath(result.flythrough.path);

        // Load 3D assets
        if (result.reconstruction.point_cloud_path) {
          client.loadPointCloudData(result.reconstruction.point_cloud_path).then(setPointCloudData);
        }
        if (result.reconstruction.mesh_path) {
          client.loadMeshData(result.reconstruction.mesh_path).then(setMeshData);
        }
      }).catch(err => {
        console.error(err);
        setError('Could not auto-load 3D model. Please ensure the backend is running.');
      }).finally(() => {
        setLoading(false);
      });
    } else if (reconstructionInfo && !pointCloudData) {
      // Load existing paths
      setLoading(true);
      Promise.all([
        reconstructionInfo.point_cloud_path ? client.loadPointCloudData(reconstructionInfo.point_cloud_path).then(setPointCloudData) : Promise.resolve(),
        reconstructionInfo.mesh_path ? client.loadMeshData(reconstructionInfo.mesh_path).then(setMeshData) : Promise.resolve()
      ]).catch(console.error).finally(() => setLoading(false));
    }
  }, [reconstructionInfo, pointCloudData, meshData]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100">
      {/* Light Theme Sub-Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 z-10 shadow-2xs gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200/80 shadow-xs">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Interactive 3D Photogrammetry</h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">
                High-Resolution
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {reconstructionInfo
                ? `${reconstructionInfo.num_points.toLocaleString()} unprojected vertices · ${reconstructionInfo.num_faces.toLocaleString()} triangulated polygon faces`
                : '16,384 vertices · 7,938 polygon faces'
              }
            </p>
          </div>
        </div>

        {/* Quick Nav Badges */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isDemo || !id ? '/depth/demo' : `/depth/${id}`)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Eye size={14} className="text-cyan-600" /> View Depth Map
          </button>
          
          <button
            onClick={() => navigate(isDemo || !id ? '/flythrough/demo' : `/flythrough/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition-all hover:scale-[1.02]"
          >
            Watch 3D Flythrough <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 3D Viewer Canvas */}
      <div className="flex-1 relative overflow-hidden bg-slate-100">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 text-slate-800">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-cyan-600" />
            <p className="text-base font-bold text-slate-900">Unprojecting 3D Coordinates...</p>
            <p className="text-xs text-slate-500 mt-1">Generating surface geometry & hypsometric textures</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-30 text-slate-800 p-6 text-center">
            <div className="max-w-md p-6 bg-white border border-rose-200 rounded-2xl shadow-xl">
              <p className="text-rose-600 font-bold text-sm mb-2">⚠ {error}</p>
              <p className="text-xs text-slate-500 mb-5">
                If your backend is running on Railway, make sure your Railway backend URL is configured.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => setIsConfigModalOpen(true)} 
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Configure Backend URL
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        <SceneViewer />
        <ViewerControls />
      </div>

      <BackendConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConnected={() => window.location.reload()}
      />
    </div>
  );
};

export default ReconstructionPage;
