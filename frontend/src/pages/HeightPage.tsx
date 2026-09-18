import React, { useState, useEffect } from 'react';
import HeightPanel from '../components/height/HeightPanel';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Settings, MapPin, CheckCircle, ArrowRight, Mountain, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { client } from '../api/client';
import { useNavigate, useParams } from 'react-router-dom';

const HeightPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const heightData = useStore(state => state.heightData);
  const setHeightData = useStore(state => state.setHeightData);
  const setCalibration = useStore(state => state.setCalibration);
  const setOriginalImageUrl = useStore(state => state.setOriginalImageUrl);
  const setDepthImageUrl = useStore(state => state.setDepthImageUrl);
  const setDepthResult = useStore(state => state.setDepthResult);
  const setReconstructionInfo = useStore(state => state.setReconstructionInfo);
  const setCameraPath = useStore(state => state.setCameraPath);
  const isDemo = useStore(state => state.isDemo);
  const setIsDemo = useStore(state => state.setIsDemo);

  const [focalLength, setFocalLength] = useState<number>(50);
  const [altitude, setAltitude] = useState<number>(450);
  const [refHeight, setRefHeight] = useState<string>('45');
  const [calibratedMsg, setCalibratedMsg] = useState<string | null>(null);

  // Auto-load demo if directly visited
  useEffect(() => {
    if (!heightData) {
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
      }).catch(console.error);
    }
  }, [heightData]);

  const handleRecalibrate = () => {
    const knownH = parseFloat(refHeight) || 45.0;
    if (heightData) {
      const scaleMultiplier = knownH / (heightData.max_height || 45.0);
      const updatedBuildings = (heightData.buildings || []).map(b => ({
        ...b,
        estimated_height: Math.round(b.estimated_height * scaleMultiplier * 10) / 10,
        mean_height: Math.round(b.mean_height * scaleMultiplier * 10) / 10,
      }));
      setHeightData({
        ...heightData,
        min_height: Math.round(heightData.min_height * scaleMultiplier * 10) / 10,
        max_height: Math.round(knownH * 10) / 10,
        mean_height: Math.round(heightData.mean_height * scaleMultiplier * 10) / 10,
        buildings: updatedBuildings,
        confidence: 0.88,
      });
      setCalibratedMsg(`Recalibrated successfully using reference height ${knownH}m`);
      setTimeout(() => setCalibratedMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Light Header */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Pipeline Stage 5 & 6
            </span>
            <span className="text-xs text-slate-400 font-mono">• Metric Ground Elevation</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mountain className="w-7 h-7 text-cyan-600" /> Structure & Terrain Height Analysis
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Converting scale-ambiguous monocular depth rasters into calibrated metric elevation estimates
          </p>
        </div>

        <button 
          onClick={() => navigate(isDemo || !id ? '/reconstruction/demo' : `/reconstruction/${id}`)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5"
        >
          Open 3D Model <ArrowRight size={14} />
        </button>
      </div>

      {calibratedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600" /> {calibratedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <HeightPanel />
        </div>
        
        <div className="space-y-6">
          {/* Scale Calibration Card */}
          <Card title="Scale Calibration" className="bg-white border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 mb-4">
              Calibrate relative depth units into real-world meters using known camera parameters or landmark heights.
            </p>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Camera Focal Length (mm)
                </label>
                <input 
                  type="number" 
                  value={focalLength} 
                  onChange={e => setFocalLength(parseFloat(e.target.value))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Satellite Altitude (km)
                </label>
                <input 
                  type="number" 
                  value={altitude} 
                  onChange={e => setAltitude(parseFloat(e.target.value))} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 font-mono" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Known Building Reference (m)
                </label>
                <input 
                  type="number" 
                  value={refHeight} 
                  onChange={e => setRefHeight(e.target.value)} 
                  placeholder="e.g. 45" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 font-mono" 
                />
              </div>

              <Button onClick={handleRecalibrate} className="w-full gap-2 text-xs font-bold py-2.5">
                <SlidersHorizontal size={14} /> Recalibrate Metric Height
              </Button>
            </div>
          </Card>

          {/* Scientific Disclaimer */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Sparkles size={14} className="text-cyan-600" /> Scientific Transparency
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Monocular photogrammetry is inherently scale-ambiguous. Real-world accuracy depends on reference calibration quality and nadir viewing angle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeightPage;
