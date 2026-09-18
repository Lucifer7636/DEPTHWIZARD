import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ProcessingPage = lazy(() => import('./pages/ProcessingPage'));
const DepthPage = lazy(() => import('./pages/DepthPage'));
const HeightPage = lazy(() => import('./pages/HeightPage'));
const ReconstructionPage = lazy(() => import('./pages/ReconstructionPage'));
const FlythroughPage = lazy(() => import('./pages/FlythroughPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PresentationPage = lazy(() => import('./pages/PresentationPage'));

const App = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen bg-slate-900 text-white font-mono">Initializing DepthWizard...</div>}>
      <BrowserRouter>
        <Routes>
          <Route path="/presentation" element={<PresentationPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="demo" element={<Navigate to="/upload" replace />} />
            <Route path="processing/:id?" element={<ProcessingPage />} />
            <Route path="depth/:id?" element={<DepthPage />} />
            <Route path="height/:id?" element={<HeightPage />} />
            <Route path="reconstruction/:id?" element={<ReconstructionPage />} />
            <Route path="flythrough/:id?" element={<FlythroughPage />} />
            <Route path="reports/:id?" element={<ReportPage />} />
            <Route path="report/:id?" element={<ReportPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Suspense>
  );
};

export default App;
