import React from 'react';
import { useStore } from '../../store/useStore';
import { Box, Layers, Grid3X3, SlidersHorizontal, RotateCcw, Compass, Eye, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const ViewerControls: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    heightExaggeration, 
    setHeightExaggeration,
    pointSize,
    setPointSize,
    isDemo 
  } = useStore();

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-200/90 p-4 flex flex-col gap-4 w-72 z-20 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
          <Compass size={15} className="text-cyan-600" />
          <span>3D GIS Scene Controls</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
          WebGL Active
        </span>
      </div>

      {/* Render Mode Toggle */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          Visualization Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button 
            type="button"
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              viewMode === 'pointcloud' 
                ? 'bg-white text-cyan-700 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setViewMode('pointcloud')}
          >
            <Grid3X3 size={13} /> Points
          </button>

          <button 
            type="button"
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              viewMode === 'mesh' 
                ? 'bg-white text-cyan-700 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setViewMode('mesh')}
          >
            <Box size={13} /> Surface
          </button>

          <button 
            type="button"
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              viewMode === 'wireframe' 
                ? 'bg-white text-cyan-700 shadow-xs border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setViewMode('wireframe')}
          >
            <Layers size={13} /> Wire
          </button>
        </div>
      </div>

      {/* Height Exaggeration Slider */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Height Exaggeration
          </label>
          <span className="text-xs font-mono font-bold text-cyan-700 px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200">
            {heightExaggeration.toFixed(1)}×
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400 shrink-0" />
          <input 
            type="range" 
            min="0.5" 
            max="5" 
            step="0.1" 
            value={heightExaggeration}
            onChange={(e) => setHeightExaggeration(parseFloat(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>0.5×</span>
          <span>1.0×</span>
          <span>2.5×</span>
          <span>5.0×</span>
        </div>
      </div>

      {/* Point Density / Size (if point cloud mode) */}
      {viewMode === 'pointcloud' && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Point Particle Size
            </label>
            <span className="text-xs font-mono font-semibold text-slate-700">
              {pointSize}px
            </span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="6" 
            step="0.5" 
            value={pointSize}
            onChange={(e) => setPointSize(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
        </div>
      )}

      {/* Elevation Colormap Bar */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mb-1.5">
          <span>Low (0m)</span>
          <span>Elevation Shading</span>
          <span>High (50m+)</span>
        </div>
        <div 
          className="h-2.5 rounded-full w-full shadow-2xs border border-slate-200/60"
          style={{
            background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)'
          }}
        />
      </div>

      {/* Quick Tips */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-500">
        <p className="flex items-center gap-1 font-semibold text-slate-700 mb-0.5">
          <Sparkles size={12} className="text-cyan-600" /> Interactive Navigation:
        </p>
        <p>• Left Click + Drag: <strong>Orbit / Rotate</strong></p>
        <p>• Right Click + Drag: <strong>Pan Scene</strong></p>
        <p>• Scroll Wheel: <strong>Zoom In / Out</strong></p>
      </div>
    </div>
  );
};

export default ViewerControls;
