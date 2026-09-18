import React, { useState, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  projectId?: number | string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isBw, setIsBw] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/jpg', 'image/webp'];
    return validTypes.includes(file.type) || /\.(jpe?g|png|tiff?|webp)$/i.test(file.name);
  };

  const inspectImage = (selectedFile: File) => {
    const objectUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(objectUrl);

    // Read dimensions and sample pixels to detect RGB vs B&W
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = Math.min(img.naturalWidth, 64);
        canvas.height = Math.min(img.naturalHeight, 64);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let isMonochrome = true;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          if (Math.abs(r - g) > 8 || Math.abs(r - b) > 8) {
            isMonochrome = false;
            break;
          }
        }
        setIsBw(isMonochrome);
      }
    };
    img.src = objectUrl;

    // Simulate upload progress
    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        onUpload(selectedFile);
      }
    }, 60);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        inspectImage(droppedFile);
      } else {
        alert("Invalid file type. Please upload JPG, PNG, or TIFF.");
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        inspectImage(selectedFile);
      } else {
        alert("Invalid file type. Please upload JPG, PNG, or TIFF.");
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setDimensions(null);
  };

  return (
    <div className="w-full">
      {!file ? (
        <div 
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            dragActive ? 'border-cyan-500 bg-cyan-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            accept=".jpg,.jpeg,.png,.tiff,.tif,.webp"
            onChange={handleChange}
          />
          <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-1">Drag and drop satellite imagery here</p>
          <p className="text-sm text-gray-500">Supports RGB or Black & White imagery</p>
          <p className="text-xs text-gray-400 mt-4">Formats: JPG, PNG, TIFF (Max 50MB)</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="relative h-56 bg-gray-900 flex items-center justify-center overflow-hidden">
            {previewUrl && <img src={previewUrl} alt="Preview" className="object-contain h-full w-full" />}
            <button 
              onClick={clearFile}
              className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="absolute top-3 left-3 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isBw ? 'bg-slate-700 text-white border border-slate-500' : 'bg-cyan-500 text-white'
              }`}>
                {isBw ? "BLACK & WHITE IMAGE" : "RGB IMAGE"}
              </span>
              {dimensions && (
                <span className="px-3 py-1 bg-black/60 text-gray-200 rounded-full text-xs font-medium backdrop-blur">
                  {dimensions.width} × {dimensions.height} px
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ImageIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type ? file.type.split('/')[1]?.toUpperCase() : 'IMAGE'}
                </p>
              </div>
            </div>
            
            {progress < 100 ? (
              <ProgressBar value={progress} label="Loading Image..." />
            ) : (
              <div className="flex items-center text-sm text-green-600 font-semibold">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Ready for AI Monocular Depth Processing
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
