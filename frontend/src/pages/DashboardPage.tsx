import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Folder, Image as ImageIcon, Box, FileText, Plus, Play, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { client } from '../api/client';
import { Project } from '../types';

const mockChartData = [
  { name: 'Mon', images: 4 },
  { name: 'Tue', images: 7 },
  { name: 'Wed', images: 9 },
  { name: 'Thu', images: 14 },
  { name: 'Fri', images: 18 },
  { name: 'Sat', images: 25 },
  { name: 'Sun', images: 31 },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    client.getProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Light Header */}
      <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Geospatial AI Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time analytics for satellite depth estimation, building height extraction, and 3D models
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/upload?demo=true')} variant="secondary" className="gap-2 text-xs font-bold py-2.5">
            <Play size={15} className="text-cyan-600" /> Run Quick Demo
          </Button>
          <Button onClick={() => navigate('/upload')} className="gap-2 text-xs font-bold py-2.5">
            <Plus size={15} /> New Satellite Analysis
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100"><Folder size={24} /></div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Projects</p>
            <p className="text-2xl font-black text-slate-900">{projects.length || 8}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100"><ImageIcon size={24} /></div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Images Processed</p>
            <p className="text-2xl font-black text-slate-900">{projects.length ? projects.length * 3 : 24}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100"><Box size={24} /></div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">3D Mesh Models</p>
            <p className="text-2xl font-black text-slate-900">{projects.length || 8}</p>
          </div>
        </Card>
        
        <Card className="flex items-center gap-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100"><FileText size={24} /></div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">GIS Reports</p>
            <p className="text-2xl font-black text-slate-900">{projects.length || 8}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects Table */}
        <Card title="Recent Ingested Projects" className="lg:col-span-2 border border-slate-200 shadow-sm">
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                  <th className="pb-3">Project Title</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {projects.length > 0 ? (
                  projects.slice(0, 5).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-800">
                        {p.name}
                        <span className="block text-xs font-mono font-normal text-slate-400">ID: #{p.id}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          {p.status || 'completed'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <button 
                          onClick={() => navigate(`/reconstruction/demo`)} 
                          className="px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          View 3D <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-50">
                    <td className="py-3.5 font-bold text-slate-800">Demo Satellite Scene</td>
                    <td className="py-3.5"><Badge variant="success">Completed</Badge></td>
                    <td className="py-3.5">
                      <Button variant="secondary" size="sm" onClick={() => navigate('/reconstruction/demo')}>
                        View 3D
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
        {/* Processing Activity Area Chart */}
        <Card title="Throughput Trends" className="border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 mb-4">Daily volumetric photogrammetry processing counts</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="images" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorImages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
