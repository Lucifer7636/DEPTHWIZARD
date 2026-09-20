import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { client, getMediaUrl } from '../api/client';
import { CheckCircle, Circle, Loader2, XCircle, ArrowRight, Clock } from 'lucide-react';

const STAGES = [
  'Image Input',
  'Pre-processing',
  'Object Detection',
  'Depth Estimation',
  'Scale Calibration',
  'Height Estimation',
  '3D Point Cloud',
  'Mesh Generation',
  'Camera Path Planning',
  'Flythrough Rendering',
  'Report Generation',
];

const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isDemo = useStore(state => state.isDemo);
  const demoData = useStore(state => state.demoData);

  const setDepthResult = useStore(state => state.setDepthResult);
  const setHeightData = useStore(state => state.setHeightData);
  const setCalibration = useStore(state => state.setCalibration);
  const setReconstructionInfo = useStore(state => state.setReconstructionInfo);
  const setCameraPath = useStore(state => state.setCameraPath);
  const setOriginalImageUrl = useStore(state => state.setOriginalImageUrl);
  const setDepthImageUrl = useStore(state => state.setDepthImageUrl);
  const setPointCloudData = useStore(state => state.setPointCloudData);
  const setMeshData = useStore(state => state.setMeshData);

  const [currentStage, setCurrentStage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const executionStartedRef = useRef(false);

  // Simulate pipeline progression for demo mode
  useEffect(() => {
    if (!isDemo && !demoData && id !== 'demo') return;

    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= STAGES.length - 1) {
          clearInterval(interval);
          setCompleted(true);
          return prev;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isDemo, demoData, id]);

  // Real processing pipeline for uploaded image
  useEffect(() => {
    // Defensive: if we're on a real project route, clear any stale demo data
    if (id && id !== 'demo' && !isDemo) {
      if (demoData) {
        useStore.getState().setDemoData(null);
        return; // Will re-trigger this effect with demoData=null
      }
    }

    if (isDemo || demoData || id === 'demo' || !id) return;
    if (executionStartedRef.current) return;
    executionStartedRef.current = true;

    const runRealPipeline = async () => {
      const projectId = parseInt(id, 10);
      if (isNaN(projectId)) {
        setError(`Invalid project ID: ${id}`);
        return;
      }

      try {
        // Check if project has already been completed (e.g. page refresh)
        try {
          const reportRes = await client.getReport(projectId);
          if (reportRes?.report_data?.depth_stats?.max > 0) {
            const imgData = await client.getProjectImage(projectId).catch(() => null);
            if (imgData) {
              const baseName = imgData.filename.replace(/\.[^/.]+$/, '');
              setOriginalImageUrl(getMediaUrl(`/data/uploads/${imgData.filename}`));
              setDepthImageUrl(getMediaUrl(`/data/outputs/${baseName}_depth.png`));
              setDepthResult({
                depth_map_path: '',
                depth_image_url: getMediaUrl(`/data/outputs/${baseName}_depth.png`),
                min_depth: reportRes.report_data.depth_stats.min,
                max_depth: reportRes.report_data.depth_stats.max,
                mean_depth: reportRes.report_data.depth_stats.mean,
                inference_time: 0.1,
                model_used: 'Depth Model',
                is_demo: false,
              });
            }
            if (reportRes.report_data.height_stats) {
              setHeightData({
                min_height: reportRes.report_data.height_stats.min_height,
                max_height: reportRes.report_data.height_stats.max_height,
                mean_height: reportRes.report_data.height_stats.mean_height,
                scale_factor: reportRes.report_data.calibration?.scale_factor || 50,
                num_buildings: reportRes.report_data.height_stats.buildings?.length || 0,
                buildings: reportRes.report_data.height_stats.buildings || [],
                confidence: 0.85,
                unit: 'meters (estimated)',
              });
            }
            if (reportRes.report_data.calibration) {
              setCalibration(reportRes.report_data.calibration);
            }
            setCurrentStage(STAGES.length - 1);
            setCompleted(true);
            return;
          }
        } catch {
          // Project not yet completed, proceed to execute pipeline
        }

        // 0. Image Input
        setCurrentStage(0);
        let imageId = (location.state as any)?.imageId;
        let filename = (location.state as any)?.filename;

        if (!imageId) {
          const imgAsset = await client.getProjectImage(projectId);
          imageId = imgAsset.id;
          filename = imgAsset.filename;
        }

        if (filename) {
          setOriginalImageUrl(getMediaUrl(`/data/uploads/${filename}`));
        }

        // 1. Pre-processing
        setCurrentStage(1);
        await client.preprocess(projectId, imageId);

        // 2. Object Detection / Segmentation
        setCurrentStage(2);
        await client.segment(projectId, imageId);

        // 3. Depth Estimation
        setCurrentStage(3);
        const depthRes = await client.estimateDepth(projectId, imageId);
        const baseName = filename ? filename.replace(/\.[^/.]+$/, '') : `img_${imageId}`;
        const depthImgUrl = getMediaUrl(`/data/outputs/${baseName}_depth.png`);
        setDepthImageUrl(depthImgUrl);
        setDepthResult({
          id: depthRes.id,
          depth_map_path: depthRes.depth_map_path,
          depth_image_url: depthImgUrl,
          min_depth: depthRes.min_depth,
          max_depth: depthRes.max_depth,
          mean_depth: depthRes.mean_depth,
          inference_time: depthRes.inference_time,
          model_used: depthRes.model_used,
          is_demo: false,
        });

        // 4. Scale Calibration
        setCurrentStage(4);
        const calibRes = await client.calibrate(projectId, {});
        setCalibration(calibRes);

        // 5. Height Estimation
        setCurrentStage(5);
        const heightRes = await client.estimateHeight(projectId, depthRes.id);
        setHeightData(heightRes);

        // 6. 3D Point Cloud
        setCurrentStage(6);
        const pcRes = await client.generatePointCloud(projectId, depthRes.id);

        // 7. Mesh Generation
        setCurrentStage(7);
        const meshRes = await client.generateMesh(projectId, depthRes.id);
        setReconstructionInfo({
          point_cloud_path: pcRes.point_cloud_path,
          mesh_path: meshRes.mesh_path,
          num_points: pcRes.num_points,
          num_faces: meshRes.num_faces,
        });

        // Pre-load 3D data into memory
        if (pcRes.point_cloud_path) {
          client.loadPointCloudData(pcRes.point_cloud_path).then(setPointCloudData).catch(console.error);
        }
        if (meshRes.mesh_path) {
          client.loadMeshData(meshRes.mesh_path).then(setMeshData).catch(console.error);
        }

        // 8. Camera Path Planning
        setCurrentStage(8);
        const flyRes = await client.generateFlythroughPath(projectId, pcRes.id || 0, 30);
        setCameraPath(flyRes.path);

        // 9. Flythrough Rendering
        setCurrentStage(9);
        await client.renderFlythrough();

        // 10. Report Generation
        setCurrentStage(10);
        await client.getReport(projectId);

        setCompleted(true);
      } catch (err: any) {
        console.error('Pipeline execution error:', err);
        const message = err.response?.data?.detail || err.message || 'Processing failed';
        setError(`Processing failed: ${message}`);
      }
    };

    runRealPipeline();
  }, [id, isDemo, demoData, location.state]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 100);
    if (completed || error) clearInterval(timer);
    return () => clearInterval(timer);
  }, [completed, error, startTime]);

  const progress = Math.round(((currentStage + (completed ? 1 : 0)) / STAGES.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processing Pipeline</h1>
          <p className="text-gray-500 mt-1">
            {error ? (
              <span className="text-red-600 font-medium">Processing halted due to error</span>
            ) : completed ? (
              'Pipeline completed successfully!'
            ) : (
              `Processing stage ${currentStage + 1} of ${STAGES.length}...`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">{(elapsed / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              error ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Demo Badge */}
      {isDemo && (
        <div className="mb-6 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          🔬 Demo Mode — Using synthetic satellite data and {demoData?.model_available ? 'AI model' : 'demo estimation'}
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-1">
          {STAGES.map((stage, i) => {
            let status: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
            if (error && i === currentStage) {
              status = 'failed';
            } else if (i < currentStage || (completed && i === currentStage)) {
              status = 'completed';
            } else if (i === currentStage && !completed) {
              status = 'running';
            }

            return (
              <div key={stage} className="flex items-center gap-4 py-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {status === 'running' && <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />}
                  {status === 'failed' && <XCircle className="w-6 h-6 text-red-500" />}
                  {status === 'pending' && <Circle className="w-6 h-6 text-gray-300" />}
                </div>
                {/* Stage Name */}
                <span className={`flex-1 font-medium text-sm ${
                  status === 'completed' ? 'text-green-700' :
                  status === 'running' ? 'text-cyan-700' :
                  status === 'failed' ? 'text-red-700' :
                  'text-gray-400'
                }`}>
                  {stage}
                </span>
                {/* Status Badge */}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  status === 'completed' ? 'bg-green-100 text-green-700' :
                  status === 'running' ? 'bg-cyan-100 text-cyan-700' :
                  status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {status === 'completed' ? 'Done' : status === 'running' ? 'Running' : status === 'failed' ? 'Failed' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Actions */}
      {completed && (
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(isDemo ? '/depth/demo' : `/depth/${id}`)}
            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            View Depth Map <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(isDemo ? '/reconstruction/demo' : `/reconstruction/${id}`)}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            View 3D Model <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(isDemo ? '/reports/demo' : `/reports/${id}`)}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            View Report <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProcessingPage;
