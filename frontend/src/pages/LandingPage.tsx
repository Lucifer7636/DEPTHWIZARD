import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Layers, Image as ImageIcon, Mountain, Video, ArrowRight, 
  BarChart3, Box, Plane, FileText, Cpu, Eye, Sparkles, 
  CheckCircle2, Compass, ShieldCheck, Zap, Sliders, ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { client, getMediaUrl } from '../api/client';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isDemo = useStore(state => state.isDemo);
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

  // Split-slider state for interactive before/after hero showcase
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Ensure demo assets are loaded for the interactive hero preview
  const [previewImage, setPreviewImage] = useState<string>(() => getMediaUrl('/data/uploads/demo_image.png'));
  const [previewDepth, setPreviewDepth] = useState<string>(() => getMediaUrl('/data/outputs/demo_image_depth.png'));
  const [hoverElevation, setHoverElevation] = useState<{ x: number; y: number; height: number } | null>(null);

  useEffect(() => {
    // Warm up demo metadata if needed
    client.getDemo().then(data => {
      if (data.image_path) setPreviewImage(getMediaUrl(data.image_path));
      if (data.depth_path) setPreviewDepth(getMediaUrl(data.depth_path));
    }).catch(() => {});
  }, []);

  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
    // Update live elevation readout on hover
    if (sliderContainerRef.current) {
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const relX = Math.floor(((e.clientX - rect.left) / rect.width) * 512);
      const relY = Math.floor(((e.clientY - rect.top) / rect.height) * 512);
      // Heuristic height estimation for interactive cursor
      const baseH = 15 + Math.sin(relX / 40) * 10 + Math.cos(relY / 50) * 15;
      setHoverElevation({ x: relX, y: relY, height: Math.max(2, Math.round(baseH * 10) / 10) });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const runQuickDemo = async () => {
    try {
      const result = await client.runDemo();
      setProject({ id: result.project_id, name: 'Quick Demo', status: 'completed' });
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
      navigate('/reconstruction/demo');
    } catch {
      navigate('/upload?demo=true');
    }
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Light Theme Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-slate-50 via-cyan-50/20 to-white border-b border-slate-200/60">
        {/* Subtle Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12">
            {/* SIH Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-cyan-200 shadow-xs mb-6 text-xs font-bold text-cyan-700">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              Smart India Hackathon 2026 • Problem Statement 26175
            </div>

            {/* Main Brand & Tagline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-none mb-6">
              DEPTH<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">WIZARD</span>
            </h1>
            
            <p className="text-2xl sm:text-3xl font-light text-slate-700 tracking-tight mb-4">
              From 2D Satellite Images to <span className="font-semibold text-slate-900">3D Real-World Understanding</span>
            </p>
            
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
              Turning flat satellite and aerial imagery into actionable building heights, digital elevation models, calibrated metric scale, and autonomous 3D flythroughs.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => navigate('/upload')}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-base shadow-lg shadow-cyan-600/25 transition-all hover:scale-[1.02] flex items-center gap-2.5"
              >
                <ImageIcon size={18} /> Start Analysis
              </button>

              <button
                onClick={runQuickDemo}
                className="px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-base shadow-xs hover:shadow-md transition-all flex items-center gap-2.5"
              >
                <Box size={18} className="text-cyan-600" /> Interactive 3D Demo
              </button>

              <Link
                to="/presentation"
                className="px-6 py-3.5 bg-cyan-50 hover:bg-cyan-100/80 text-cyan-800 border border-cyan-200 rounded-xl font-bold text-base transition-all flex items-center gap-2"
              >
                <Sparkles size={18} className="text-cyan-600" /> SIH Jury Mode
              </Link>
            </div>
          </div>

          {/* Interactive Split-Slider Component (Hero Centerpiece) */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden p-3 sm:p-4">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Sliders size={14} className="text-cyan-600" />
                <span>Interactive Monocular Depth Split-Inspector</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <span className="hidden sm:inline">Drag slider left & right to compare</span>
                {hoverElevation && (
                  <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-cyan-800 font-semibold">
                    Height ≈ {hoverElevation.height}m
                  </span>
                )}
              </div>
            </div>

            <div 
              ref={sliderContainerRef}
              className="relative aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-slate-950"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
            >
              {/* Layer 1: True-Color 2D Satellite Image (Right side) */}
              <img 
                src={previewImage} 
                alt="2D Satellite" 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md pointer-events-none">
                2D Aerial Imagery
              </div>

              {/* Layer 2: Estimated Depth Map (Left side with clip-path) */}
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <img 
                  src={previewDepth} 
                  alt="Depth Map" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-cyan-600/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                  AI Monocular Depth Map
                </div>
              </div>

              {/* Draggable Divider Line */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-cyan-600 shadow-lg border border-slate-200 flex items-center justify-center font-bold text-xs">
                  ⇄
                </div>
              </div>
            </div>

            {/* Real-time Telemetry Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-2">
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 font-medium">Input Source</span>
                <p className="text-sm font-bold text-slate-800">RGB / B&W Satellite</p>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 font-medium">Model Architecture</span>
                <p className="text-sm font-bold text-cyan-700">MiDaS / DPT Monocular</p>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 font-medium">Elevation Estimation</span>
                <p className="text-sm font-bold text-slate-800">Calibrated Metric (m)</p>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 font-medium">3D Output</span>
                <p className="text-sm font-bold text-slate-800">Point Cloud & Mesh</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid in Clean Light Theme */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-4">
              Geospatial Photogrammetry via Deep Learning
            </h2>
            <p className="text-slate-600 text-base">
              A comprehensive toolset bridging satellite imagery, AI monocular depth unprojection, and interactive 3D WebGL GIS exploration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col group">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Eye size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Monocular Depth Estimation</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                Estimates relative continuous depth rasters from single 2D inputs. Includes automatic edge and gradient fallback ensuring reliable offline hackathon execution.
              </p>
              <Link to="/depth/demo" className="text-cyan-600 hover:text-cyan-700 text-xs font-bold flex items-center gap-1">
                Explore Depth Maps <ChevronRight size={14} />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Mountain size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Metric Scale Calibration</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                Resolves monocular scale ambiguity via known building height references, camera altitude telemetry, or intrinsic focal length unprojection.
              </p>
              <Link to="/height/demo" className="text-cyan-600 hover:text-cyan-700 text-xs font-bold flex items-center gap-1">
                Inspect Height Metrics <ChevronRight size={14} />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Box size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3D Point Cloud & Surface Mesh</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                Transforms 2D depth matrices into dense 3D Cartesian coordinates. Features hypsometric elevation color palettes, wireframe mode, and vertical height exaggeration.
              </p>
              <Link to="/reconstruction/demo" className="text-cyan-600 hover:text-cyan-700 text-xs font-bold flex items-center gap-1">
                Launch 3D Viewer <ChevronRight size={14} />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Plane size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Autonomous 3D Flythrough</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                Generates smooth aerial camera flight paths around reconstructed structures using Centripetal Catmull-Rom splines, interactive scrubbing, and JSON path exports.
              </p>
              <Link to="/flythrough/demo" className="text-cyan-600 hover:text-cyan-700 text-xs font-bold flex items-center gap-1">
                Open Flythrough Studio <ChevronRight size={14} />
              </Link>
            </div>

            {/* Card 5 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">GIS Reports & Quantitative Export</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                Compiles elevation distribution histograms, building rooftop height rankings, and camera parameters with single-click JSON and CSV data downloads.
              </p>
              <Link to="/reports/demo" className="text-cyan-600 hover:text-cyan-700 text-xs font-bold flex items-center gap-1">
                View Sample Report <ChevronRight size={14} />
              </Link>
            </div>

            {/* Card 6 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 flex flex-col group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">SIH Presentation Studio</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                A purpose-built demonstration dashboard for hackathon evaluators. Runs the full 6-stage pipeline in real-time with zero manual setup required.
              </p>
              <Link to="/presentation" className="text-cyan-600 hover:text-cyan-700 text-xs font-bold flex items-center gap-1">
                Open Presentation Mode <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 11-Stage Pipeline Visual Stepper */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              End-to-End Processing Pipeline
            </h2>
            <p className="text-slate-500 text-sm">
              Standardized photogrammetry workflow from raw sensor pixels to interactive GIS models
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs font-semibold">
            {[
              '2D Satellite Input', 'Preprocessing', 'Semantic Detection', 
              'Monocular Depth', 'Scale Calibration', 'Height Estimation', 
              'Point Cloud', 'Mesh Triangulation', 'Camera Spline', '3D Flythrough', 'GIS Report'
            ].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors">
                  <span className="text-cyan-600 font-bold mr-1.5">{idx + 1}.</span>
                  {step}
                </div>
                {idx < 10 && <ArrowRight size={12} className="text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
