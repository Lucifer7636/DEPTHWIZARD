import React from 'react';
import { PipelineStage } from '../../types';
import { CheckCircle, Circle, Loader2, XCircle, Image as ImageIcon, Cpu, Layers, Database, Move3d, Route, FileText, Camera, Box, Activity } from 'lucide-react';

interface PipelineTrackerProps {
  stages: PipelineStage[];
  currentStage: number; // index
}

const STAGE_ICONS = [
  ImageIcon, Activity, Cpu, Layers, Box, Move3d, Database, Box, Route, Camera, FileText
];

const PipelineTracker: React.FC<PipelineTrackerProps> = ({ stages, currentStage }) => {
  return (
    <div className="relative">
      <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gray-200"></div>
      
      <div className="flex flex-col gap-6 relative z-10">
        {stages.map((stage, index) => {
          const Icon = STAGE_ICONS[index] || Circle;
          const isCompleted = index < currentStage || stage.status === 'completed';
          const isRunning = index === currentStage || stage.status === 'running';
          const isFailed = stage.status === 'failed';
          const isPending = index > currentStage || stage.status === 'pending';

          let iconColor = 'text-gray-300 bg-white border-gray-300';
          if (isCompleted) iconColor = 'text-green-500 bg-white border-green-500';
          if (isRunning) iconColor = 'text-blue-500 bg-blue-50 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
          if (isFailed) iconColor = 'text-red-500 bg-white border-red-500';

          return (
            <div key={stage.id} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${iconColor}`}>
                {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                 isFailed ? <XCircle className="w-5 h-5" /> : 
                 <Icon className="w-5 h-5" />}
              </div>
              
              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${isRunning ? 'text-blue-700' : isCompleted ? 'text-gray-900' : isFailed ? 'text-red-700' : 'text-gray-500'}`}>
                  {stage.name}
                </h4>
                {stage.error && (
                  <p className="text-xs text-red-500 mt-1">{stage.error}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineTracker;
