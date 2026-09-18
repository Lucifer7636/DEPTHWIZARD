import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, className = '' }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  let colorClass = 'bg-blue-600';
  if (clampedValue === 100) colorClass = 'bg-green-500';
  else if (clampedValue > 50) colorClass = 'bg-cyan-500';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-1 text-sm font-medium text-navy-700">
          <span>{label}</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`} 
          style={{ width: `${clampedValue}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
