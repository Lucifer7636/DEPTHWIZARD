import React from 'react';
import { useStore } from '../../store/useStore';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { getMediaUrl } from '../../api/client';

const DepthMapViewer: React.FC = () => {
  const currentProject = useStore(state => state.currentProject);
  const depthResult = useStore(state => state.depthResult);
  const originalImageUrl = useStore(state => state.originalImageUrl);
  const depthImageUrl = useStore(state => state.depthImageUrl);
  const isDemo = useStore(state => state.isDemo);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-navy-900">Depth Estimation Results</h3>
        {isDemo && <Badge variant="warning">Demo Mode</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Original Image" className="flex flex-col">
          <div className="aspect-video bg-gray-950 flex items-center justify-center overflow-hidden rounded-lg mt-2">
            {originalImageUrl ? (
              <img src={getMediaUrl(originalImageUrl)} alt="Original" className="object-contain w-full h-full" />
            ) : (
              <span className="text-gray-400">No image available</span>
            )}
          </div>
        </Card>
        
        <Card title="Estimated Depth Map (AI Monocular)" className="flex flex-col">
          <div className="aspect-video bg-gray-950 flex items-center justify-center overflow-hidden rounded-lg mt-2">
             {depthImageUrl ? (
              <img src={getMediaUrl(depthImageUrl)} alt="Depth Map" className="object-contain w-full h-full" />
            ) : (
              <span className="text-gray-400">Processing depth map...</span>
            )}
          </div>
        </Card>
      </div>

      {depthResult && (
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Min Depth</p>
              <p className="text-lg font-mono text-navy-900">{depthResult.min_depth.toFixed(3)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Max Depth</p>
              <p className="text-lg font-mono text-navy-900">{depthResult.max_depth.toFixed(3)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Mean Depth</p>
              <p className="text-lg font-mono text-navy-900">{depthResult.mean_depth.toFixed(3)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Inference Time</p>
              <p className="text-lg font-mono text-navy-900">{depthResult.inference_time.toFixed(2)} s</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
            <span className="text-gray-500">Model Engine:</span>
            <span className="font-semibold text-navy-700">{depthResult.model_used}</span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DepthMapViewer;
