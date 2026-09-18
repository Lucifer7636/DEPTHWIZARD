import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Layers, Box, Upload, Play, BarChart2, Eye, Mountain, 
  Plane, FileText, Info, Sparkles, Activity, Server
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { testBackendConnection } from '../../api/client';
import BackendConfigModal from '../common/BackendConfigModal';

export const Navbar = () => {
  const location = useLocation();
  const modelAvailable = useStore(state => state.modelAvailable);
  const setModelAvailable = useStore(state => state.setModelAvailable);
  const isDemo = useStore(state => state.isDemo);

  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const checkStatus = () => {
    testBackendConnection().then(res => {
      setIsBackendOnline(res.ok);
      if (res.modelAvailable !== undefined) {
        setModelAvailable(res.modelAvailable);
      }
    });
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
    { path: '/upload', label: 'Analysis', icon: <Upload size={16} /> },
    { path: '/depth/demo', label: 'Depth Map', icon: <Eye size={16} /> },
    { path: '/height/demo', label: 'Height', icon: <Mountain size={16} /> },
    { path: '/reconstruction/demo', label: '3D Viewer', icon: <Box size={16} /> },
    { path: '/flythrough/demo', label: 'Flythrough', icon: <Plane size={16} /> },
    { path: '/reports/demo', label: 'Reports', icon: <FileText size={16} /> },
    { path: '/about', label: 'About', icon: <Info size={16} /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">
                    DEPTH<span className="text-cyan-600">WIZARD</span>
                  </span>
                  <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200">
                    SIH 2026
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path.includes('/demo') && location.pathname.startsWith(link.path.split('/demo')[0]));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-700 shadow-xs border border-cyan-200/60 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2.5">
              {/* Backend Status Pill */}
              <button
                onClick={() => setIsConfigModalOpen(true)}
                title="Click to configure backend URL (e.g. Railway URL)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all hover:opacity-90 ${
                  isBackendOnline === true
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : isBackendOnline === false
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  isBackendOnline === true 
                    ? 'bg-emerald-500' 
                    : isBackendOnline === false 
                    ? 'bg-rose-500' 
                    : 'bg-slate-400'
                }`} />
                <span className="hidden xs:inline">
                  {isBackendOnline === true 
                    ? 'Backend Online' 
                    : isBackendOnline === false 
                    ? 'Backend Offline' 
                    : 'Checking Backend...'}
                </span>
              </button>

              {/* System Engine Status Pill */}
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
                <span className={`w-2 h-2 rounded-full ${modelAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-[11px] font-medium text-slate-600">
                  {modelAvailable ? 'PyTorch CUDA' : 'Heuristic Engine'}
                </span>
              </div>

              {/* Presentation Mode Button */}
              <Link
                to="/presentation"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 hover:shadow-cyan-600/30 transition-all hover:scale-[1.02]"
              >
                <Sparkles size={14} className="text-cyan-200" />
                Presentation
              </Link>
            </div>
          </div>
        </div>
      </header>

      <BackendConfigModal 
        isOpen={isConfigModalOpen} 
        onClose={() => setIsConfigModalOpen(false)} 
        onConnected={checkStatus} 
      />
    </>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 py-8 mt-auto text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
            D
          </div>
          <span className="font-semibold text-slate-700">DepthWizard</span>
          <span className="text-slate-300">•</span>
          <span>Smart India Hackathon 2026</span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-cyan-600 font-medium">Problem Statement 26175</span>
        </div>
        
        <div className="flex items-center gap-6 text-slate-500">
          <Link to="/about" className="hover:text-cyan-600 transition-colors">Methodology</Link>
          <Link to="/upload?demo=true" className="hover:text-cyan-600 transition-colors">Demo Mode</Link>
          <Link to="/reports/demo" className="hover:text-cyan-600 transition-colors">Export GIS Report</Link>
          <span className="text-slate-400">v1.0 Production Prototype</span>
        </div>
      </div>
    </footer>
  );
};

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-cyan-100 selection:text-cyan-900">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
