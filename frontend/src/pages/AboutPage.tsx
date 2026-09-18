import React from 'react';
import Card from '../components/ui/Card';
import { Brain, Mountain, Box, Map, Info, AlertTriangle, Code2, Plane, Sparkles, CheckCircle2 } from 'lucide-react';
import Badge from '../components/ui/Badge';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold">
          <Sparkles size={14} className="text-cyan-600" /> Smart India Hackathon 2026
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          About DepthWizard
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          An advanced AI-driven photogrammetric system converting single 2D satellite and aerial imagery into calibrated, interactive 3D terrain and structure models.
        </p>
      </div>

      {/* Methodology Timeline */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2.5">
          <Brain className="text-cyan-600" /> Computational Pipeline Methodology
        </h2>
        
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 font-bold text-sm border border-cyan-100">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Image Ingestion & Preprocessing</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Ingests JPG, PNG, and TIFF formats. Performs automated RGB vs Black & White variance analysis, CLAHE contrast enhancement, bilateral edge-preserving smoothing, and resolution normalization up to 1024px.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm border border-blue-100">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monocular Depth Estimation</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Employs the MiDaS DPT (Dense Prediction Transformer) architecture trained with scale-and-shift invariant loss L_ssi. Seamlessly falls back to a deterministic edge-gradient distance-transform heuristic for guaranteed offline execution on CPU laptops.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm border border-indigo-100">
              3
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Scale Calibration & Height Extraction</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Converts scale-ambiguous continuous depth rasters to metric units using pinhole camera intrinsic parameters (focal length + satellite altitude) or known reference structures, isolating ground planes and measuring rooftop elevations.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold text-sm border border-purple-100">
              4
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">3D Point Cloud & Surface Mesh Triangulation</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Back-projects calibrated depth maps into dense 3D Cartesian coordinates \((X, Y, Z)\) with hypsometric Turbo/Viridis elevation shading, constructing an interactive regular heightfield surface mesh rendered via Three.js and React Three Fiber.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm border border-emerald-100">
              5
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Autonomous Aerial Flythrough</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Calculates smooth, continuous camera flight path trajectories around reconstructed landmarks using Centripetal Catmull-Rom splines (\(\alpha=0.5\)), featuring interactive transport controls, timeline scrubbing, and JSON path exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack & Scientific Transparency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Code2 className="text-cyan-600" /> Technology Architecture
          </h2>
          <Card className="border border-slate-200 shadow-xs">
            <div className="flex flex-wrap gap-2">
              {['React 18', 'TypeScript', 'Vite', 'Three.js', 'React Three Fiber', 'Drei', 'Zustand', 'Tailwind CSS', 'Recharts', 'Python 3.11+', 'FastAPI', 'PyTorch', 'OpenCV', 'NumPy', 'SciPy', 'SQLite', 'aiosqlite'].map(tech => (
                <span key={tech} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                  {tech}
                </span>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" /> Scientific Transparency
          </h2>
          <Card className="border border-slate-200 shadow-xs">
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Monocular depth is inherently scale-ambiguous; estimated heights are calibrated metrics and labeled as estimates.</li>
              <li>Nadir nadir views contain limited facade texture; vertical building walls are interpolated via heightfield unprojection.</li>
              <li>Dark cast shadows and deep water bodies may produce depth artifacts, mitigated by adaptive thresholding.</li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
