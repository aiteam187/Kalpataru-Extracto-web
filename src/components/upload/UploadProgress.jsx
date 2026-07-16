// ============================================
// FILE: src/components/upload/UploadProgress.jsx (PROFESSIONAL REDESIGN)
// ============================================
import React from "react";

/**
 * Professional Upload Progress Component
 * Clean progress bar with percentage display
 */
const UploadProgress = ({ progress = 0 }) => {
  return (
    <div className="w-full">
      {/* Progress Label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Processing Progress
        </span>
        <span className="text-sm font-semibold text-teal-600">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress Bar Fill */}
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status Text */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        {progress < 30 && "Uploading document..."}
        {progress >= 30 && progress < 60 && "Extracting data..."}
        {progress >= 60 && progress < 90 && "Validating information..."}
        {progress >= 90 && "Almost done..."}
      </p>
    </div>
  );
};

export default UploadProgress;
