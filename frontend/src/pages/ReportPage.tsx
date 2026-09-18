import React from 'react';
import { useStore } from '../store/useStore';
import { FileText, Download, BarChart3, Mountain, Cpu, Calendar, Image as ImageIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMediaUrl } from '../api/client';

const ReportPage: React.FC = () => {
  const depthResult = useStore(state => state.depthResult);
  const heightData = useStore(state => state.heightData);
  const calibration = useStore(state => state.calibration);
  const reconstructionInfo = useStore(state => state.reconstructionInfo);
  const isDemo = useStore(state => state.isDemo);
  const originalImageUrl = useStore(state => state.originalImageUrl);
  const depthImageUrl = useStore(state => state.depthImageUrl);

  const buildingChartData = heightData?.buildings?.map((b, i) => ({
    name: `Building ${b.id}`,
    height: b.estimated_height,
  })) || [];

  const exportJSON = () => {
    const report = {
      project: { name: 'DepthWizard Analysis', date: new Date().toISOString(), is_demo: isDemo },
      depth: depthResult,
      heights: heightData,
      calibration,
      reconstruction: reconstructionInfo,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'depthwizard_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!heightData?.buildings) return;
    const header = 'Building ID,Estimated Height (m),Min Height (m),Max Height (m),Mean Height (m),Area (px)\n';
    const rows = heightData.buildings.map(b =>
      `${b.id},${b.estimated_height},${b.min_height},${b.max_height},${b.mean_height},${b.area_pixels}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'depthwizard_heights.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#0891b2', '#0d9488', '#059669', '#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-cyan-600" /> Analysis Report
          </h1>
          <p className="text-gray-500 mt-1">Complete processing results and height analysis</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportJSON} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button onClick={exportCSV} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Project</span><p className="font-medium">DepthWizard Analysis</p></div>
          <div><span className="text-gray-500">Date</span><p className="font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date().toLocaleDateString()}</p></div>
          <div><span className="text-gray-500">Mode</span><p className="font-medium">{isDemo ? '🔬 Demo' : '📡 Live Analysis'}</p></div>
          <div><span className="text-gray-500">Model</span><p className="font-medium flex items-center gap-1"><Cpu className="w-3 h-3" />{depthResult?.model_used || 'N/A'}</p></div>
        </div>
      </div>

      {/* Image Thumbnails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Input Image</div>
          <div className="p-3 bg-gray-900 flex justify-center">{originalImageUrl ? <img src={getMediaUrl(originalImageUrl)} alt="Input" className="max-h-48 object-contain" /> : <p className="text-gray-500 py-8">N/A</p>}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Depth Map</div>
          <div className="p-3 bg-gray-900 flex justify-center">{depthImageUrl ? <img src={getMediaUrl(depthImageUrl)} alt="Depth" className="max-h-48 object-contain" /> : <p className="text-gray-500 py-8">N/A</p>}</div>
        </div>
      </div>

      {/* Height Stats */}
      {heightData && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Mountain className="w-5 h-5 text-cyan-600" /> Height Analysis</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-xs text-blue-600 mb-1">Min Height</p><p className="text-2xl font-bold text-blue-900">{heightData.min_height.toFixed(1)} m</p></div>
            <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-xs text-green-600 mb-1">Mean Height</p><p className="text-2xl font-bold text-green-900">{heightData.mean_height.toFixed(1)} m</p></div>
            <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-xs text-red-600 mb-1">Max Height</p><p className="text-2xl font-bold text-red-900">{heightData.max_height.toFixed(1)} m</p></div>
            <div className="bg-purple-50 rounded-xl p-4 text-center"><p className="text-xs text-purple-600 mb-1">Buildings</p><p className="text-2xl font-bold text-purple-900">{heightData.num_buildings}</p></div>
          </div>
          <p className="text-xs text-gray-500">
            Confidence: {(heightData.confidence * 100).toFixed(0)}% · {heightData.unit} · 
            Scale factor: {heightData.scale_factor.toFixed(2)}
          </p>
        </div>
      )}

      {/* Building Heights Chart */}
      {buildingChartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-600" /> Building Heights</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={buildingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
              <Tooltip />
              <Bar dataKey="height" radius={[4, 4, 0, 0]}>
                {buildingChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reconstruction Info */}
      {reconstructionInfo && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3D Reconstruction</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Point Cloud Points</span><p className="font-bold text-lg">{reconstructionInfo.num_points.toLocaleString()}</p></div>
            <div><span className="text-gray-500">Mesh Faces</span><p className="font-bold text-lg">{reconstructionInfo.num_faces.toLocaleString()}</p></div>
          </div>
        </div>
      )}

      {/* Depth Stats */}
      {depthResult && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Depth Estimation Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Min Depth</span><p className="font-medium">{depthResult.min_depth.toFixed(4)}</p></div>
            <div><span className="text-gray-500">Max Depth</span><p className="font-medium">{depthResult.max_depth.toFixed(4)}</p></div>
            <div><span className="text-gray-500">Mean Depth</span><p className="font-medium">{depthResult.mean_depth.toFixed(4)}</p></div>
            <div><span className="text-gray-500">Inference Time</span><p className="font-medium">{depthResult.inference_time.toFixed(3)}s</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
