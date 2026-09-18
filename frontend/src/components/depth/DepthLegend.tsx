import React from 'react';

const DepthLegend: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="h-64 w-8 rounded-full bg-gradient-to-t from-blue-600 via-green-400 to-red-500 shadow-inner"></div>
      <div className="h-64 flex flex-col justify-between py-2 ml-3 absolute right-0 text-xs font-semibold text-gray-600">
        <span>FAR</span>
        <span>MID</span>
        <span>NEAR</span>
      </div>
    </div>
  );
};

export default DepthLegend;
