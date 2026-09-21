import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ImageUploader from '../components/upload/ImageUploader';
import { client, getMediaUrl } from '../api/client';
import { useStore } from '../store/useStore';
import { Play, Settings2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import BackendConfigModal from '../components/common/BackendConfigModal';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setProject = useStore(state => state.setProject);
  const setIsDemo = useStore(state => state.setIsDemo);
  const setDemoData = useStore(state => state.setDemoData);
  const setDepthResult = useStore(state => state.setDepthResult);
  const setHeightData = useStore(state => state.setHeightData);
  const setCameraPath = useStore(state => state.setCameraPath);
  const setOriginalImageUrl = useStore(state => state.setOriginalImageUrl);
  const setDepthImageUrl = useStore(state => state.setDepthImageUrl);
  const setCalibration = useStore(state => state.setCalibration);
  const setReconstructionInfo = useStore(state => state.setReconstructionInfo);
  const setModelAvailable = useStore(state => state.setModelAvailable);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const [options, setOptions] = useState({
    resize: true,
    enhance: false,
    denoise: false
  });

  // Auto-launch demo if ?demo=true
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      runDemo('rgb');
    }
  }, []);

  const handleUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);
  };

  const normalizeImageForUpload = (inputFile: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(inputFile);
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(inputFile);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(inputFile);
              return;
            }
            const baseName = inputFile.name.replace(/\.[^/.]+$/, '');
            const cleanFile = new File([blob], `${baseName}.png`, { type: 'image/png' });
            resolve(cleanFile);
          }, 'image/png');
        } catch {
          resolve(inputFile);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(inputFile);
      };
      img.src = url;
    });
  };

  const handleStartProcessing = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      // Clear ALL previous data (demo results, stale project data) before real upload
      useStore.getState().reset();
      const project = await client.createProject(file.name, 'User uploaded analysis');
      setProject(project);
      setIsDemo(false);
      setDemoData(null); // Explicit extra guard

      // Normalize non-standard/AVIF image formats to standard PNG
      let uploadFile = file;
      try {
        uploadFile = await normalizeImageForUpload(file);
      } catch (normErr) {
        console.warn('Image normalization skipped:', normErr);
      }

      const imageResult = await client.uploadImage(project.id, uploadFile);
      setOriginalImageUrl(getMediaUrl(`/data/uploads/${imageResult.filename}`));
      navigate(`/processing/${project.id}`, { state: { imageId: imageResult.id, filename: imageResult.filename } });
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (err.message || 'Failed to start processing. Please ensure the backend is running.');
      setError(`Failed to start processing: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const runDemo = async (type: 'rgb' | 'bw') => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.runDemo();
      setProject({ id: result.project_id, name: 'Demo Project', status: 'completed' });
      setIsDemo(true);
      setModelAvailable(result.model_available);
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
        is_demo: result.depth_stats.is_demo
      });
      setHeightData(result.heights);
      setCalibration(result.calibration);
      setReconstructionInfo(result.reconstruction);
      setCameraPath(result.flythrough.path);
      setDemoData({
        image_url: result.image_url,
        bw_image_url: result.bw_image_url,
        depth_image_url: result.depth_image_url,
        depth_stats: result.depth_stats,
        heights: result.heights,
        reconstruction: result.reconstruction,
        flythrough: result.flythrough,
        calibration: result.calibration,
        model_available: result.model_available,
      });
      navigate('/processing/demo');
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (err.message || 'Failed to run demo. Please ensure the backend is running.');
      setError(`Failed to run demo: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">New Analysis</h1>
      <p className="text-gray-500 mb-8">Upload a satellite or aerial image, or try the demo mode</p>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <p className="font-bold text-rose-800">Connection Error</p>
            <p className="text-rose-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            Configure Backend URL
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Zone */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-600" /> Upload Satellite Image
            </h2>
            <ImageUploader onUpload={handleUpload} />
          </div>

          {/* Preprocessing Options */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-cyan-600" /> Preprocessing Options
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { key: 'resize', label: 'Auto-resize to optimal dimensions', desc: 'Resizes large images to 1024px for faster processing' },
                { key: 'enhance', label: 'Enhance Contrast (CLAHE)', desc: 'Improves visibility in low-contrast regions' },
                { key: 'denoise', label: 'Denoise Image', desc: 'Bilateral filtering to reduce noise while preserving edges' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={options[opt.key as keyof typeof options]}
                    onChange={e => setOptions({ ...options, [opt.key]: e.target.checked })}
                    className="w-5 h-5 accent-cyan-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartProcessing}
            disabled={!file || loading}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            Start Processing
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-sm border border-cyan-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">🚀 Demo Mode</h2>
            <p className="text-sm text-gray-600 mb-4">No image? Try our pre-configured demo to see the full pipeline in action.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => runDemo('rgb')}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-cyan-50 text-cyan-700 border border-cyan-300 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                RGB Demo Image
              </button>
              <button
                onClick={() => runDemo('bw')}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                B&W Demo Image
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Supported Formats</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {['JPG', 'JPEG', 'PNG', 'TIFF'].map(fmt => (
                <span key={fmt} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{fmt}</span>
              ))}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tips</h3>
            <ul className="text-sm text-gray-500 space-y-1.5 list-disc pl-4">
              <li>Use nadir (top-down) satellite images</li>
              <li>RGB images give the best results</li>
              <li>Images with buildings produce richer 3D</li>
              <li>Max file size: 50 MB</li>
            </ul>
          </div>
        </div>
      </div>

      <BackendConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConnected={() => {
          setError(null);
          runDemo('rgb');
        }}
      />
    </div>
  );
};

export default UploadPage;
