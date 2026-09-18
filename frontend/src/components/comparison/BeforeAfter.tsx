import React from 'react';
import { ArrowRight } from 'lucide-react';

interface BeforeAfterProps {
  originalImage?: string;
  depthImage?: string;
}

const BeforeAfter: React.FC<BeforeAfterProps> = ({ originalImage, depthImage }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 w-full">
      <div className="flex-1 w-full bg-white rounded-xl shadow-sm border p-3 flex flex-col">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">2D Input</span>
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {originalImage ? <img src={originalImage} className="w-full h-full object-cover" alt="Original" /> : <span className="text-gray-400">No input</span>}
        </div>
      </div>
      
      <div className="hidden md:flex flex-col justify-center text-cyan-500 animate-pulse">
        <ArrowRight size={32} />
      </div>
      
      <div className="flex-1 w-full bg-white rounded-xl shadow-sm border p-3 flex flex-col">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">Depth Map</span>
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {depthImage ? <img src={depthImage} className="w-full h-full object-cover" alt="Depth" /> : <span className="text-gray-400">Processing...</span>}
        </div>
      </div>

      <div className="hidden md:flex flex-col justify-center text-cyan-500 animate-pulse">
        <ArrowRight size={32} />
      </div>
      
      <div className="flex-1 w-full bg-white rounded-xl shadow-sm border p-3 flex flex-col">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">3D Preview</span>
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center text-white relative">
          <div className="absolute inset-0 grid-bg opacity-30"></div>
          <span className="relative z-10 text-sm font-medium">3D Model Generated</span>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfter;
