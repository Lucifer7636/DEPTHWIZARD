import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, PlayCircle, CheckCircle2, ArrowRight, Eye, Mountain, Box, Plane, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { client, DemoResult } from '../api/client';

const PresentationPage: React.FC = () => {
  const navigate = useNavigate();
  const setIsDemo = useStore(state => state.setIsDemo);
  const setOriginalImageUrl = useStore(state => state.setOriginalImageUrl);
  const setDepthImageUrl = useStore(state => state.setDepthImageUrl);
  const setDepthResult = useStore(state => state.setDepthResult);
  const setHeightData = useStore(state => state.setHeightData);
  const setCalibration = useStore(state => state.setCalibration);
  const setReconstructionInfo = useStore(state => state.setReconstructionInfo);
  const setCameraPath = useStore(state => state.setCameraPath);
  const setDemoData = useStore(state => state.setDemoData);
  const setProject = useStore(state => state.setProject);

  const [step, setStep] = useState(0); // 0=idle, 1..6=panels, 7=done
  const [loading, setLoading] = useState(false);
  const [demoResult, setDemoResultState] = useState<DemoResult | null>(null);

  const runFullDemo = async () => {
    setLoading(true);
    setStep(1);
    try {
      const result = await client.runDemo();
      setDemoResultState(result);

      // Populate Zustand store
      setProject({ id: result.project_id, name: 'SIH Presentation Demo', status: 'completed' });
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

      // Sequential animation through the 6 stages
      for (let s = 2; s <= 6; s++) {
        await new Promise(r => setTimeout(r, 600));
        setStep(s);
      }
      await new Promise(r => setTimeout(r, 500));
      setStep(7);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col overflow-y-auto">
      {/* Light Glass Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-cyan-500/20">
            D
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center gap-2 text-slate-900">
              DEPTH<span className="text-cyan-600">WIZARD</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
                SIH 2026 Presentation Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Smart India Hackathon • Problem Statement 26175</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-800"
          title="Exit Presentation"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-7xl mx-auto w-full">
        {step === 0 ? (
          <div className="text-center max-w-3xl my-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold mb-6">
              <Sparkles size={14} className="text-cyan-600" />
              Automated Evaluation Walkthrough for Judges
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900">
              One-Click End-to-End <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">Pipeline Demo</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-normal">
              Observe single-view inverse photogrammetry in action: transforming a 2D satellite image through AI monocular depth estimation, metric calibration, 3D point cloud generation, and spline flight path rendering.
            </p>
            <button 
              onClick={runFullDemo}
              disabled={loading}
              className="px-10 py-4 font-bold text-white text-lg rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-xl shadow-cyan-600/30 flex items-center gap-3 mx-auto disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <PlayCircle className="w-6 h-6" /> Execute Full Pipeline Demo
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6 my-auto">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
                <h2 className="text-base font-bold text-slate-900">
                  Automated Pipeline Progression: {step < 7 ? `Executing Stage ${step} of 6...` : 'Complete!'}
                </h2>
              </div>
              {step < 7 && (
                <span className="text-xs text-cyan-700 font-mono font-semibold bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
                  Processing tensors & unprojecting geometry...
                </span>
              )}
            </div>

            {/* 6 Grid Panels in Crisp Light Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Panel 1 */}
              <div className={`rounded-2xl border p-4 transition-all duration-500 flex flex-col bg-white ${
                step >= 1 ? 'border-cyan-400 shadow-md shadow-cyan-500/10' : 'border-slate-200 opacity-40'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                    <ImageIcon className="w-4 h-4 text-cyan-600" /> 1. Input Imagery (RGB / B&W)
                  </span>
                  {step > 1 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="aspect-video rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                  {demoResult?.image_url ? (
                    <img src={demoResult.image_url} alt="2D Satellite" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-slate-400">Loading satellite scene...</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2.5">512×512 nadir satellite aerial raster</p>
              </div>

              {/* Panel 2 */}
              <div className={`rounded-2xl border p-4 transition-all duration-500 flex flex-col bg-white ${
                step >= 2 ? 'border-cyan-400 shadow-md shadow-cyan-500/10' : 'border-slate-200 opacity-40'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                    <Eye className="w-4 h-4 text-cyan-600" /> 2. Monocular Depth Estimation
                  </span>
                  {step > 2 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="aspect-video rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                  {demoResult?.depth_image_url ? (
                    <img src={demoResult.depth_image_url} alt="Depth Map" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-slate-400">Estimating relative depth...</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2.5">
                  Model: <strong className="text-slate-700">{demoResult?.depth_stats.model_used || 'MiDaS DPT'}</strong> ({demoResult?.depth_stats.inference_time.toFixed(2) || '0.02'}s)
                </p>
              </div>

              {/* Panel 3 */}
              <div className={`rounded-2xl border p-4 transition-all duration-500 flex flex-col bg-white ${
                step >= 3 ? 'border-cyan-400 shadow-md shadow-cyan-500/10' : 'border-slate-200 opacity-40'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                    <Mountain className="w-4 h-4 text-cyan-600" /> 3. Height & Rooftop Extraction
                  </span>
                  {step > 3 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="aspect-video rounded-xl bg-slate-50 p-4 flex flex-col justify-center gap-2 border border-slate-200 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Max Elevation:</span>
                    <span className="text-cyan-700 font-bold">{demoResult?.heights.max_height.toFixed(1) || '51.4'} m</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mean Elevation:</span>
                    <span className="text-emerald-700 font-bold">{demoResult?.heights.mean_height.toFixed(1) || '21.8'} m</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Segmented Structures:</span>
                    <span className="text-purple-700 font-bold">{demoResult?.heights.num_buildings || 7} detected</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2.5">Metric calibrated scale factor: 50.0m</p>
              </div>

              {/* Panel 4 */}
              <div className={`rounded-2xl border p-4 transition-all duration-500 flex flex-col bg-white ${
                step >= 4 ? 'border-cyan-400 shadow-md shadow-cyan-500/10' : 'border-slate-200 opacity-40'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                    <Box className="w-4 h-4 text-cyan-600" /> 4. 3D Mesh & Point Cloud
                  </span>
                  {step > 4 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="aspect-video rounded-xl bg-slate-50 p-4 flex flex-col justify-center items-center gap-1 border border-slate-200 text-center">
                  <p className="text-3xl font-black text-cyan-600 font-mono">
                    {demoResult?.reconstruction.num_points.toLocaleString() || '16,384'}
                  </p>
                  <p className="text-xs font-bold text-slate-700">3D Point Cloud Vertices</p>
                  <p className="text-xs text-slate-400">
                    {demoResult?.reconstruction.num_faces.toLocaleString() || '7,938'} Triangulated Surface Faces
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2.5">Real-time WebGL rendering ready</p>
              </div>

              {/* Panel 5 */}
              <div className={`rounded-2xl border p-4 transition-all duration-500 flex flex-col bg-white ${
                step >= 5 ? 'border-cyan-400 shadow-md shadow-cyan-500/10' : 'border-slate-200 opacity-40'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                    <Plane className="w-4 h-4 text-cyan-600" /> 5. Camera Flight Path Planning
                  </span>
                  {step > 5 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="aspect-video rounded-xl bg-slate-50 p-4 flex flex-col justify-center items-center border border-slate-200 text-center">
                  <p className="text-3xl font-black text-purple-600 font-mono">
                    {demoResult?.flythrough.path.length || '900'}
                  </p>
                  <p className="text-xs font-bold text-slate-700">Catmull-Rom Spline Keyframes</p>
                  <p className="text-xs text-slate-400">30 Seconds Duration @ 30 FPS</p>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2.5">Centripetal aerial spline trajectory</p>
              </div>

              {/* Panel 6 */}
              <div className={`rounded-2xl border p-4 transition-all duration-500 flex flex-col bg-white ${
                step >= 6 ? 'border-cyan-400 shadow-md shadow-cyan-500/10' : 'border-slate-200 opacity-40'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                    <FileText className="w-4 h-4 text-cyan-600" /> 6. GIS Intelligence Report
                  </span>
                  {step >= 6 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="aspect-video rounded-xl bg-slate-50 p-3 flex flex-col justify-center items-center border border-slate-200 text-center">
                  <p className="text-base font-bold text-emerald-700">Report Compiled</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-bold">JSON</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-bold">CSV</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px] font-bold">PDF</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2.5">Full quantitative elevation metrics</p>
              </div>
            </div>

            {/* Completion Bar */}
            {step >= 7 && (
              <div className="p-6 bg-white rounded-3xl border border-cyan-300 shadow-lg shadow-cyan-500/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Full SIH 2026 Pipeline Executed Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    The 3D scene, building heights, flythrough trajectory, and reports are ready for interactive exploration.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/reconstruction/demo')}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/20 transition flex items-center gap-2"
                  >
                    Open 3D Viewer <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/flythrough/demo')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-2"
                  >
                    Watch Flythrough <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/reports/demo')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-2"
                  >
                    View Report <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationPage;
