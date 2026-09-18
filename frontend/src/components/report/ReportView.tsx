import React from 'react';
import { useStore } from '../../store/useStore';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Download, FileJson, FileSpreadsheet, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Badge from '../ui/Badge';
import { getMediaUrl } from '../../api/client';

const ReportView: React.FC = () => {
  const { currentProject, depthResult, heightData, originalImageUrl, depthImageUrl, calibration, reconstructionInfo, isDemo } = useStore();

  const exportJSON = () => {
    const report = {
      project: currentProject || { name: 'DepthWizard Analysis', id: 'current' },
      depth: depthResult,
      heights: heightData,
      calibration,
      reconstruction: reconstructionInfo,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depthwizard_report_${Date.now()}.json`;
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
    a.download = `depthwizard_heights_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Prepare chart data
  const buildingChartData = heightData?.buildings?.slice(0, 10).map((b) => ({
    name: `Bldg #${b.id}`,
    height: b.estimated_height,
  })) || [];

  const chartColors = ['#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3', '#db2777'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Analysis Report</h1>
          <p className="text-gray-500">
            Project: {currentProject?.name || 'Satellite Scene Analysis'} {currentProject?.id ? `• ID: ${currentProject.id}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={exportJSON} className="gap-2">
            <FileJson size={16} /> JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCSV} className="gap-2">
            <FileSpreadsheet size={16} /> CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} className="gap-2">
            <Printer size={16} /> Print / PDF
          </Button>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-navy-800">Visual Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-0 overflow-hidden">
            <div className="bg-gray-100 p-2 text-center text-sm font-semibold text-gray-600 border-b">Input Image</div>
            <div className="aspect-video bg-gray-950 flex items-center justify-center">
              {originalImageUrl ? (
                <img src={getMediaUrl(originalImageUrl)} alt="Input" className="object-contain h-full w-full" />
              ) : (
                <span className="text-gray-400 text-sm">No image available</span>
              )}
            </div>
          </Card>
          <Card className="p-0 overflow-hidden">
            <div className="bg-gray-100 p-2 text-center text-sm font-semibold text-gray-600 border-b">Estimated Depth Map</div>
            <div className="aspect-video bg-gray-950 flex items-center justify-center">
              {depthImageUrl ? (
                <img src={getMediaUrl(depthImageUrl)} alt="Depth" className="object-contain h-full w-full" />
              ) : (
                <span className="text-gray-400 text-sm">Processing depth...</span>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-navy-800">Metrics & Processing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Processing Metadata">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><dt className="text-gray-500">Status:</dt><dd><Badge variant="success">Completed</Badge></dd></div>
              <div className="flex justify-between border-b pb-2"><dt className="text-gray-500">Model Used:</dt><dd className="font-mono">{depthResult?.model_used || 'MiDaS (Monocular Depth)'}</dd></div>
              <div className="flex justify-between border-b pb-2"><dt className="text-gray-500">Inference Time:</dt><dd className="font-mono">{depthResult ? `${depthResult.inference_time.toFixed(2)} s` : 'N/A'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Mode:</dt><dd>{isDemo ? '🔬 Demo Simulation' : '📡 Calibrated Production'}</dd></div>
            </dl>
          </Card>
          
          <Card title="Height Summary (Meters)">
             <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><dt className="text-gray-500">Min Elevation:</dt><dd className="font-bold">{heightData ? `${heightData.min_height.toFixed(1)} m` : '0.0 m'}</dd></div>
              <div className="flex justify-between border-b pb-2"><dt className="text-gray-500">Max Elevation:</dt><dd className="font-bold">{heightData ? `${heightData.max_height.toFixed(1)} m` : '0.0 m'}</dd></div>
              <div className="flex justify-between border-b pb-2"><dt className="text-gray-500">Mean Elevation:</dt><dd className="font-bold">{heightData ? `${heightData.mean_height.toFixed(1)} m` : '0.0 m'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Structures Detected:</dt><dd className="font-semibold">{heightData?.num_buildings || heightData?.buildings?.length || 0}</dd></div>
            </dl>
          </Card>
        </div>
      </section>

      {buildingChartData.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-navy-800">Top Detected Building Heights</h2>
          <Card>
            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                  <Tooltip />
                  <Bar dataKey="height" radius={[4, 4, 0, 0]}>
                    {buildingChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
};

export default ReportView;
