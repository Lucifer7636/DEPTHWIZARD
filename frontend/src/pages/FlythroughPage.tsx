import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SceneViewer from '../components/three/SceneViewer';
import ViewerControls from '../components/three/ViewerControls';
import { useStore } from '../store/useStore';
import { Play, Pause, Square, RotateCcw, Download, Camera, Sparkles, Navigation, Compass } from 'lucide-react';
import Button from '../components/ui/Button';
import { client } from '../api/client';

const FlythroughPage: React.FC = () => {
  const { id } = useParams();
  const { 
    flythroughPlaying, 
    setFlythroughPlaying, 
    flythroughProgress, 
    setFlythroughProgress, 
    cameraPath, 
    reconstructionInfo,
    pointCloudData,
    setPointCloudData,
    setMeshData,
    setCameraPath,
    flythroughDuration,
    setFlythroughDuration,
    setReconstructionInfo,
    setHeightData,
    setCalibration,
    setIsDemo
  } = useStore();

  const [mode, setMode] = useState<'follow' | 'free'>('follow');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Auto-load 3D model if directly visited or refreshed
  useEffect(() => {
    if (!pointCloudData && !reconstructionInfo) {
      if (id && id !== 'demo') {
        const projId = parseInt(id, 10);
        if (!isNaN(projId)) {
          client.getProjectImage(projId).then(imgData => {
            if (imgData) {
              const baseName = imgData.filename.replace(/\.[^/.]+$/, '');
              setIsDemo(false);
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
          }).catch(console.error);
          return;
        }
      }

      client.runDemo().then(result => {
        setIsDemo(true);
        setHeightData(result.heights);
        setCalibration(result.calibration);
        setReconstructionInfo(result.reconstruction);
        setCameraPath(result.flythrough.path);

        if (result.reconstruction.point_cloud_path) {
          client.loadPointCloudData(result.reconstruction.point_cloud_path).then(setPointCloudData);
        }
        if (result.reconstruction.mesh_path) {
          client.loadMeshData(result.reconstruction.mesh_path).then(setMeshData);
        }
      }).catch(console.error);
    } else if (reconstructionInfo && !pointCloudData) {
      if (reconstructionInfo.point_cloud_path) {
        client.loadPointCloudData(reconstructionInfo.point_cloud_path).then(setPointCloudData).catch(console.error);
      }
      if (reconstructionInfo.mesh_path) {
        client.loadMeshData(reconstructionInfo.mesh_path).then(setMeshData).catch(console.error);
      }
    }
  }, [reconstructionInfo, pointCloudData]);

  // If no camera path, generate smooth default orbit spline
  useEffect(() => {
    if (!cameraPath || cameraPath.length === 0) {
      const defaultPath = [];
      const numSteps = 50;
      for (let i = 0; i <= numSteps; i++) {
        const t = (i / numSteps) * 2 * Math.PI;
        const radius = 8 + Math.sin(t * 2) * 2;
        const height = 4 + Math.cos(t) * 3;
        defaultPath.push({
          position: [Math.cos(t) * radius, height, Math.sin(t) * radius] as [number, number, number],
          target: [0, 0, 0] as [number, number, number],
          up: [0, 1, 0] as [number, number, number],
          time: (i / numSteps) * flythroughDuration
        });
      }
      setCameraPath(defaultPath);
    }
  }, [cameraPath, flythroughDuration]);

  const exportPathJSON = () => {
    const data = {
      description: "DepthWizard 3D Flythrough Camera Flight Path",
      duration: flythroughDuration,
      keyframes: cameraPath,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `camera_flythrough_path_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice("Camera path JSON exported successfully!");
    setTimeout(() => setExportNotice(null), 4000);
  };

  const captureCanvasScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const imgUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imgUrl;
      a.download = `depthwizard_3d_flythrough_${Date.now()}.png`;
      a.click();
      setExportNotice("Screenshot captured and downloaded!");
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  const currentTime = (flythroughProgress * flythroughDuration).toFixed(1);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100">
      {/* Light Theme Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex flex-wrap justify-between items-center shadow-xs z-20 relative gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shadow-xs">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Autonomous Cinematic Flythrough
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Centripetal Catmull-Rom spline trajectory with smooth camera orientation
            </p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-3">
          {/* Duration Selector */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
            {[15, 30, 60].map((dur) => (
              <button
                key={dur}
                onClick={() => setFlythroughDuration(dur)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  flythroughDuration === dur
                    ? 'bg-white shadow-xs text-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setMode('follow')}
              className={`px-3 py-1 rounded-lg transition-all ${mode === 'follow' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600'}`}
            >
              Spline Path
            </button>
            <button
              onClick={() => setMode('free')}
              className={`px-3 py-1 rounded-lg transition-all ${mode === 'free' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600'}`}
            >
              Free Orbit
            </button>
          </div>
          
          <Button variant="secondary" size="sm" onClick={exportPathJSON} className="gap-1.5 text-xs font-bold py-2">
            <Download size={14} /> Export Path JSON
          </Button>
          <Button size="sm" onClick={captureCanvasScreenshot} className="gap-1.5 text-xs font-bold py-2 bg-slate-900 hover:bg-slate-800 text-white">
            <Camera size={14} /> Capture 3D Frame
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="absolute top-16 right-6 z-30 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
          ✓ {exportNotice}
        </div>
      )}
      
      {/* 3D Scene Viewport */}
      <div className="flex-grow relative bg-slate-100 overflow-hidden">
        <SceneViewer showFlythrough={mode === 'follow'} />
        <ViewerControls />
        
        {/* Floating Light Theme Transport Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl shadow-slate-400/30 border border-slate-200/90 flex flex-col gap-3 min-w-[340px] sm:min-w-[460px] text-slate-800 z-20">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-mono font-bold text-cyan-700 min-w-[45px]">
              {currentTime}s
            </span>
            <div className="flex-1 relative">
              <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-75"
                  style={{ width: `${flythroughProgress * 100}%` }}
                />
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.001"
                value={flythroughProgress}
                onChange={(e) => setFlythroughProgress(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs font-mono text-slate-400 min-w-[45px] text-right font-semibold">
              {flythroughDuration}.0s
            </span>
          </div>
          
          <div className="flex justify-center items-center gap-4">
            <button 
              onClick={() => { setFlythroughPlaying(false); setFlythroughProgress(0); }}
              title="Restart from origin"
              className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={() => setFlythroughPlaying(false)}
              title="Stop playback"
              className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Square size={18} />
            </button>
            <button 
              onClick={() => setFlythroughPlaying(!flythroughPlaying)}
              title={flythroughPlaying ? "Pause Flight" : "Play Flight"}
              className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95 pl-0.5"
            >
              {flythroughPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlythroughPage;
